# Adding a Test Using an LLM

This document is designed to be attached to an LLM chat session (e.g., ChatGPT, Claude, Gemini).
Follow the steps below, then paste the prompt at the bottom.

---

## How image extraction works

`pdfimages` extracts all images from a PDF and numbers them in the order they appear in the file (`image-000.png`, `image-001.png`, …). The LLM reads the exam text, identifies which questions reference a figure, and knows the order those figures appear — so it can produce a shell script that renames each extracted image to the correct `imageN.png` filename automatically.

You never need to manually match images to questions.

---

## Step 1 — Get the exam text

Copy the full text of the exam. You can:
- Copy-paste directly from the PDF (if it has selectable text)
- Or use `pdfminer`:
  ```bash
  python -m pdfminer.high_level --output-format txt --output-file extracted_text.txt "source_tests/YOUR_EXAM.pdf"
  ```

---

## Step 2 — Send the prompt to the LLM

Paste the prompt below into your LLM chat and append the exam text at the end.
Replace `YOUR_EXAM_ID` and `YOUR_EXAM.pdf` with your actual values before sending.

````
You are a precise data-entry assistant. Your task is to convert an exam into a structured JSON file and produce a shell script to extract and rename its images.

## Part 1 — questions.json

Produce a JSON array. Each element follows this exact schema:
{
  "id": <integer, sequential from 1>,
  "question": <string>,
  "options": [<string>, ...],
  "correctAnswer": <string>,
  "image": <string, filename — ONLY if the question references a figure/diagram>
}

Rules:
- correctAnswer must be character-for-character identical to one of the strings in options.
- Omit the "image" field entirely for questions with no image.
- Name images sequentially: the first question that has an image gets "image0.png", the second gets "image1.png", and so on — regardless of question number.
- Output raw JSON only — no markdown fences, no explanation.
- Preserve the original language exactly.
- Use \n for line breaks inside question strings where needed.

## Part 2 — extract_images.sh

After the JSON, output a bash script that:
1. Runs pdfimages to extract all images from the PDF into a temp folder.
2. Renames each extracted image to match the filename you used in the JSON.

The script must be self-contained and ready to run from the project root.
Use this exact template, filling in only the mv lines:

#!/bin/bash
set -e
PDF="source_tests/YOUR_EXAM.pdf"
OUT="public/tests/YOUR_EXAM_ID"
TMP=$(mktemp -d)

pdfimages -png "$PDF" "$TMP/img"

# Rename extracted images to match questions.json
mv "$TMP/img-NNN.png" "$OUT/image0.png"
mv "$TMP/img-NNN.png" "$OUT/image1.png"
# ... one mv line per image

rm -rf "$TMP"
echo "Done. Images saved to $OUT"

The pdfimages output files are named img-000.png, img-001.png, etc. (zero-padded to 3 digits), in the order they appear in the PDF. Map them in that order to image0.png, image1.png, etc.

Separate the two outputs with exactly this line:
---SCRIPT---

Here is the exam text:
[PASTE EXAM TEXT HERE]
````

---

## Step 3 — Save the outputs

The LLM will produce two blocks separated by `---SCRIPT---`.

**Block 1** → save as `public/tests/YOUR_EXAM_ID/questions.json`

**Block 2** → save as `extract_images.sh`, then run:
```bash
chmod +x extract_images.sh
./extract_images.sh
```

This extracts all images from the PDF and places them in the right folder with the right names.

---

## Step 4 — Register the test

```bash
python update_tests_registry.py
```

Enter the title and description when prompted. Done — the test appears in the app on next load.

---

## JSON Schema reference

| Field           | Type             | Required | Notes |
|-----------------|------------------|----------|-------|
| `id`            | integer          | yes      | Sequential from 1 |
| `question`      | string           | yes      | Full question text |
| `options`       | array of strings | yes      | All answer choices |
| `correctAnswer` | string           | yes      | Exact copy of one option |
| `image`         | string           | no       | e.g. `"image2.png"` — omit if no image |
