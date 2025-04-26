import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Languages we support
const supportedLanguages = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  ar: 'العربية',
  hi: 'हिन्दी',
  vi: 'Tiếng Việt',
  kn: 'ಕನ್ನಡ'
};

// Initial translations for common UI elements
const resources = {
  en: {
    translation: {
      // Navigation
      "home": "Home",
      "about": "About",
      "contact": "Contact",
      
      // Analysis page
      "analyze_news": "Analyze News Content",
      "verify_news": "Verify news headlines, articles, or analyze text from images",
      "text_analysis": "Text-based Analysis",
      "image_analysis": "Image-based Analysis",
      "enter_news": "Enter a news headline or article to verify...",
      "drop_image": "Drop image here or click to upload",
      "supported_formats": "Supported formats: JPG, PNG, GIF",
      "check_news": "Check News",
      "analyzing": "Analyzing...",
      
      // Results page
      "analysis_results": "Analysis Results",
      "detection_summary": "Detection Summary",
      "confidence_rating": "Confidence Rating",
      "detailed_explanation": "Detailed Explanation",
      "key_findings": "Key Findings",
      "original_input": "Original Input",
      "back_to_home": "Back to Home",
      "input_type": "Input Type",
      "ai_model": "AI Model Used",
      "result": "Result",
      "timestamp": "Timestamp",
      "language": "Language",
      "fallback_used": "Fallback Used",
      "confidence_note": "Note: AI confidence reflects the model's certainty, not factual accuracy.",
      "select_language": "Select Language"
    }
  },
  kn: {
    translation: {
      // Navigation
      "home": "ಮುಖಪುಟ",
      "about": "ನಮ್ಮ ಬಗ್ಗೆ",
      "contact": "ಸಂಪರ್ಕ",
      
      // Analysis page
      "analyze_news": "ಸುದ್ದಿ ವಿಷಯವನ್ನು ವಿಶ್ಲೇಷಿಸಿ",
      "verify_news": "ಸುದ್ದಿ ಶೀರ್ಷಿಕೆಗಳು, ಲೇಖನಗಳು ಅಥವಾ ಚಿತ್ರಗಳಿಂದ ಪಠ್ಯವನ್ನು ವಿಶ್ಲೇಷಿಸಿ",
      "text_analysis": "ಪಠ್ಯ-ಆಧಾರಿತ ವಿಶ್ಲೇಷಣೆ",
      "image_analysis": "ಚಿತ್ರ-ಆಧಾರಿತ ವಿಶ್ಲೇಷಣೆ",
      "enter_news": "ಪರಿಶೀಲಿಸಲು ಸುದ್ದಿ ಶೀರ್ಷಿಕೆ ಅಥವಾ ಲೇಖನವನ್ನು ನಮೂದಿಸಿ...",
      "drop_image": "ಚಿತ್ರವನ್ನು ಇಲ್ಲಿ ಬಿಡಿ ಅಥವಾ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",
      "supported_formats": "ಬೆಂಬಲಿತ ಫಾರ್ಮ್ಯಾಟ್‌ಗಳು: JPG, PNG, GIF",
      "check_news": "ಸುದ್ದಿ ಪರಿಶೀಲಿಸಿ",
      "analyzing": "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
      
      // Results page
      "analysis_results": "ವಿಶ್ಲೇಷಣೆ ಫಲಿತಾಂಶಗಳು",
      "detection_summary": "ಪತ್ತೆ ಸಾರಾಂಶ",
      "confidence_rating": "ವಿಶ್ವಾಸ ರೇಟಿಂಗ್",
      "detailed_explanation": "ವಿವರವಾದ ವಿವರಣೆ",
      "key_findings": "ಪ್ರಮುಖ ಕಂಡುಹಿಡಿತಗಳು",
      "original_input": "ಮೂಲ ಇನ್‌ಪುಟ್",
      "back_to_home": "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
      "input_type": "ಇನ್‌ಪುಟ್ ಪ್ರಕಾರ",
      "ai_model": "ಬಳಸಿದ AI ಮಾದರಿ",
      "result": "ಫಲಿತಾಂಶ",
      "timestamp": "ಸಮಯ ಮುದ್ರೆ",
      "language": "ಭಾಷೆ",
      "fallback_used": "ಫಾಲ್‌ಬ್ಯಾಕ್ ಬಳಸಲಾಗಿದೆ",
      "confidence_note": "ಗಮನಿಸಿ: AI ವಿಶ್ವಾಸವು ಮಾದರಿಯ ನಿಶ್ಚಿತತೆಯನ್ನು ಪ್ರತಿಬಿಂಬಿಸುತ್ತದೆ, ವಾಸ್ತವಿಕ ನಿಖರತೆಯನ್ನಲ್ಲ.",
      "select_language": "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ"
    }
  }
};

// Initialize i18n
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Function to translate content using the backend
export const translateContent = async (content, targetLanguage) => {
  try {
    // Special case for Kannada: Only translate the content, not the UI
    if (targetLanguage === 'kn') {
      // For dynamic content, use the translation API directly
      const response = await fetch('http://localhost:5000/translate_result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          target_language: targetLanguage
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translated_content;
    }
    
    // For all other languages, use standard approach
    // For predefined UI elements, use i18next
    if (i18n.exists(content)) {
      i18n.changeLanguage(targetLanguage);
      return i18n.t(content);
    }
    
    // For dynamic content from the backend, use the translation API
    const response = await fetch('http://localhost:5000/translate_result', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        target_language: targetLanguage
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.translated_content;
  } catch (error) {
    console.error('Translation error:', error);
    return content; // Return original content if translation fails
  }
};

export const getLanguageName = (code) => {
  return supportedLanguages[code] || code;
};

export const getSupportedLanguages = () => {
  return supportedLanguages;
};

export default i18n; 