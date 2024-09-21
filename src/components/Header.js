import React from 'react';
import { motion } from 'framer-motion';

function Header({ points }) {
  return (
    <header className="py-2 px-4 flex justify-between items-center bg-gray-800 bg-opacity-50">
      <span className="text-lg font-bold text-purple-300">Union Avatars Dance</span>
      <motion.div
        className="flex items-center bg-gray-700 rounded-full px-3 py-1"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <span className="text-yellow-400 mr-1 text-lg">🪙</span>
        <span className="text-lg font-bold text-yellow-300">{(points / 1000000).toFixed(1)}M</span>
      </motion.div>
    </header>
  );
}

export default Header;