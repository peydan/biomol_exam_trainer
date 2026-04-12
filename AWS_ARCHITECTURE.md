# AWS Architecture – ExamsApp

## Overview

This document describes a fully serverless AWS architecture for hosting the ExamsApp UI and automating the pipeline that processes new exam PDFs into structured test data available in the application.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USERS (Browser)                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Amazon CloudFront                             │
│              (CDN + HTTPS + caching + custom domain)                 │
└──────────┬───────────────────────────────────────┬───────────────────┘
           │ Static assets (JS/CSS/HTML)            │ /tests/* (JSON + images)
           ▼                                        ▼
┌─────────────────────┐                ┌────────────────────────────────┐
│   S3 – App Bucket   │                │   S3 – Tests Bucket            │
│  (React build)      │                │  public/tests/                 │
│  index.html         │                │  ├── registry.json             │
│  assets/            │                │  ├── exam-2019-a/              │
│                     │                │  │   ├── questions.json        │
└─────────────────────┘                │  │   └── image*.png            │
                                       │  └── exam-2023-a/ ...          │
                                       └──────────────┬─────────────────┘
                                                      │
                                    ┌─────────────────┴──────────────────┐
                                    │   S3 – Source PDFs Bucket          │
                                    │  source_tests/                     │
                                    │  ├── exam-2019-a.pdf               │
                                    │  └── מבחן 2023 מועד א׳.pdf        │
                                    └──────────────┬─────────────────────┘
                                                   │ s3:ObjectCreated
                                                   ▼
                                    ┌──────────────────────────────────┐
                                    │   EventBridge (S3 Event Rule)    │
                                    │   filter: source_tests/*.pdf     │
                                    └──────────────┬───────────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────────┐
                                    │   Step Functions State Machine   │
                                    │   (PDF → Test Pipeline)          │
                                    └──────────────┬───────────────────┘
                                                   │
                          ┌────────────────────────┼────────────────────────┐
                          ▼                        ▼                        ▼
               ┌──────────────────┐   ┌────────────────────┐   ┌───────────────────┐
               │ Lambda           │   │ Lambda             │   │ Lambda            │
               │ extract-pdf      │   │ parse-with-bedrock │   │ update-registry   │
               │                  │   │                    │   │                   │
               │ • pdfminer       │   │ • Calls Bedrock    │   │ • Reads existing  │
               │ • pdfimages      │   │   (Claude)         │   │   registry.json   │
               │ • Extracts text  │   │ • Produces         │   │ • Appends new     │
               │   and images     │   │   questions.json   │   │   test entry      │
               │ • Stores to S3   │   │ • Stores to S3     │   │ • Writes updated  │
               └──────────────────┘   └────────────────────┘   │   registry.json   │
                                                                │   to Tests Bucket │
                                                                └───────────────────┘
                                                                         │
                                                                         ▼
                                                          ┌──────────────────────────┐
                                                          │  CloudFront Invalidation │
                                                          │  (registry.json + new    │
                                                          │   test path)             │
                                                          └──────────────────────────┘
```

---

## Components

### 1. S3 Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `examsapp-ui` | React production build (`npm run build`) | Private, served via CloudFront |
| `examsapp-tests` | Processed test data: `registry.json`, `questions.json`, images | Private, served via CloudFront |
| `examsapp-source-pdfs` | Raw exam PDFs uploaded by admins | Private, triggers pipeline |

### 2. CloudFront Distribution

A single CloudFront distribution with two origins:

- `/` → `examsapp-ui` S3 bucket (React SPA, with `index.html` fallback for client-side routing)
- `/tests/*` → `examsapp-tests` S3 bucket (test data and images)

Enables HTTPS, custom domain (Route 53), and caching. The React app's `fetch` calls to `registry.json` and `questions.json` work without any code changes since CloudFront handles the path routing transparently.

### 3. PDF Processing Pipeline (Step Functions)

Triggered automatically when a PDF is uploaded to `examsapp-source-pdfs`. The state machine orchestrates three Lambda functions in sequence:

#### Step 1 – `extract-pdf` Lambda
- Downloads the PDF from S3
- Runs `pdfminer` to extract text → stores `extracted_text.txt` to a temp S3 prefix
- Runs `pdfimages` to extract images → stores raw images to a temp S3 prefix
- Uses a Lambda layer containing `pdfminer.six` and `poppler` binaries

#### Step 2 – `parse-with-bedrock` Lambda
- Reads `extracted_text.txt` from S3
- Sends the exam text to **Amazon Bedrock (Claude)** using the prompt from `ADD_TEST_WITH_LLM.md`
- Parses the LLM response to extract:
  - `questions.json` (structured questions with correct answers)
  - Image rename mapping
- Renames and copies extracted images to the correct `imageN.png` filenames
- Writes `questions.json` and all images to `examsapp-tests/tests/<exam-id>/`

#### Step 3 – `update-registry` Lambda
- Reads current `registry.json` from `examsapp-tests`
- Appends the new exam entry (id, title, description — parsed from the PDF filename or Bedrock output)
- Writes the updated `registry.json` back to `examsapp-tests`
- Triggers a **CloudFront invalidation** for `/tests/registry.json` and `/tests/<exam-id>/*` so users see the new test immediately

### 4. Amazon Bedrock

- Model: `anthropic.claude-3-5-sonnet-20241022-v2:0` (same as existing `bedrock_chat.py`)
- Used in Step 2 to convert raw Hebrew exam text into structured `questions.json`
- The Lambda IAM role needs `bedrock:InvokeModel` permission

### 5. CI/CD – GitHub Actions (UI Deployment)

When code is pushed to `main`, a GitHub Actions workflow:
1. Runs `npm run build`
2. Syncs `dist/` to `examsapp-ui` S3 bucket
3. Invalidates the CloudFront distribution for `/*`

---

## IAM Roles

| Role | Permissions |
|------|-------------|
| `extract-pdf-lambda-role` | `s3:GetObject` (source-pdfs), `s3:PutObject` (tests, temp prefix) |
| `parse-bedrock-lambda-role` | `s3:GetObject`/`s3:PutObject` (tests), `bedrock:InvokeModel` |
| `update-registry-lambda-role` | `s3:GetObject`/`s3:PutObject` (tests), `cloudfront:CreateInvalidation` |
| `step-functions-role` | `lambda:InvokeFunction` for all three Lambdas |
| `github-actions-role` | `s3:PutObject`/`s3:DeleteObject` (ui bucket), `cloudfront:CreateInvalidation` |

---

## Data Flow Summary

```
Admin uploads PDF to S3 (source-pdfs)
    → EventBridge fires
        → Step Functions starts
            → Lambda 1: extract text + images
            → Lambda 2: Bedrock parses → questions.json + images → tests bucket
            → Lambda 3: update registry.json → CloudFront invalidation
                → Users see new test on next page load (no redeploy needed)
```

---

## Cost Estimate (Low Traffic)

| Service | Estimated Monthly Cost |
|---------|----------------------|
| S3 (3 buckets, ~1 GB) | ~$0.03 |
| CloudFront (~10 GB transfer) | ~$0.85 |
| Lambda (3 functions, ~10 invocations/month) | ~$0.00 (free tier) |
| Step Functions (~10 executions/month) | ~$0.00 (free tier) |
| Bedrock (Claude Sonnet, ~10 exams/month) | ~$0.50–$2.00 |
| **Total** | **< $5/month** |

---

## Key Design Decisions

- **No backend server** — the React app remains a pure static SPA. All dynamic behavior comes from the pipeline writing static JSON files to S3.
- **No database** — `registry.json` acts as the test catalog. User scores stay in `localStorage` as today.
- **Idempotent pipeline** — re-uploading the same PDF overwrites the existing test data cleanly.
- **Zero code changes to the React app** — CloudFront path routing means `fetch('/tests/registry.json')` works identically in local dev and production.
- **Bedrock replaces the manual LLM step** — the existing `ADD_TEST_WITH_LLM.md` workflow is fully automated inside the Lambda.

---

## Future Improvements

- Add an **S3 presigned URL endpoint** (API Gateway + Lambda) so admins can upload PDFs from a web UI instead of the AWS console.
- Store user scores in **DynamoDB** for cross-device leaderboards.
- Add **SNS/SES notification** on pipeline completion or failure.
- Use **AWS WAF** on CloudFront for rate limiting.
