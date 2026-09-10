# MetroCheck — AI-Powered Legal Metrology Compliance Scanner

MetroCheck is a full-stack web application built for India's Department of Consumer Affairs (Smart India Hackathon PS 26034). It automatically scans product label images, extracts mandatory declarations using OCR, and evaluates compliance against the Legal Metrology (Packaged Commodities) Rules, 2011.

## Features

- **Automated Scanning**: Upload product label images and automatically extract text using Tesseract OCR with OpenCV preprocessing (grayscale, CLAHE, deskewing).
- **Rule Engine**: Evaluates extracted data against 15+ clauses from the Legal Metrology Rules, 2011 (e.g., MRP format, Net Quantity format, Mfg Date presence).
- **Interactive Dashboard**: Real-time enforcement dashboard with KPIs, trend analysis, and district-wise breakdowns.
- **Traceability**: Every compliance check links directly to the specific legal clause in the built-in Rulebook.
- **Report Generation**: Automatically generates branded PDF compliance reports for enforcement officers.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy, Pydantic
- **Database**: PostgreSQL
- **OCR & Image Processing**: Tesseract OCR, OpenCV, Pillow
- **Containerization**: Docker & Docker Compose

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## Setup & Running via Docker (Recommended)

1. **Clone the repository** (if you haven't already).
2. **Start the application** using Docker Compose:

   ```bash
   docker-compose up --build
   ```

   This will spin up three containers:
   - `db`: PostgreSQL database on port 5432
   - `backend`: FastAPI server on port 8000
   - `frontend`: React app on port 5173

3. **Access the application**:
   - Frontend UI: http://localhost:5173
   - Backend API Docs (Swagger): http://localhost:8000/docs

*Note: The backend automatically initializes the database and seeds it with demo rules and mock scan data on startup.*

## Demo Credentials

You can log in using the following pre-configured demo accounts:

- **Enforcement Officer**:
  - Email: `officer@metrocheck.gov.in`
  - Password: `demo123`
- **Admin**:
  - Email: `admin@metrocheck.gov.in`
  - Password: `demo123`

## Environment Variables

If running manually without Docker Compose, you need to set the following environment variables for the backend:

- `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql://user:pass@localhost/db`)
- `JWT_SECRET_KEY`: Secret key for signing JWT tokens.
- `UPLOAD_DIR`: Directory to store uploaded images (defaults to `../uploads`).

*(In the Docker environment, these are automatically configured in `docker-compose.yml`)*

## Manual Setup (Without Docker)

### Backend

1. Install Python 3.11+.
2. Install system dependencies: Tesseract OCR (`tesseract-ocr` on Debian/Ubuntu).
3. Navigate to the `backend` directory.
4. Create a virtual environment and install requirements:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
5. Ensure PostgreSQL is running locally and set `DATABASE_URL`.
6. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Install Node.js 18+.
2. Navigate to the `frontend` directory.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage Notes for Demo

- **OCR Limitations**: The current implementation relies on Tesseract OCR. For best results during demos, use clear, well-lit, and properly cropped images of product labels. The system performs basic preprocessing (grayscale, contrast, deskew), but highly stylized or very small fonts might still be challenging for standard Tesseract.
- **Area Calculation**: For font-size compliance checks (Rule 9), enter the "Package Surface Area cm²" when uploading a scan. This helps the system approximate the required physical font size from pixel bounding boxes.
