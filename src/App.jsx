import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Trail } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function HBotScene({ motor1, motor2, zHeight, playing, onPosition }) {
  const leftCarriage = useRef();
  const rightCarriage = useRef();
  const toolHead = useRef();
  const zModule = useRef();
  const position = useRef(new THREE.Vector3(0, 0, 0));

  const xLimit = 3.2;
  const yLimit = 2.2;
  const rodOffset = 2.4;

  useFrame((_, delta) => {
    if (!playing) return;

    const vx = (motor1 + motor2) * 0.8;
    const vy = (motor1 - motor2) * 0.8;

    position.current.x = clamp(position.current.x + vx * delta, -xLimit, xLimit);
    position.current.y = clamp(position.current.y + vy * delta, -yLimit, yLimit);

    if (leftCarriage.current) {
      leftCarriage.current.position.x = position.current.x;
    }
    if (rightCarriage.current) {
      rightCarriage.current.position.x = position.current.x;
    }
    if (toolHead.current) {
      toolHead.current.position.set(position.current.x, position.current.y, 0);
    }
    if (zModule.current) {
      zModule.current.position.z = zHeight;
    }

    onPosition({
      x: position.current.x,
      y: position.current.y,
      z: zHeight,
    });
  });

  const beltPoints = useMemo(
    () => [
      new THREE.Vector3(-3.8, -2.8, 0.4),
      new THREE.Vector3(3.8, -2.8, 0.4),
      new THREE.Vector3(3.8, 2.8, 0.4),
      new THREE.Vector3(-3.8, 2.8, 0.4),
      new THREE.Vector3(-3.8, -2.8, 0.4),
    ],
    []
  );

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 8]} intensity={0.9} />

      <mesh position={[0, 0, -0.4]}>
        <boxGeometry args={[9, 7, 0.6]} />
        <meshStandardMaterial color="#1c1f24" />
      </mesh>

      {[
        [-4.2, -3.2],
        [4.2, -3.2],
        [-4.2, 3.2],
        [4.2, 3.2],
      ].map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, 1.4]}>
          <boxGeometry args={[0.4, 0.4, 3.2]} />
          <meshStandardMaterial color="#2b2f36" />
        </mesh>
      ))}

      <mesh position={[0, -rodOffset, 0.3]}>
        <boxGeometry args={[7.6, 0.25, 0.25]} />
        <meshStandardMaterial color="#4c5a69" />
      </mesh>
      <mesh position={[0, rodOffset, 0.3]}>
        <boxGeometry args={[7.6, 0.25, 0.25]} />
        <meshStandardMaterial color="#4c5a69" />
      </mesh>

      <mesh ref={leftCarriage} position={[0, -rodOffset, 0.55]}>
        <boxGeometry args={[0.9, 0.7, 0.4]} />
        <meshStandardMaterial color="#8fa3b8" />
      </mesh>
      <mesh ref={rightCarriage} position={[0, rodOffset, 0.55]}>
        <boxGeometry args={[0.9, 0.7, 0.4]} />
        <meshStandardMaterial color="#8fa3b8" />
      </mesh>

      <mesh position={[0, 0, 0.3]}>
        <boxGeometry args={[0.15, 5.2, 0.15]} />
        <meshStandardMaterial color="#3a4553" />
      </mesh>

      <Trail
        width={0.12}
        length={35}
        color="#4dd0e1"
        attenuation={(t) => t * t}
      >
        <group ref={toolHead}>
          <mesh position={[0, 0, 0.6]}>
            <boxGeometry args={[1.2, 1, 0.35]} />
            <meshStandardMaterial color="#3ec0d2" />
          </mesh>
          <mesh ref={zModule} position={[0, 0, 1.1]}>
            <boxGeometry args={[0.5, 0.5, 1]} />
            <meshStandardMaterial color="#f5b547" />
          </mesh>
        </group>
      </Trail>

      <line>
        <bufferGeometry setFromPoints={beltPoints} />
        <lineBasicMaterial color="#f5b547" />
      </line>

      {[
        [-3.8, -2.8],
        [3.8, -2.8],
        [3.8, 2.8],
        [-3.8, 2.8],
      ].map(([x, y]) => (
        <mesh key={`pulley-${x}-${y}`} position={[x, y, 0.45]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
          <meshStandardMaterial color="#c7d0db" />
        </mesh>
      ))}

      <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.1} />
    </group>
  );
}

export default function App() {
  const [motor1, setMotor1] = useState(0.6);
  const [motor2, setMotor2] = useState(0.2);
  const [zHeight, setZHeight] = useState(0.6);
  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0.6 });

  return (
    <div className="app">
      <div className="canvas-wrap">
        <Canvas camera={{ position: [8, 6, 6], fov: 40 }}>
          <color attach="background" args={["#101217"]} />
          <HBotScene
            motor1={motor1}
            motor2={motor2}
            zHeight={zHeight}
            playing={playing}
            onPosition={setPosition}
          />
        </Canvas>
      </div>

      <aside className="panel">
        <div>
          <h1>H-Bot Motion System</h1>
          <p>
            Same-direction motor rotation drives X motion. Opposite-direction
            rotation drives Y motion. Mixed speeds create diagonal travel.
          </p>
        </div>

        <div className="controls">
          <label>
            Motor 1 Speed: <span>{motor1.toFixed(2)}</span>
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.01"
              value={motor1}
              onChange={(event) => setMotor1(Number(event.target.value))}
            />
          </label>
          <label>
            Motor 2 Speed: <span>{motor2.toFixed(2)}</span>
            <input
              type="range"
              min="-1.5"
              max="1.5"
              step="0.01"
              value={motor2}
              onChange={(event) => setMotor2(Number(event.target.value))}
            />
          </label>
          <label>
            Z-Axis Height: <span>{zHeight.toFixed(2)}</span>
            <input
              type="range"
              min="0"
              max="1.4"
              step="0.01"
              value={zHeight}
              onChange={(event) => setZHeight(Number(event.target.value))}
            />
          </label>
        </div>

        <div className="readout">
          <div>
            <span>X</span>
            <strong>{position.x.toFixed(2)}</strong>
          </div>
          <div>
            <span>Y</span>
            <strong>{position.y.toFixed(2)}</strong>
          </div>
          <div>
            <span>Z</span>
            <strong>{position.z.toFixed(2)}</strong>
          </div>
        </div>

        <button className="toggle" onClick={() => setPlaying((prev) => !prev)}>
          {playing ? "Pause" : "Play"}
        </button>
      </aside>
    </div>
  );
}
