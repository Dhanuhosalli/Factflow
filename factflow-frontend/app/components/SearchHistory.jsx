import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getSearchHistory } from '../services/api';

const SearchHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getSearchHistory();
        setHistory(data || []);
      } catch (error) {
        console.error('Failed to fetch history:', error);
        // Fallback mock data
        setHistory([
          { 
            id: 1, 
            title: 'Breaking: Scientists discover new renewable energy source...',
            timestamp: '2 minutes ago',
            type: 'text'
          },
          { 
            id: 2, 
            title: 'Image analysis: Viral photo of alleged UFO sighting...',
            timestamp: '1 hour ago',
            type: 'image'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-dark-lighter rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl">Search History</h2>
          <button className="text-neon-green">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        <div className="animate-pulse">
          <div className="h-16 bg-dark-lightest rounded-md mb-2"></div>
          <div className="h-16 bg-dark-lightest rounded-md mb-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-dark-lighter rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-xl">Search History</h2>
        <button className="text-neon-green hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>

      {history.length === 0 ? (
        <p className="text-gray-400 text-center py-4">No search history yet.</p>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <Link
              key={item.id}
              to={`/result/${item.id}`}
              className="block p-3 bg-dark rounded-md hover:bg-dark-lightest transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  <p className="text-gray-400 text-xs">{item.timestamp}</p>
                </div>
                {item.type === 'image' && (
                  <div className="text-neon-green ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  </div>
                )}
                {item.type === 'text' && (
                  <div className="text-neon-green ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" x2="8" y1="13" y2="13" />
                      <line x1="16" x2="8" y1="17" y2="17" />
                      <line x1="10" x2="8" y1="9" y2="9" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchHistory; 