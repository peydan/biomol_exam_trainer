# ExamsApp – Biology/Molecular Exam Trainer

A React-based web application for practicing biology/molecular exam questions, focused on Hebrew exams with RTL support.

## Features

- 📝 **Practice sessions** with multiple-choice questions
- 📊 **Score tracking** and progress visualization
- 🏆 **High score** leaderboard per exam
- 📚 **Multiple exams** support via test registry
- 🔄 **RTL (Hebrew) support** with proper text direction
- 🖼️ **Image support** for questions with diagrams
- 💾 **Local storage** for saving attempts

## Project Structure

```
examsapp/
├── public/tests/           # Exam data (questions.json + images)
├── source_tests/           # Source PDFs (Hebrew exams)
├── src/
│   ├── components/         # React components
│   │   ├── PracticeSession.jsx
│   │   ├── ScoreBoard.jsx
│   │   └── TestSelection.jsx
│   ├── utils/              # Utility functions
│   │   └── testUtils.js
│   ├── App.jsx             # Main app component
│   └── main.jsx            # Entry point
├── scripts/                # Python utilities
│   └── bedrock_chat.py    # AWS Bedrock integration
├── parse_pdf_smart.py      # PDF parser (Hebrew RTL)
├── parse_pdf.py           # Alternative parser
├── update_tests_registry.py # Test registry manager
├── ADDING_TESTS.md        # Detailed workflow for adding new tests
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+ (for PDF processing)
- For PDF processing: `pdfminer.six` or `poppler-utils`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/peydan/biomol_exam_trainer.git
   cd biomol_exam_trainer
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Install Python dependencies (optional, for adding new tests):
   ```bash
   pip install pdfminer.six boto3
   ```

### Running the App

Development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm run preview
```

The app will be available at `http://localhost:5173`.

## Adding New Exams

The process for adding new exam PDFs is documented in detail in **[ADDING_TESTS.md](./ADDING_TESTS.md)**.

Quick summary:
1. Place PDF in `source_tests/`
2. Extract text using `pdfminer` or `pdftotext`
3. Parse with `parse_pdf_smart.py` 
4. Create test directory under `public/tests/`
5. Run `python update_tests_registry.py`
6. Add correct answers manually to `questions.json`

## Hebrew RTL Support

The app handles Hebrew text with proper RTL (right-to-left) display. PDF parsing includes special handling for:

- Visual RTL text reversal (PDF extraction produces reversed characters)
- Word order correction for logical Hebrew
- Greek letter substitution (α, β, φ, ψ, etc.)
- Mixed English/Hebrew content

## AWS Bedrock Integration

Optional integration with AWS Bedrock (Claude) for:
- Assisting with question parsing
- Generating/verifying correct answers
- Text cleanup and translation

See `scripts/bedrock_chat.py` for usage.

## License

MIT

## Acknowledgments

- Hebrew University exam materials
- React + Vite for the frontend framework
- PDFMiner for text extraction