import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import NavigationBar from '../components/NavigationBar';
import ResultCard, { ConfidenceBar, MetricRow, KeyFindings } from '../components/ResultCard';
import { getSupportedLanguages, translateContent } from '../i18n';

export default function Result() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [originalExplanation, setOriginalExplanation] = useState(null); // Store original explanation
  const [translatedExplanation, setTranslatedExplanation] = useState(null);
  const [originalLanguage, setOriginalLanguage] = useState('en'); // Store detected language
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  const [error, setError] = useState(null);
  const { id } = useParams();

  // Get available languages
  const supportedLanguages = getSupportedLanguages();
  
  // Effect to fetch the initial analysis data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Short timeout to allow for animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const storedData = sessionStorage.getItem('analysisResult');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setAnalysisData(parsedData);
          
          // Store the original explanation and language
          setOriginalExplanation(parsedData.explanation);
          setTranslatedExplanation(parsedData.explanation);
          
          // If the result has a language field, use it
          if (parsedData.language) {
            setOriginalLanguage(parsedData.language);
            // Set the selected language to match the input language
            setSelectedLanguage(parsedData.language);
            i18n.changeLanguage(parsedData.language);
          }
        } else {
          // If no data is found, show an error
          setError('Analysis result not found. Please try again.');
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load analysis results');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, i18n]);

  // Effect for language change and translation
  useEffect(() => {
    const translateExplanation = async () => {
      // If no data yet, or no selected language, no translation needed
      if (!analysisData || !selectedLanguage) {
        return;
      }
      
      // If language is the same as original (and not Kannada), use original explanation
      if (selectedLanguage === originalLanguage && selectedLanguage !== 'kn') {
        setTranslatedExplanation(originalExplanation);
        setLoadingTranslation(false);
        return;
      }
      
      setLoadingTranslation(true);
      try {
        // Special case for Kannada - translate only the explanation
        if (selectedLanguage === 'kn') {
          // Translate explanation to Kannada
          const translated = await translateContent(originalExplanation, 'kn');
          setTranslatedExplanation(translated);
        } else {
          // For other languages, translate normally
          const translated = await translateContent(originalExplanation, selectedLanguage);
          setTranslatedExplanation(translated);
        }
      } catch (err) {
        console.error('Translation error:', err);
        // Keep the previous translation or fall back to original
        if (!translatedExplanation) {
          setTranslatedExplanation(originalExplanation);
        }
      } finally {
        setLoadingTranslation(false);
      }
    };
    
    translateExplanation();
  }, [selectedLanguage, analysisData, originalExplanation, originalLanguage]);

  // Handle language change
  const handleLanguageChange = async (e) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    
    // Only change the app's global language if not Kannada
    // For Kannada, we only want to translate the explanation but keep UI in original language
    if (newLang !== 'kn') {
      i18n.changeLanguage(newLang);
    }
    
    // Show loading state immediately
    if (newLang !== originalLanguage && analysisData) {
      setLoadingTranslation(true);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-dark text-white">
        <NavigationBar />
        <div className="max-w-4xl mx-auto p-6 mt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-lighter rounded w-1/3 mb-6"></div>
            <div className="h-64 bg-dark-lighter rounded mb-6"></div>
            <div className="h-64 bg-dark-lighter rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-dark text-white">
        <NavigationBar />
        <div className="max-w-4xl mx-auto p-6 mt-8 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto text-red-500 mb-4"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 className="text-2xl font-bold mb-4">{error}</h2>
          <Link
            to="/home"
            className="inline-block bg-neon-green text-black px-6 py-3 rounded-lg hover:bg-white transition-colors shadow-neon-green"
          >
            {t('back_to_home')}
          </Link>
        </div>
      </div>
    );
  }
  
  // Format data for display
  const formatData = {
    confidence: (() => {
      // First try to use the confidence_score from the API
      if (analysisData.confidence_score) {
        if (typeof analysisData.confidence_score === 'string') {
          return parseFloat(analysisData.confidence_score) || 0;
        }
        return analysisData.confidence_score || 0;
      }
      
      // Fallback: Try to extract confidence from the explanation
      const explanation = translatedExplanation || originalExplanation || '';
      const confidenceMatch = explanation.match(/Confidence Rating:\s*(\d+(?:\.\d+)?)/i);
      if (confidenceMatch && confidenceMatch[1]) {
        return parseFloat(confidenceMatch[1]) || 0;
      }
      
      return 0; // Default if nothing found
    })(),
    inputType: typeof analysisData.input === 'string' && analysisData.input.startsWith('Image:') ? 'Image' : 'Text',
    sourceScore: analysisData.used_model === 'Google Gemini' ? 'Medium' : 'High',
    result: analysisData.label,
    timestamp: new Date().toLocaleString(),
    explanation: loadingTranslation ? 
      'Translating...' : 
      (translatedExplanation || originalExplanation || 'No detailed explanation available.'),
    keyFindings: analysisData.message ? 
      [analysisData.message] : 
      (translatedExplanation || originalExplanation)?.split('\n').filter(line => line.trim().length > 0).slice(0, 4) || []
  };
  
  // Success state with data
  return (
    <div className="min-h-screen bg-dark text-white">
      <NavigationBar />
      
      <main className="max-w-4xl mx-auto p-6 my-8">
        <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-800 pb-2">
          <h1 className="text-3xl font-bold">{t('analysis_results')}</h1>
          
          {/* Language Selector - Prominently positioned and styled */}
          <div className="flex items-center mt-2 md:mt-0">
            <label htmlFor="language-select" className="text-gray-300 mr-2 font-medium">
              {t('select_language')}:
            </label>
            <select 
              id="language-select"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="bg-dark-lighter text-white py-2 px-3 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-neon-green"
            >
              {Object.entries(supportedLanguages).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Original Language Indication if translated */}
        {selectedLanguage !== originalLanguage && (
          <div className="text-gray-400 text-sm mb-4">
            {selectedLanguage === 'kn' ? (
              <p>Explanation is displayed in Kannada while keeping the UI in English.</p>
            ) : (
              <p>Original analysis was in {supportedLanguages[originalLanguage] || originalLanguage}.</p>
            )}
          </div>
        )}
        
        {/* Detection Summary */}
        <ResultCard 
          title={t('detection_summary')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="m9 12 2 2 4-4"></path>
            </svg>
          }
        >
          <ConfidenceBar rating={formatData.confidence} />
          
          <table className="w-full">
            <tbody>
              <MetricRow label={t('input_type')} value={formatData.inputType} />
              <MetricRow label={t('ai_model')} value={analysisData.used_model || "Unknown"} />
              <MetricRow 
                label={t('result')}
                value={formatData.result} 
                isNegative={formatData.result === 'FAKE'} 
              />
              <MetricRow label={t('timestamp')} value={formatData.timestamp} />
              {analysisData.language && (
                <MetricRow label={t('language')} value={analysisData.language.toUpperCase()} />
              )}
              {analysisData.fallback_triggered && (
                <MetricRow label={t('fallback_used')} value="Yes (Primary model uncertain)" />
              )}
            </tbody>
          </table>
        </ResultCard>
        
        {/* Detailed Explanation */}
        <ResultCard 
          title={t('detailed_explanation')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          }
        >
          {loadingTranslation && (
            <div className="w-full flex justify-center py-4">
              <div className="animate-pulse flex space-x-2">
                <div className="w-3 h-3 bg-neon-green/50 rounded-full"></div>
                <div className="w-3 h-3 bg-neon-green/50 rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-neon-green/50 rounded-full animation-delay-400"></div>
              </div>
            </div>
          )}
          
          <div className={`whitespace-pre-line ${loadingTranslation ? 'opacity-50' : ''}`}>
            {formatData.explanation}
          </div>
          
          {formatData.keyFindings.length > 0 && !loadingTranslation && (
            <KeyFindings findings={formatData.keyFindings} />
          )}
        </ResultCard>
        
        {/* Original Input */}
        <ResultCard
          title={t('original_input')}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          }
        >
          <div className="bg-dark p-4 rounded-lg text-gray-300">
            {analysisData.input}
          </div>
        </ResultCard>
        
        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <Link
            to="/home"
            className="inline-block bg-neon-green text-black px-6 py-3 rounded-lg hover:bg-white transition-colors shadow-neon-green"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
              {t('back_to_home')}
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
} 