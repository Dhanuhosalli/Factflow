import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import NavigationBar from '../components/NavigationBar';
import { analyzeText, analyzeImage } from '../services/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('text');
  const [isUploading, setIsUploading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setInputText(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsUploading(false);
    
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const file = event.dataTransfer.files[0];
      setSelectedFile(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setInputText(reader.result);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsUploading(true);
  };

  const handleDragLeave = () => {
    setIsUploading(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Save user search history
  const saveToUserHistory = async (content, contentType, result) => {
    try {
      await fetch('http://localhost:5000/user/save-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.userId,
          content: content,
          type: contentType,
          result: result.label || 'UNKNOWN',
          confidence: result.confidence_score || 0,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error saving to history:', error);
      // Continue even if history save fails
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      let result;
      const contentType = activeTab === 'text' ? 'text' : 'image';
      const content = activeTab === 'text' ? inputText : 'Image analysis';
      
      if (activeTab === 'text') {
        if (!inputText.trim()) {
          throw new Error('Please enter some text to analyze.');
        }
        result = await analyzeText(inputText);
      } else {
        if (!selectedFile) {
          throw new Error('Please select an image to analyze.');
        }
        
        // Show special processing message for images
        setErrorMessage('Processing image with OCR. This may take a moment...');
        
        try {
          result = await analyzeImage(selectedFile);
          // Clear the processing message on success
          setErrorMessage('');
        } catch (imageError) {
          // Throw the error to be caught by the outer catch block
          throw imageError;
        }
      }
      
      // Save to user history
      await saveToUserHistory(content, contentType, result);
      
      // Store the result in sessionStorage to be used by the result page
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
      
      // Navigate to result page
      navigate('/result/latest');
    } catch (error) {
      console.error('Error during analysis:', error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to reset form
  const resetForm = () => {
    setInputText('');
    setSelectedFile(null);
    setErrorMessage('');
  };

  const handleError = (error) => {
    setIsLoading(false);
    setErrorMessage(null);
    
    // Get the error message
    const errorMessage = error.message || "An unexpected error occurred. Please try again.";
    
    // Group common error types
    if (errorMessage.includes("CORS") || errorMessage.includes("network")) {
      setErrorMessage("Network error: Please check your internet connection and try again.");
    } else if (errorMessage.includes("timeout")) {
      setErrorMessage("Request timed out. The server might be busy, please try again later.");
    } else {
      // Use the error message directly for validation errors
      setErrorMessage(errorMessage);
    }
    
    // Scroll to error message
    setTimeout(() => {
      const errorElement = document.getElementById("error-message");
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <NavigationBar />
      
      {/* Main Analysis Section */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
            Analyze News Content
          </h1>
          <p className="text-xl text-gray-300 mb-10 text-center max-w-3xl mx-auto">
            Verify news headlines, articles, or analyze text from images for potential misinformation
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Analysis Input */}
            <div className="lg:col-span-2">
              <div className="bg-dark-lighter rounded-lg p-6 shadow-lg">
                <div className="flex border-b border-gray-800 mb-6">
                  <button
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'text'
                        ? 'text-neon-green border-b-2 border-neon-green'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('text')}
                  >
                    Text-based Analysis
                  </button>
                  <button
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'image'
                        ? 'text-neon-green border-b-2 border-neon-green'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('image')}
                  >
                    Image-based Analysis
                  </button>
                </div>

                {errorMessage && (
                  <div 
                    id="error-message"
                    className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md shadow-sm"
                    role="alert"
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {errorMessage}
                        </p>
                        <p className="mt-1 text-xs text-red-500">
                          {errorMessage.includes("question") ? "This tool analyzes factual statements, not questions." : ""}
                          {errorMessage.includes("too short") ? "Try providing more context for better analysis." : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {activeTab === 'text' ? (
                    <div>
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Enter a news headline or statement to analyze..."
                        className="w-full h-40 bg-dark border border-gray-700 rounded-lg p-4 text-white focus:outline-none focus:border-neon-green"
                      />
                    </div>
                  ) : (
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center ${
                        isUploading ? 'border-neon-green bg-neon-green/5' : 'border-gray-700'
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {selectedFile ? (
                        <div className="space-y-4">
                          <img 
                            src={inputText} 
                            alt="Selected"
                            className="max-h-60 mx-auto rounded-lg"
                          />
                          <div className="text-gray-400 text-sm">
                            {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setInputText('');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          <p className="mt-4 text-gray-300">
                            Drag & drop an image or 
                            <button
                              type="button"
                              onClick={triggerFileInput}
                              className="text-neon-green hover:underline ml-1"
                            >
                              browse
                            </button>
                          </p>
                          <p className="mt-2 text-sm text-gray-500">
                            Supported formats: JPG, PNG, GIF (max 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-neon-green text-black py-3 px-6 rounded-lg font-medium hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Analyzing...
                        </span>
                      ) : (
                        'Analyze Content'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-700 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Right Column - Tips */}
            <div className="lg:col-span-1">
              <div className="bg-dark-lighter rounded-lg p-6 shadow-lg h-full">
                <h2 className="text-xl font-semibold mb-4 text-white">Tips for Analysis</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-neon-green mb-1">For Text Analysis:</h3>
                    <ul className="list-disc pl-5 text-gray-400 space-y-1">
                      <li>Paste entire headlines or statements</li>
                      <li>Include context when possible</li>
                      <li>Works best with factual claims (not opinions)</li>
                      <li>For better results, use complete sentences</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-neon-blue mb-1">For Image Analysis:</h3>
                    <ul className="list-disc pl-5 text-gray-400 space-y-1">
                      <li>Use clear, readable images</li>
                      <li>Images with text work best</li>
                      <li>Supports news screenshots, social media posts</li>
                      <li>For altered photos, our AI can detect common manipulations</li>
                    </ul>
                  </div>
                  
                  <div className="mt-6 p-4 bg-yellow-400/10 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      <strong>Note:</strong> While our AI is powerful, always verify critical information through multiple trusted sources.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 