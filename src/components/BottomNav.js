import React from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Task', icon: '👛' },
  { name: 'Game', icon: '🎮' },
  { name: 'Shop', icon: '🛒' },
  { name: 'Profile', icon: '👤' },
];

function BottomNav() {
  return (
    <nav className="flex justify-around py-2 px-5 bg-gray-800">
      {navItems.map((item) => (
        <motion.button
          key={item.name}
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${
            item.name === 'Game'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.75 }}
        >
          <span className="text-2xl mb-1">{item.icon}</span>
          <span className="text-xs font-medium">{item.name}</span>
        </motion.button>
      ))}
    </nav>
  );
}

export default BottomNav;