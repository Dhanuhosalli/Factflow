import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import NavigationBar from '../components/NavigationBar';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchSearchHistory();
  }, [navigate]);

  const fetchSearchHistory = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      
      if (!userData || !userData.userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`http://localhost:5000/user/history/${userData.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search history');
      }

      const data = await response.json();
      setSearchHistory(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleViewResult = (resultId) => {
    navigate(`/result/${resultId}`);
  };

  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-dark text-white">
      <NavigationBar />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* User Info Card */}
          <div className="bg-dark-lighter rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-neon-green">Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-gray-400 text-sm">Username</h3>
                <p className="text-white text-lg">{user.username}</p>
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">Email</h3>
                <p className="text-white text-lg">{user.email}</p>
              </div>
              
              <button
                onClick={handleLogout}
                className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Search History */}
          <div className="md:col-span-2 bg-dark-lighter rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-neon-green">Search History</h2>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-green"></div>
              </div>
            ) : searchHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No search history yet.</p>
                <p className="mt-2">Start analyzing content to build your history!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchHistory.map((item) => (
                  <div 
                    key={item._id} 
                    className="bg-dark p-4 rounded-lg hover:bg-dark-lightest cursor-pointer transition-colors"
                    onClick={() => handleViewResult(item._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-medium mb-2 line-clamp-1">
                          {item.content.substring(0, 100)}{item.content.length > 100 ? '...' : ''}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            item.result === 'REAL' ? 'bg-green-500/20 text-green-300' : 
                            item.result === 'FAKE' ? 'bg-red-500/20 text-red-300' : 
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {item.result}
                          </span>
                          <span className="ml-2 text-gray-400 text-xs">
                            Confidence: {item.confidence || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {item.type === 'text' ? 'Text Analysis' : 'Image Analysis'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 