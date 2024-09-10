import React from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Ref', icon: '🐻' },
  { name: 'Task', icon: '✅' },
  { name: 'Tap', icon: '🪙' },
  { name: 'Boost', icon: '🚀' },
  { name: 'Stats', icon: '📊' },
];

function BottomNav() {
  return (
    <nav className="flex justify-around py-2 px-1 bg-gray-800 bg-opacity-50">
      {navItems.map((item) => (
        <motion.button
          key={item.name}
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg ${
            item.name === 'Tap'
              ? 'bg-yellow-500 text-gray-900 shadow-lg transform -translate-y-2'
              : 'bg-gray-700 text-gray-300'
          }`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          <span className="text-xl mb-1">{item.icon}</span>
          <span className="text-xs font-medium">{item.name}</span>
        </motion.button>
      ))}
    </nav>
  );
}

export default BottomNav;