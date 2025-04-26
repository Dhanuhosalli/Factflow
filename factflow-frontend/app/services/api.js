/**
 * API service for communicating with the Flask backend
 */

const API_BASE_URL = 'http://localhost:5000';

/**
 * Analyze text for fake news detection
 * @param {string} text - Text content to analyze
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeText = async (text) => {
  try {
    // Client-side validation before sending to API
    if (!text || !text.trim()) {
      throw new Error("Please enter some text to analyze.");
    }
    
    // Improved text validation
    const words = text.trim().split(/\s+/);
    
    // Minimum text length validation
    if (words.length < 3) {
      throw new Error("Your input is too short. Please provide at least 3 words for accurate analysis.");
    }
    
    // Enhanced question detection
    const questionIndicators = ['?', 'what', 'how', 'when', 'why', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'do', 'does', 'is', 'are', 'am'];
    
    if (text.trim().endsWith('?')) {
      throw new Error("Your input appears to be a question. Please enter a statement or claim to be fact-checked instead of asking a question.");
    }
    
    // Check for questions that don't end with question marks
    const firstWordLower = words[0].toLowerCase();
    if (questionIndicators.includes(firstWordLower)) {
      if (["what", "how", "when", "why", "where", "who", "which"].includes(firstWordLower)) {
        throw new Error("Your input appears to start with a question word. Please enter a statement or claim to be fact-checked.");
      } else if (["is", "are", "am", "was", "were", "do", "does", "did", "can", "could", "would", "should"].includes(firstWordLower)) {
        throw new Error("Your input appears to be a question. Please enter a statement or claim to be fact-checked.");
      }
    }
    
    // Check for nonsensical input (extremely basic check - can be improved)
    const hasAlphabets = /[a-zA-Z]/.test(text);
    if (!hasAlphabets) {
      throw new Error("Your input doesn't appear to contain readable text. Please enter a valid statement or claim.");
    }

    const response = await fetch(`${API_BASE_URL}/check_news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const responseData = await response.json();
    
    // Handle validation errors from the server with friendly messages
    if (!response.ok) {
      // Check if this is a validation error with message field
      if (response.status === 400 && responseData.message) {
        throw new Error(responseData.message);
      }
      
      // Handle other API errors
      throw new Error(responseData.error || `API error: ${response.status}`);
    }

    // For special status messages that aren't errors
    if (responseData.message && responseData.label === "INVALID") {
      throw new Error(responseData.message);
    }

    return responseData;
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
};

/**
 * Analyze image for fake news detection using OCR
 * @param {File} imageFile - Image file to analyze
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeImage = async (imageFile) => {
  try {
    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > MAX_FILE_SIZE) {
      throw new Error(`Image size too large. Maximum size is 5MB. Your file is ${(imageFile.size / (1024 * 1024)).toFixed(2)}MB.`);
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error(`Invalid file type. Supported formats: JPG, PNG, GIF, BMP, TIFF. Your file is ${imageFile.type}.`);
    }
    
    const formData = new FormData();
    formData.append('image', imageFile);

    // Check server connection before uploading
    try {
      const pingResponse = await fetch(`${API_BASE_URL}/`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2-second timeout for ping
      });
      if (!pingResponse.ok) {
        throw new Error('Server connection issue. Please try again later.');
      }
    } catch (pingError) {
      if (pingError.name === 'AbortError') {
        throw new Error('Server is not responding. Please check your connection or try again later.');
      }
      console.error('Server ping error:', pingError);
      // Continue anyway, the main request might still work
    }

    // Main request
    const response = await fetch(`${API_BASE_URL}/check_news_image`, {
      method: 'POST',
      body: formData,
    });

    // Handle various error statuses
    if (!response.ok) {
      const errorData = await response.json();
      
      // Special case for 400 errors which might have useful messages
      if (response.status === 400 && errorData.message) {
        throw new Error(errorData.message);
      }
      
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Get search history (mock implementation - replace with actual API call if needed)
 * @returns {Promise<Array>} Search history items
 */
export const getSearchHistory = async () => {
  // This is a mock implementation
  // In a real app, you'd connect to an API endpoint
  return [
    {
      id: 1,
      query: "COVID-19 vaccine contains microchips",
      type: "text",
      result: "FAKE",
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 2,
      query: "Earth is round",
      type: "text",
      result: "REAL",
      date: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 3,
      query: "newspaper-headline.jpg",
      type: "image",
      result: "FAKE",
      date: new Date(Date.now() - 259200000).toISOString(),
    },
  ];
}; 