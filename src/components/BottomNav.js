import React from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Ref', icon: '🐻' },
  { name: 'Task', icon: '✅' },
  { name: 'Tap', icon: '🪙' },
  { name: 'Boost', icon: '🚀' },
  { name: 'Stats', icon: '📊' },
];

function BottomNav({ activeMenu, toggleMenu }) {
  return (
    <nav className="flex justify-around p-4 bg-purple-800">
      {navItems.map((item) => (
        <motion.button
          key={item.name}
          onClick={() => toggleMenu(item.name)}
          className={`flex flex-col items-center ${
            item.name === 'Tap' ? 'bg-yellow-400 rounded-xl p-2' : ''
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl mb-1">{item.icon}</span>
          <span className="text-xs">{item.name}</span>
        </motion.button>
      ))}
    </nav>
  );
}

export default BottomNav;