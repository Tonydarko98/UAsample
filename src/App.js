import React, { useState } from 'react';
import Header from './components/Header';
import DanceButton from './components/DanceButton';
import EnergyBar from './components/EnergyBar';
import BottomNav from './components/BottomNav';

function App() {
  const [points, setPoints] = useState(7230000000);
  const [energy, setEnergy] = useState(16);

  const handleTap = () => {
    setPoints(prev => prev + 12);
    setEnergy(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="h-screen flex flex-col text-white font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-blue-100 via-blue-500 to-gray-900 z-0"></div>
      <div className="relative z-10 flex flex-col h-full">
        <Header points={points} />
        <main className="flex-grow flex flex-col items-center justify-between py-4 px-2">
          <EnergyBar energy={energy} />
          <DanceButton onTap={handleTap} />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export default App;