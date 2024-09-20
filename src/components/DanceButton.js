import React, { useRef, useEffect, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, useAnimations, Text, Html } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// Configuración del juego
const ARROWS = ['👋🏼', '🖖🏼', '🤟🏼', '🤙🏼'];
const BUTTON_SIZE = 60;
const BASE_FALLING_SPEED = 1;
const GAME_DURATION = 60000; // 60 segundos
const HIT_WINDOW = 50;

// Componente de carga
function Loader() {
  return (
    <Html center>
      <div style={{ color: 'white', fontSize: '24px' }}>
        Loading...
      </div>
    </Html>
  );
}

// Componente del modelo 3D principal
function Model({ currentAnimation }) {
  const group = useRef();
  const { scene, animations, materials } = useGLTF(`${process.env.PUBLIC_URL}/LOwpolyGAMETAP.glb`);
  const { actions, mixer } = useAnimations(animations, group);
  const { camera } = useThree();

  useEffect(() => {
    if (group.current) {
      const box = new THREE.Box3().setFromObject(group.current);
      const size = box.getSize(new THREE.Vector3());
      group.current.position.y = -size.y / 2;
      camera.position.set(0, size.y / 4, size.y * 1);
      camera.lookAt(new THREE.Vector3(1, size.y / 2, 0));
    }

    Object.values(materials).forEach(material => {
      if (material.isMeshStandardMaterial) {
        material.envMapIntensity = 1;
        material.roughness = 0.9;
        material.metalness = 0.1;
      }
    });
  }, [camera, scene, materials]);

  useEffect(() => {
    Object.values(actions).forEach(action => action.stop());
    if (actions[currentAnimation]) {
      actions[currentAnimation].reset().fadeIn(0.5).play();
    }
  }, [actions, currentAnimation]);

  useFrame((state, delta) => {
    // Reducir la actualización a 30 FPS
    if (state.clock.elapsedTime % (1 / 30) < delta) {
      mixer.update(1 / 30);
    }
  });

  return (
    <group ref={group} dispose={null} scale={[2, 2, 2]}>
      <primitive object={scene} />
    </group>
  );
}

// Componente del modelo de fondo
function BackgroundModel({ scale = [3, 3, 3], position = [0, -2, 3] }) {
  const group = useRef();
  const { scene, animations, materials } = useGLTF(`${process.env.PUBLIC_URL}/Fondo.glb`);
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    Object.values(actions).forEach(action => {
      action.play();
      action.setLoop(THREE.LoopRepeat);
    });
    Object.values(materials).forEach(material => {
      if (material.isMeshStandardMaterial) {
        material.envMapIntensity = 1;
        material.roughness = 0.9;
        material.metalness = 0.1;
      }
    });
  }, [actions, materials]);

  useFrame((state, delta) => {
    if (state.clock.elapsedTime % (1 / 10) < delta) {
      mixer.update(1 / 30);
    }
  });

  return (
    <group ref={group} dispose={null} scale={scale} position={position}>
      <primitive object={scene} />
    </group>
  );
}

// Componente de iluminación
function Lights() {
  return (
    <>
      <ambientLight intensity={2.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, 5]} intensity={1.5} />
    </>
  );
}

// Escena principal de Three.js con postprocesamiento
function ThreeJSScene({ currentAnimation }) {
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <Suspense fallback={<Loader />}>
        <BackgroundModel />
        <Model currentAnimation={currentAnimation} />
        <Lights />
        <EffectComposer>
          <Bloom intensity={0.5} />
          <ChromaticAberration
            offset={[0.002, 0.002]}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Suspense>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2 - 0.087}
        maxPolarAngle={Math.PI / 2 + 0.087}
        minAzimuthAngle={-0.087}
        maxAzimuthAngle={0.087}
      />
    </Canvas>
  );
}

// Componente de nota que cae
function FallingNote({ arrow, position, yPos, onClick }) {
  return (
    <div 
      style={{
        position: 'absolute',
        left: `calc(${position}px - ${BUTTON_SIZE / 2}px)`,
        top: yPos,
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        backgroundColor: '#1a237e',
        borderRadius: '50%',
        boxShadow: '0 0 10px rgba(255,255,255,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        cursor: 'pointer',
        border: '2px solid white',
      }}
      onClick={() => onClick(arrow, position, yPos)}
    >
      {arrow}
    </div>
  );
}

