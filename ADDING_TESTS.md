# Adding New Exam Tests to ExamsApp

This guide explains how to add new exam PDFs to the ExamsApp project. The process involves extracting text from Hebrew exam PDFs, parsing the text into structured questions, and registering the test in the app.

## Overview

The workflow consists of these main steps:

1. **Place the source PDF** in `source_tests/`
2. **Extract text** from the PDF (using external tools)
3. **Parse the extracted text** into a `questions.json` file
4. **Create a test directory** under `public/tests/` with images
5. **Register the test** using the registry updater script
6. **Add correct answers** (manual step)

---

## Step-by-Step Instructions

### 1. Prepare the Source PDF

- Place the exam PDF file in the `source_tests/` directory.
- Use a descriptive filename, e.g.:
  ```
  source_tests/מבחן 2023 מועד א׳ טופס 0.pdf
  ```

### 2. Extract Text from the PDF

You need to extract raw text from the PDF into a plain text file. The project has used two methods:

#### Option A: Using `pdfminer` (recommended)

```bash
pip install pdfminer.six
python -m pdfminer.high_level --output-format txt --output-file extracted_text.txt "source_tests/מבחן 2023 מועד א׳ טופס 0.pdf"
```

#### Option B: Using `pdftotext` (poppler-utils)

```bash
# Install poppler-utils first
brew install poppler  # macOS
# or: apt-get install poppler-utils  # Ubuntu

pdftotext -layout "source_tests/מבחן 2023 מועד א׳ טופס 0.pdf" extracted_text.txt
```

The extracted text will be in **visual RTL order** (Hebrew characters reversed). This is normal and will be fixed in the parsing step.

### 3. Parse the Extracted Text

The project provides two Python parsers that convert the raw text into structured JSON:

#### Parser A: `parse_pdf_smart.py`
- Reverses word order to restore logical Hebrew text
- Uses regex patterns to identify questions and options

```bash
python parse_pdf_smart.py
```
This reads `extracted_text.txt` and writes `questions.json` in the current directory.

#### Parser B: `parse_pdf.py`  
- Uses the `bidi` algorithm for proper RTL handling
- More complex token-based reversal

```bash
python parse_pdf.py
```

**Note:** Both parsers **do not extract correct answers** from the PDF. You must manually add the `"correctAnswer"` field after parsing (see Step 6).

### 4. Create the Test Directory

1. Create a new directory under `public/tests/` with a descriptive ID:
   ```bash
   mkdir -p "public/tests/exam-2023-a"
   ```

2. Copy the generated `questions.json` file:
   ```bash
   cp questions.json "public/tests/exam-2023-a/"
   ```

3. Extract any images from the PDF and copy them to the test directory:
   ```bash
   # Example using pdfimages (from poppler-utils):
   pdfimages -png "source_tests/מבחן 2023 מועד א׳ טופס 0.pdf" "public/tests/exam-2023-a/image"
   ```
   Rename images to match references in `questions.json` (e.g., `image0.png`, `image1.png`).

### 5. Register the Test

Run the registry updater script:

```bash
python update_tests_registry.py
```

The script will:
1. Scan `public/tests/` for new directories containing `questions.json`
2. Prompt you to enter:
   - **Title** (Hebrew, displayed in UI): e.g., `"מבחן 2023 מועד א׳"`
   - **Description** (optional): e.g., `"ביומולקולות תפקוד ומבנה"`
3. Update `public/tests/registry.json` and `public/tests/processed_tests.json`

### 6. Add Correct Answers

**Important:** The parsers do not extract correct answers from the PDF. You must manually add the `"correctAnswer"` field to each question in `questions.json`.

Open the `public/tests/exam-2023-a/questions.json` file and for each question object, add:

```json
{
  "id": 1,
  "question": "...",
  "options": ["...", "..."],
  "correctAnswer": "exact text of the correct option",
  "image": "image0.png"  // optional
}
```

The `correctAnswer` must match **exactly** one of the strings in the `options` array (including punctuation).

---

## File Structure

After adding a test, your project should look like:

```
source_tests/
  └── מבחן 2023 מועד א׳ טופס 0.pdf

public/tests/
  ├── registry.json
  ├── processed_tests.json
  └── exam-2023-a/
      ├── questions.json
      ├── image0.png
      ├── image1.png
      └── ...
```

---

## JSON Schema for Questions

Each question in `questions.json` should follow this structure:

```json
{
  "id": 1,                     // Sequential number
  "question": "Hebrew text...", // Question text (logical Hebrew)
  "options": [                 // Array of answer options
    "Option 1 text",
    "Option 2 text",
    "..."
  ],
  "correctAnswer": "Option X text", // Must match an option exactly
  "image": "image0.png"        // Optional: image filename
}
```

---

## Troubleshooting

### Hebrew Text Appears Backwards
- The PDF extraction produces visual RTL text (characters reversed).
- The parsers attempt to reverse this, but may need adjustment for different PDF formats.
- Check the `fix_line()` function in `parse_pdf_smart.py` if the output is still backwards.

### Missing Images
- Ensure image filenames in `questions.json` match actual files in the test directory.
- Image references should be relative to the test directory.

### Registry Not Updating
- Make sure `questions.json` exists in the test directory.
- Check `processed_tests.json` to see if the test ID is already listed.

### Parsing Errors
- Different exam formats may require adjustments to the regex patterns in the parsers.
- Examine the raw `extracted_text.txt` to understand the text structure.

---

## Automation Ideas (Future Improvements)

1. **Single script** that combines extraction, parsing, and registration.
2. **OCR support** for scanned PDFs.
3. **Automatic answer extraction** using pattern matching or AI (Bedrock).
4. **Image auto-extraction** and renaming based on question numbers.
5. **Validation script** to check `questions.json` structure and required fields.

---

## Using AWS Bedrock for Assistance

The project includes `scripts/bedrock_chat.py` for calling Claude via AWS Bedrock. This can be used to:

- Help fix parsing issues
- Generate or verify correct answers
- Translate or clean up question text

Set up AWS credentials and region, then run:
```bash
export BEDROCK_MODEL_ID="anthropic.claude-3-5-sonnet-20241022-v2:0"
python scripts/bedrock_chat.py "Help me parse this Hebrew exam text..."
```

---

## Quick Reference Commands

```bash
# Complete workflow example
pdfminer ... "source_tests/exam.pdf" extracted_text.txt
python parse_pdf_smart.py
mkdir -p "public/tests/exam-2023-b"
cp questions.json "public/tests/exam-2023-b/"
pdfimages -png "source_tests/exam.pdf" "public/tests/exam-2023-b/image"
python update_tests_registry.py
# Then manually edit correctAnswer in questions.json
```

---

## Support

If you encounter issues, check:
- The raw extracted text for formatting anomalies
- Existing test `exam-2023-a` as a reference
- Hebrew text encoding (should be UTF-8)

For major parsing changes, modify the regex patterns in `parse_pdf_smart.py` to match your exam's text structure.