import React from 'react';
import { Link } from 'react-router';
import NavigationBar from '../components/NavigationBar';

export default function Welcome() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <NavigationBar />
      
      {/* Hero Section */}
      <section className="py-20 px-4 flex flex-col items-center justify-center min-h-[80vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-dark-lighter via-dark to-dark z-0"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-neon-blue animate-pulse-slow">FactFlow AI</h1>
          <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Your AI-powered assistant for detecting misinformation in text and images.
            Verify news, statements, and content with cutting-edge multi-modal analysis.
          </p>
          <Link 
            to="/login" 
            className="bg-neon-green text-black px-10 py-4 rounded-lg text-xl font-medium hover:bg-white transition-colors shadow-neon-green inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 bg-gradient-to-b from-dark to-dark-lighter">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose FactFlow AI?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-green">
                  <path d="m9 10 2 2 4-4"></path>
                  <rect width="20" height="20" x="2" y="2" rx="2"></rect>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Accuracy</h3>
              <p className="text-gray-400">
                Multiple AI models working together to deliver reliable verification
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-neon-blue/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neon-blue">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m7 10 2 2 7-7"></path>
                  <path d="m7 15 2 2 7-7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Convenience</h3>
              <p className="text-gray-400">
                Process both text and images in seconds with intuitive interface
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500">
                  <path d="M9.5 11h5"></path>
                  <path d="M9.5 15h5"></path>
                  <path d="M14 19H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8"></path>
                  <path d="m17 12 3-3-3-3"></path>
                  <path d="M14 9h6"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Transparency</h3>
              <p className="text-gray-400">
                Detailed explanations and confidence scores for every analysis
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <Link 
              to="/login" 
              className="bg-dark-lighter text-white px-6 py-3 rounded-lg hover:bg-dark-lightest transition-colors inline-block"
            >
              Start Analyzing Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 