// Componente principal del juego
function RhythmGame() {
  const [score, setScore] = useState(0);
  const [currentAnimation, setCurrentAnimation] = useState('Idle');
  const [fallingNotes, setFallingNotes] = useState([]);
  const [combo, setCombo] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [gameSpeed, setGameSpeed] = useState(BASE_FALLING_SPEED);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [activeButtons, setActiveButtons] = useState({});
  const [gameStarted, setGameStarted] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [highScore, setHighScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef(null);
  const [buttonPositions, setButtonPositions] = useState([]);

  // Efecto para simular la carga de recursos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Simula 3 segundos de carga

    return () => clearTimeout(timer);
  }, []);

  // Configuración de las posiciones de los botones
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const spacing = containerWidth / 5;
      setButtonPositions([
        spacing - BUTTON_SIZE / 2,
        spacing * 2 - BUTTON_SIZE / 2,
        spacing * 3 - BUTTON_SIZE / 2,
        spacing * 4 - BUTTON_SIZE / 2
      ]);
    }
  }, []);

  // Manejo de la cuenta regresiva y inicio del juego
  useEffect(() => {
    if (gameStarted && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameStarted && countdown === 0) {
      setCountdown('DANCE!');
      setTimeout(() => {
        setCountdown(null);
        startGame();
      }, 1000);
    }
  }, [gameStarted, countdown]);

  // Iniciar el juego
  const startGame = () => {
    setTimeLeft(GAME_DURATION);
    setScore(0);
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setGameSpeed(BASE_FALLING_SPEED);
    setGameOver(false);
    setFallingNotes([]);
  };

  // Manejo del tiempo de juego
  useEffect(() => {
    if (timeLeft > 0 && !gameOver && countdown === null) {
      const timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1000);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft <= 0 && !gameOver) {
      setGameOver(true);
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('highScore', score);
      }
    }
  }, [timeLeft, gameOver, countdown, score, highScore]);

  // Cargar la puntuación más alta
  useEffect(() => {
    const storedHighScore = localStorage.getItem('highScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }
  }, []);

  // Función para obtener el intervalo de generación de notas según la dificultad
  const getDifficultyInterval = () => {
    switch (difficulty) {
      case 'easy': return 1200 / (gameSpeed / BASE_FALLING_SPEED);
      case 'medium': return 900 / (gameSpeed / BASE_FALLING_SPEED);
      case 'hard': return 600 / (gameSpeed / BASE_FALLING_SPEED);
      default: return 900 / (gameSpeed / BASE_FALLING_SPEED);
    }
  };

  // Generación de notas
  useEffect(() => {
    if (gameOver || countdown !== null) return;
    const interval = setInterval(() => {
      const columnIndex = Math.floor(Math.random() * 4);
      const newNote = {
        id: Date.now(),
        arrow: ARROWS[columnIndex],
        position: buttonPositions[columnIndex],
        yPos: 0
      };
      setFallingNotes(prev => [...prev, newNote]);
    }, getDifficultyInterval());

    return () => clearInterval(interval);
  }, [buttonPositions, gameSpeed, gameOver, countdown, difficulty]);

  // Animación de caída de notas
  useEffect(() => {
    if (gameOver || countdown !== null) return;
    const frameId = requestAnimationFrame(function animate() {
      setFallingNotes(prev => prev.map(note => ({
        ...note,
        yPos: note.yPos + gameSpeed
      })).filter(note => note.yPos <= window.innerHeight - 200));

      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(frameId);
  }, [gameSpeed, gameOver, countdown]);

  // Manejo de clics en los botones
  const handleButtonClick = useCallback((arrow, position, yPos) => {
    if (gameOver || countdown !== null) return;
    const hitNote = fallingNotes.find(note => 
      note.position === position && 
      note.arrow === arrow &&
      Math.abs(window.innerHeight - 200 - BUTTON_SIZE - note.yPos) < HIT_WINDOW
    );

    if (hitNote) {
      const points = 10 * multiplier;
      setScore(prev => prev + points);
      setCombo(prev => prev + 1);
      setStreak(prev => prev + 1);
      setCurrentAnimation(combo % 3 === 0 ? 'Dance' : combo % 3 === 1 ? 'Dance2' : 'Dance3');
      setFallingNotes(prev => prev.filter(note => note.id !== hitNote.id));
      setActiveButtons(prev => ({ ...prev, [arrow]: 'green' }));
      setTimeout(() => setActiveButtons(prev => ({ ...prev, [arrow]: null })), 100);

      if (combo >= 20) {
        setFeedbackText('AMAZING!');
        setGameSpeed(prev => Math.min(prev * 1.1, BASE_FALLING_SPEED * 2));
        setMultiplier(4);
      } else if (combo >= 10) {
        setFeedbackText('Excellent!');
        setGameSpeed(prev => Math.min(prev * 1.05, BASE_FALLING_SPEED * 1.5));
        setMultiplier(3);
      } else if (combo >= 5) {
        setFeedbackText('Great!');
        setGameSpeed(prev => Math.min(prev * 1.02, BASE_FALLING_SPEED * 1.2));
        setMultiplier(2);
      } else {
        setFeedbackText('Good!');
      }
    } else {
      handleNoteMiss(arrow);
    }
  }, [fallingNotes, combo, gameOver, countdown, multiplier]);

  // Manejo de notas perdidas
  const handleNoteMiss = useCallback((arrow) => {
    if (gameOver || countdown !== null) return;
    setCombo(0);
    setStreak(0);
    setMultiplier(1);
    setCurrentAnimation('Idle');
    setGameSpeed(BASE_FALLING_SPEED);
    setFeedbackText('Miss!');
    setActiveButtons(prev => ({ ...prev, [arrow]: 'red' }));
    setTimeout(() => setActiveButtons(prev => ({ ...prev, [arrow]: null })), 100);
  }, [gameOver, countdown]);

  // Renderizado de la pantalla de fin de juego
  const renderGameOverScreen = () => (
    <div style={{ width: '100%', height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white', zIndex: 100 }}>
      <h1>Game Over!</h1>
      <h2>Your score: {score}</h2>
      <h3>High Score: {highScore}</h3>
      <button onClick={() => {setGameStarted(true); setCountdown(3);}} style={{ padding: '10px 20px', fontSize: '18px', marginTop: '20px', cursor: 'pointer' }}>Play Again</button>
      <div style={{ marginTop: '20px' }}>
        <label>Difficulty: </label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
    </div>
  );

  // Renderizado de la interfaz de juego
  const renderGameUI = () => (
    <>
      <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: '24px', zIndex: 5 }}>
        Score: {score}
      </div>
      <div style={{ position: 'absolute', top: 40, left: 10, color: 'white', fontSize: '24px', zIndex: 5 }}>
        Combo: {combo}
      </div>
      <div style={{ position: 'absolute', top: 70, left: 10, color: 'white', fontSize: '24px', zIndex: 5 }}>
        Multiplier: x{multiplier}
      </div>
      <div style={{ position: 'absolute', top: 10, right: 10, color: 'white', fontSize: '24px', zIndex: 5 }}>
        Time: {Math.ceil(timeLeft / 1000)}s
      </div>
      <div style={{ position: 'absolute', top: 40, right: 10, color: 'white', fontSize: '24px', zIndex: 5 }}>
        High Score: {highScore}
      </div>
      
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '36px', textAlign: 'center', zIndex: 5 }}>
        {feedbackText}
      </div>
    </>
  );

  // Renderizado principal del componente
  if (isLoading) {
    return (
      <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', color: 'white' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: 'calc(100vh - 180px)', position: 'relative', overflow: 'hidden' }}>
      <ThreeJSScene currentAnimation={currentAnimation} />
      
      {fallingNotes.map(note => (
        <FallingNote 
          key={note.id} 
          arrow={note.arrow} 
          position={note.position} 
          yPos={note.yPos}
          onClick={handleButtonClick}
        />
      ))}
      
      {/* Botones de juego */}
      <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', zIndex: 10 }}>
        {ARROWS.map((arrow, index) => (
          <div 
            key={index}
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              backgroundColor: '#1a237e',
              borderRadius: '50%',
              cursor: 'pointer',
              border: `6px solid ${activeButtons[arrow] || 'white'}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '24px',
              transition: 'transform 0.1s',
              transform: activeButtons[arrow] ? 'scale(3.1)' : 'scale(1)',
              boxShadow: '0 0 15px rgba(255,255,255,0.7)',
            }}
            onClick={() => handleButtonClick(arrow, buttonPositions[index], window.innerHeight - 200)}
          >
            {arrow}
          </div>
        ))}
      </div>

      {/* Pantalla de inicio */}
      {!gameStarted && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 }}>
          <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>Rhythm Arrow Dance</h1>
          <button onClick={() => setGameStarted(true)} style={{ padding: '20px 40px', fontSize: '24px', backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
            Start Game
          </button>
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <label style={{ color: 'white', marginRight: '10px' }}>Difficulty: </label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={{ padding: '5px' }}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Cuenta regresiva */}
      {countdown && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'white', fontSize: '72px', fontWeight: 'bold', zIndex: 20 }}>
          {countdown}
        </div>
      )}

      {/* Renderizar pantalla de fin de juego o interfaz de juego */}
      {gameOver || timeLeft <= 0 ? renderGameOverScreen() : renderGameUI()}
    </div>
  );
}

export default RhythmGame;

// Precarga de modelos 3D
useGLTF.preload(`${process.env.PUBLIC_URL}/LOwpolyGAMETAP.glb`);
useGLTF.preload(`${process.env.PUBLIC_URL}/Fondo.glb`);