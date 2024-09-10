import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

function Model({ isDancing, onClick }) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('/LOwpolyGAMETAP.glb');
  const { actions, mixer } = useAnimations(animations, group);
  const [currentAction, setCurrentAction] = useState(null);
  const { camera } = useThree();

  useEffect(() => {
    actions['Idle'].play();
    setCurrentAction(actions['Idle']);

    if (group.current) {
      const box = new THREE.Box3().setFromObject(group.current);
      const size = box.getSize(new THREE.Vector3());
      group.current.position.y = -size.y / 2;
      camera.position.set(0, size.y / 4, size.y * 1);
      camera.lookAt(new THREE.Vector3(1, size.y / 2, 0));
    }
  }, [actions, camera]);

  useEffect(() => {
    if (isDancing && currentAction !== actions['Dance']) {
      actions['Dance'].reset().fadeIn(0.5).play();
      if (currentAction) currentAction.fadeOut(0.5);
      setCurrentAction(actions['Dance']);
    } else if (!isDancing && currentAction !== actions['Idle']) {
      actions['Idle'].reset().fadeIn(0.5).play();
      if (currentAction) currentAction.fadeOut(0.5);
      setCurrentAction(actions['Idle']);
    }
  }, [isDancing, actions, currentAction]);

  useFrame((state, delta) => {
    mixer.update(delta);
  });

  // Improve material settings for better diffuse lighting
  Object.values(materials).forEach((material) => {
    if (material.isMeshStandardMaterial) {
      material.roughness = 0.8; // Slightly reduced for some subtle highlights
      material.metalness = 0;
      material.flatShading = false; // Disable flat shading for smoother look
      material.emissiveIntensity = isDancing ? 0.4 : 0;
      material.color.convertSRGBToLinear(); // Ensure correct color space
    }
  });

  return (
    <group ref={group} dispose={null} scale={[2, 2, 2]} onClick={onClick}>
      <primitive object={nodes.Armature} />
    </group>
  );
}

function Lights({ isDancing }) {
  const colorLights = useRef([]);
  const mainLight = useRef();

  useEffect(() => {
    if (mainLight.current) {
      mainLight.current.intensity = isDancing ? 4 : 1;
    }
    colorLights.current.forEach((light, index) => {
      if (light) {
        light.intensity = isDancing ? 0.4 : 0;
        const angle = (index / 3) * Math.PI * 2;
        light.position.set(
          Math.cos(angle) * 3,
          Math.sin(angle) * 3,
          2
        );
      }
    });
  }, [isDancing]);

  return (
    <>
      <ambientLight intensity={0.8} /> {/* Increased ambient light */}
      <hemisphereLight 
        skyColor={new THREE.Color(0xffffff)}
        groundColor={new THREE.Color(0x8080ff)}
        intensity={0.5}
      /> {/* Added hemisphere light for better overall illumination */}
      <directionalLight 
        ref={mainLight}
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
      />
      <pointLight ref={el => colorLights.current[0] = el} color="#ff9999" />
      <pointLight ref={el => colorLights.current[1] = el} color="#99ff99" />
      <pointLight ref={el => colorLights.current[2] = el} color="#9999ff" />
    </>
  );
}

function DanceButton({ onTap }) {
  const [isDancing, setIsDancing] = useState(false);
  const [points, setPoints] = useState(0);
  const [clickEffects, setClickEffects] = useState([]);
  const containerRef = useRef(null);

  const handleTap = useCallback((event) => {
    setIsDancing(true);
    setPoints(prev => prev + 12);
    onTap();

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setClickEffects(prev => [...prev, { id: Date.now(), x, y, points: 12 }]);

    clearTimeout(window.danceTimer);
    window.danceTimer = setTimeout(() => setIsDancing(false), 3000);
  }, [onTap]);

  return (
    <div ref={containerRef} className="w-full h-[65vh] relative" onClick={handleTap}>
      <Canvas>
        <Lights isDancing={isDancing} />
        <Model isDancing={isDancing} onClick={handleTap} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      {clickEffects.map(effect => (
        <motion.div
          key={effect.id}
          className="absolute text-yellow-300 font-bold text-2xl pointer-events-none"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -50 }}
          transition={{ duration: 1 }}
          style={{ left: effect.x, top: effect.y }}
          onAnimationComplete={() => setClickEffects(prev => prev.filter(e => e.id !== effect.id))}
        >
          +{effect.points}
        </motion.div>
      ))}
      <div className="absolute top-4 left-4 text-white text-2xl font-bold">
        Points: {points}
      </div>
    </div>
  );
}

export default DanceButton;

useGLTF.preload('/LOwpolyGAMETAP.glb');