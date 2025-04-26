import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

const NavigationBar = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };
  
  return (
    <nav className="bg-dark-lighter py-4 px-6 flex justify-between items-center">
      <Link 
        to="/" 
        className="text-neon-green text-2xl font-bold hover:text-white transition-colors"
      >
        FactFlow AI
      </Link>
      
      <div className="flex items-center">
        {user ? (
          <>
            <Link 
              to="/home" 
              className="text-gray-400 hover:text-white transition-colors mr-6"
            >
              Analyze
            </Link>
            
            <div className="relative group">
              <Link 
                to="/profile" 
                className="flex items-center"
              >
                <div 
                  className="w-8 h-8 rounded-full bg-neon-green text-black flex items-center justify-center font-semibold"
                >
                  {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="ml-2 text-gray-300">{user.username}</span>
              </Link>
              
              <div className="absolute right-0 mt-2 w-48 bg-dark-lighter border border-gray-700 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-lightest hover:text-white"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-lightest hover:text-white"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Link 
              to="/login" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="ml-6 bg-neon-green text-black px-4 py-2 rounded hover:bg-white transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default NavigationBar; 