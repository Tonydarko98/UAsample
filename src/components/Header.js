import React from 'react';
import { motion } from 'framer-motion';

function Header({ points }) {
  return (
    <header className="p-4 flex justify-between items-center">
      <span className="text-2xl font-bold">TapDance</span>
      <motion.div 
        className="flex items-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="text-yellow-400 mr-2">🪙</span>
        <span className="text-2xl font-bold">{(points / 1000000).toFixed(3)} M</span>
      </motion.div>
    </header>
  );
}

export default Header;