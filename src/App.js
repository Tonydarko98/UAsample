import React, { useState } from 'react';
import Header from './components/Header';
import DanceButton from './components/DanceButton';
import EnergyBar from './components/EnergyBar';
import BottomNav from './components/BottomNav';

function App() {
  const [points, setPoints] = useState(7230000000);
  const [energy, setEnergy] = useState(16);
  const [activeMenu, setActiveMenu] = useState(null);

  const handleTap = () => {
    setPoints(prev => prev + 12);
    setEnergy(prev => Math.max(0, prev - 1));
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <div className="bg-gradient-to-b from-gray-900 to-purple-600 min-h-screen flex flex-col text-white font-sans">
      <Header points={points} />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <DanceButton onTap={handleTap} />
        <EnergyBar energy={energy} />
      </main>
      <BottomNav activeMenu={activeMenu} toggleMenu={toggleMenu} />
    </div>
  );
}

export default App;