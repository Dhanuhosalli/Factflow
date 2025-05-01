# FactFlow - AI-Powered Fact Checking System

FactFlow is a full-stack application that uses AI to detect and verify fake news. It combines multiple AI models and OCR technology to analyze both text and image-based content.

## Features

- Text-based fact checking
- Image-based fact checking with OCR
- User authentication and history tracking
- Real-time confidence scoring
- Multi-language support
- Detailed analysis explanations

## Tech Stack

- **Frontend**: React.js
- **Backend**: Flask (Python)
- **Database**: MongoDB
- **AI Models**: 
  - Hugging Face Transformers
  - Google Gemini
  - Tesseract OCR

## Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB
- Tesseract OCR
- API Keys:
  - Google Gemini API
  - Hugging Face API

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone [your-repository-url]
   cd factflow
   ```

2. **Backend Setup**
   ```bash
   cd factflow-backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd factflow-frontend
   npm install
   ```

4. **Environment Variables**
   Create a `.env` file in the `factflow-backend` directory with:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   HF_API_TOKEN=your_huggingface_token
   MONGODB_URI=mongodb://localhost:27017
   ```

5. **Start MongoDB**
   Make sure MongoDB is running on your system

6. **Run the Application**
   - Start backend:
     ```bash
     cd factflow-backend
     python app.py
     ```
   - Start frontend:
     ```bash
     cd factflow-frontend
     npm start
     ```

## Project Structure

```
factflow/
├── factflow-backend/
│   ├── app.py
│   ├── requirements.txt
│   └── .env
├── factflow-frontend/
│   ├── app/
│   ├── public/
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Hugging Face for their transformer models
- Google for the Gemini API
- Tesseract OCR team 