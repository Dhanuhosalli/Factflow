# FactFlow AI - Fake News Detection

FactFlow AI is a web application that helps users detect misinformation in text and images using AI-powered fake news analysis.

## Project Structure

- **factflow-frontend**: React frontend application
- **factflow-backend**: Flask backend API for fake news detection

## Prerequisites

- Node.js (16.x or later)
- Python (3.8 or later)
- Tesseract OCR (for image text extraction)

## Setting Up the Backend

1. Navigate to the backend directory:
   ```
   cd factflow-backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Make sure Tesseract OCR is installed:
   - On Windows: Download and install from https://github.com/UB-Mannheim/tesseract/wiki
   - On macOS: `brew install tesseract`
   - On Ubuntu: `sudo apt install tesseract-ocr`

   If Tesseract is installed in a non-standard location, update the path in the app.py file:
   ```python
   pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'  # Example path for Windows
   ```

6. Start the Flask backend:
   ```
   python app.py
   ```
   The backend will run on http://localhost:5000

## Setting Up the Frontend

1. Navigate to the frontend directory:
   ```
   cd factflow-frontend
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The frontend will run on http://localhost:3000

## Using the Application

1. Open your browser and navigate to http://localhost:3000
2. Click "Get Started" to begin
3. Choose between text-based or image-based analysis
4. Enter a news headline or upload an image containing text
5. Click "Check News" to analyze the content
6. View the detailed results showing the AI's assessment

## API Endpoints

- `POST /check_news`: Analyze a text input
  ```json
  {
    "text": "Your news headline or article text here"
  }
  ```

- `POST /check_news_image`: Analyze text in an image (form-data with 'image' field)

## Technologies Used

- **Frontend**: React, TailwindCSS
- **Backend**: Flask, Google Gemini AI, Hugging Face models
- **OCR**: Tesseract
- **Translation**: Google Translator

## Notes

- The application requires active internet connection for AI model APIs
- For image analysis, clear and readable text yields better results
- The system uses a primary model with fallback to Google's Gemini for uncertain cases 