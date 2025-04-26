import React from 'react';

const ResultCard = ({ title, children, icon }) => {
  return (
    <div className="bg-dark-lighter rounded-lg p-6 mb-6 w-full">
      <div className="flex items-center mb-4">
        {icon && <div className="mr-2 text-neon-green">{icon}</div>}
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="text-gray-300">
        {children}
      </div>
    </div>
  );
};

export const ConfidenceBar = ({ rating, maxRating = 10 }) => {
  // Ensure rating is a number and properly capped
  const numericRating = typeof rating === 'number' ? 
    Math.min(rating, maxRating) : 
    Math.min(parseFloat(rating) || 0, maxRating);
  
  // Calculate percentage with guaranteed max of 100%
  const percentage = Math.min((numericRating / maxRating) * 100, 100);
  
  // More nuanced color scale
  let color, confidenceText;
  if (percentage >= 80) {
    color = 'bg-neon-green';
    confidenceText = 'Very High';
  } else if (percentage >= 60) {
    color = 'bg-green-400';
    confidenceText = 'High';
  } else if (percentage >= 40) {
    color = 'bg-yellow-400';
    confidenceText = 'Moderate';
  } else if (percentage >= 20) {
    color = 'bg-orange-500';
    confidenceText = 'Low';
  } else {
    color = 'bg-red-500';
    confidenceText = 'Very Low';
  }
  
  return (
    <div className="mt-2 mb-6">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-400">Confidence Rating</span>
        <div className="flex items-center">
          <span className={`text-sm font-medium px-2 py-0.5 rounded ${
            percentage >= 60 ? 'bg-neon-green/20 text-neon-green' : 
            percentage >= 40 ? 'bg-yellow-400/20 text-yellow-400' : 
            'bg-red-500/20 text-red-400'
          }`}>
            {confidenceText}
          </span>
          <span className="text-sm font-bold text-white ml-2">{numericRating.toFixed(1)}/{maxRating}</span>
        </div>
      </div>
      <div className="w-full bg-dark h-3 rounded-full">
        <div 
          className={`h-3 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="mt-1 text-xs text-gray-500 italic">
        Note: AI confidence reflects the model's certainty, not factual accuracy.
      </div>
    </div>
  );
};

export const MetricRow = ({ label, value, isNegative = false }) => {
  return (
    <tr className="border-b border-gray-800">
      <td className="py-3 text-gray-400">{label}</td>
      <td className={`py-3 text-right ${isNegative ? 'text-red-500' : 'text-white'}`}>{value}</td>
    </tr>
  );
};

export const KeyFindings = ({ findings }) => {
  return (
    <div className="bg-dark rounded-md p-4 mt-4">
      <h3 className="text-neon-green font-medium mb-2">Key Findings:</h3>
      <ul className="list-none">
        {findings.map((finding, index) => (
          <li key={index} className="flex items-start mb-2">
            <span className="text-neon-green mr-2">•</span>
            <span className="text-gray-300">{finding}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ResultCard; 