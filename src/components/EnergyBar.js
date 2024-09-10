import React from 'react';
import { motion } from 'framer-motion';

function EnergyBar({ energy }) {
  return (
    <div className="w-full max-w-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="text-yellow-400">⚡</span>
        <span>{energy} / 6500</span>
      </div>
      <div className="w-full bg-purple-800 rounded-full h-3">
        <motion.div
          className="bg-yellow-400 h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(energy / 6500) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default EnergyBar;