import React from 'react';

const FeatureCard = ({ title, description, icon }) => {
  return (
    <div className="bg-dark-lighter p-6 rounded-lg transition-all hover:shadow-neon-green hover:scale-105 duration-300">
      <div className="h-12 w-12 bg-dark-lightest rounded-lg flex items-center justify-center mb-4 text-neon-green">
        {icon}
      </div>
      <h3 className="text-white text-lg font-medium mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
};

export default FeatureCard; 