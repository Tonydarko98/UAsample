import React, { useRef, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

// Brighter Toon Shader
const toonVertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const toonFragmentShader = `
  uniform vec3 color;
  uniform sampler2D map;
  uniform vec3 lightPositions[4];
  uniform vec3 lightColors[4];

  varying vec3 vNormal;
  varying vec2 vUv;
  varying vec3 vViewPosition;

  void main() {
    vec4 texColor = texture2D(map, vUv);
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    vec3 totalLight = vec3(0.3); // Ambient light
    for(int i = 0; i < 4; i++) {
      vec3 lightDir = normalize(lightPositions[i] - vViewPosition);
      float diff = max(0.0, dot(normal, lightDir));
      
      // Brighter toon shading steps
      if (diff > 0.8) {
        diff = 1.0;
      } else if (diff > 0.5) {
        diff = 0.8;
      } else if (diff > 0.2) {
        diff = 0.6;
      } else {
        diff = 0.4;
      }

      totalLight += lightColors[i] * diff;
    }

    // Rim lighting
    float rimAmount = 0.6;
    float rim = smoothstep(0.3, 0.6, 1.0 - max(0.0, dot(viewDir, normal)));

    vec3 finalColor = texColor.rgb * color * (totalLight + rim * rimAmount);
    finalColor = pow(finalColor, vec3(0.4545)); // Gamma correction for brightness
    
    gl_FragColor = vec4(finalColor, texColor.a);
  }
`;

function Lights() {
  const mainLight = useRef();
  const light1 = useRef();
  const light2 = useRef();
  const light3 = useRef();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    light1.current.position.x = Math.sin(time * 0.7) * 3;
    light1.current.position.y = Math.cos(time * 0.5) * 3;
    light2.current.position.x = Math.sin(time * 0.3) * 3;
    light2.current.position.z = Math.cos(time * 0.5) * 3;
    light3.current.position.z = Math.sin(time * 0.5) * 3;
    light3.current.position.y = Math.cos(time * 0.3) * 3;
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight ref={mainLight} position={[0, 5, 5]} intensity={0.8} color="#ffffff" />
      <pointLight ref={light1} position={[2, 2, 2]} intensity={0.5} color="#ffcccc" />
      <pointLight ref={light2} position={[-2, -2, 2]} intensity={0.5} color="#ccffcc" />
      <pointLight ref={light3} position={[2, -2, -2]} intensity={0.5} color="#ccccff" />
    </>
  );
}

function Model({ isDancing, onClick }) {
  const group = useRef();
  const { scene, materials, animations } = useGLTF(`${process.env.PUBLIC_URL}/LOwpolyGAMETAP.glb`);
  const { actions, mixer } = useAnimations(animations, group);
  const [currentAction, setCurrentAction] = useState(null);
  const { camera } = useThree();

  const lightPositions = useMemo(() => [
    new THREE.Vector3(0, 5, 5),
    new THREE.Vector3(2, 2, 2),
    new THREE.Vector3(-2, -2, 2),
    new THREE.Vector3(2, -2, -2)
  ], []);

  const lightColors = useMemo(() => [
    new THREE.Color("#ffffff"),
    new THREE.Color("#ffcccc"),
    new THREE.Color("#ccffcc"),
    new THREE.Color("#ccccff")
  ], []);

  const toonMaterials = useMemo(() => {
    return Object.entries(materials).reduce((acc, [name, mat]) => {
      acc[name] = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: mat.color || new THREE.Color(0xffffff) },
          map: { value: mat.map },
          lightPositions: { value: lightPositions },
          lightColors: { value: lightColors }
        },
        vertexShader: toonVertexShader,
        fragmentShader: toonFragmentShader,
      });
      return acc;
    }, {});
  }, [materials, lightPositions, lightColors]);

  useEffect(() => {
    if (actions['Idle']) {
      actions['Idle'].play();
      setCurrentAction(actions['Idle']);
    }

    if (group.current) {
      const box = new THREE.Box3().setFromObject(group.current);
      const size = box.getSize(new THREE.Vector3());
      group.current.position.y = -size.y / 2;
      camera.position.set(0, size.y / 4, size.y * 1);
      camera.lookAt(new THREE.Vector3(1, size.y / 2, 0));
    }
  }, [actions, camera]);

  useEffect(() => {
    if (isDancing && actions['Dance'] && currentAction !== actions['Dance']) {
      actions['Dance'].reset().fadeIn(0.5).play();
      if (currentAction) currentAction.fadeOut(0.5);
      setCurrentAction(actions['Dance']);
    } else if (!isDancing && actions['Idle'] && currentAction !== actions['Idle']) {
      actions['Idle'].reset().fadeIn(0.5).play();
      if (currentAction) currentAction.fadeOut(0.5);
      setCurrentAction(actions['Idle']);
    }
  }, [isDancing, actions, currentAction]);

  useFrame((state, delta) => {
    mixer.update(delta);
    
    // Update light positions in shader
    Object.values(toonMaterials).forEach(material => {
      material.uniforms.lightPositions.value = lightPositions;
    });
  });

  return (
    <group ref={group} dispose={null} scale={[2, 2, 2]} onClick={onClick}>
      <primitive object={scene} />
      {scene.children.map((child, index) => {
        if (child.isMesh) {
          return (
            <skinnedMesh 
              key={index}
              geometry={child.geometry}
              skeleton={child.skeleton}
              material={toonMaterials[child.material.name]}
            />
          );
        }
        return null;
      })}
    </group>
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
        <Lights />
        <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="blue" /></mesh>}>
          <Model isDancing={isDancing} onClick={handleTap} />
        </Suspense>
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

useGLTF.preload(`${process.env.PUBLIC_URL}/LOwpolyGAMETAP.glb`);