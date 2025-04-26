import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import NavigationBar from '../components/NavigationBar';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Navigate to login after successful registration
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white">
      <NavigationBar />
      
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="bg-dark-lighter rounded-lg p-8 shadow-lg max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 text-center text-neon-green">Register</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-300 mb-2">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-green"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-green"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-300 mb-2">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-green"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-dark border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neon-green"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-neon-green text-black font-bold py-3 rounded-lg hover:bg-white transition-colors shadow-neon-green text-xl"
            >
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-neon-blue hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 