import React from 'react';
import { motion } from 'framer-motion';

function EnergyBar({ energy }) {
  const maxEnergy = 20;
  const percentage = (energy / maxEnergy) * 100;

  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between mb-1 text-sm">
        <span className="text-purple-300 font-semibold">Energy</span>
        <span className="text-yellow-300 font-semibold">{energy}/{maxEnergy}</span>
      </div>
      <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-yellow-400 to-yellow-200 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        />
      </div>
    </div>
  );
}

export default EnergyBar;