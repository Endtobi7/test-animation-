import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const IMAGE_BASE =
  "https://raw.githubusercontent.com/Endtobi7/test-animation-/main";

const CANVAS = {
  width: 980,
  height: 620,
};

const BASE = {
  id: "base",
  name: "Fixed Frame",
  src: `${IMAGE_BASE}/part%200.PNG`,
  width: 860,
  height: 520,
  x: 60,
  y: 60,
};

const LAYOUT = {
  railTopY: BASE.y + 80,
  railBottomY: BASE.y + 350,
  carriage: {
    width: 210,
    height: 160,
    src: `${IMAGE_BASE}/part3.PNG`,
  },
  tool: {
    width: 150,
    height: 150,
    src: `${IMAGE_BASE}/part4.PNG`,
  },
};

const LIMITS = {
  x: {
    min: BASE.x + 60,
    max: BASE.x + BASE.width - 240,
  },
  y: {
    min: BASE.y + 90,
    max: BASE.y + BASE.height - 240,
  },
  z: {
    min: 0,
    max: 90,
  },
};

const SPEED = 140; // px/sec at motor speed 1
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function App() {
  const [motorA, setMotorA] = useState(0.4);
  const [motorB, setMotorB] = useState(0.4);
  const [motion, setMotion] = useState({
    x: (LIMITS.x.min + LIMITS.x.max) / 2,
    y: (LIMITS.y.min + LIMITS.y.max) / 2,
  });
  const [zOffset, setZOffset] = useState(30);
  const [isRunning, setIsRunning] = useState(true);
  const [trail, setTrail] = useState([]);
  const lastFrame = useRef(null);

  useEffect(() => {
    if (!isRunning) return;

    let frameId;

    const animate = (timestamp) => {
      if (!lastFrame.current) lastFrame.current = timestamp;
      const delta = (timestamp - lastFrame.current) / 1000;
      lastFrame.current = timestamp;

      const vx = ((motorA + motorB) / 2) * SPEED;
      const vy = ((motorA - motorB) / 2) * SPEED;

      setMotion((current) => {
        const next = {
          x: clamp(current.x + vx * delta, LIMITS.x.min, LIMITS.x.max),
          y: clamp(current.y + vy * delta, LIMITS.y.min, LIMITS.y.max),
        };

        setTrail((prev) => {
          const nextTrail = [...prev, [next.x, next.y]];
          return nextTrail.length > 120 ? nextTrail.slice(-120) : nextTrail;
        });

        return next;
      });

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      lastFrame.current = null;
    };
  }, [motorA, motorB, isRunning]);

  const resetMotion = () => {
    setMotion({
      x: (LIMITS.x.min + LIMITS.x.max) / 2,
      y: (LIMITS.y.min + LIMITS.y.max) / 2,
    });
    setTrail([]);
    setZOffset(30);
  };

  const carriageLeft = {
    x: motion.x,
    y: LAYOUT.railTopY,
  };

  const carriageRight = {
    x: motion.x,
    y: LAYOUT.railBottomY,
  };

  const tool = {
    x: motion.x + 30,
    y: motion.y,
  };

  const trailPath = trail.map((point) => `${point[0]} ${point[1]}`).join(" ");

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Interactive H-Bot Cartesian Assembly</h1>
          <p>
            The frame is fixed. Motors drive the belt system: same direction =
            X motion, opposite direction = Y motion, different speeds =
            diagonal. Adjust the motors and Z axis to explore the constraints.
          </p>
        </div>
        <div className="hero-actions">
          <button className="reset" onClick={() => setIsRunning((v) => !v)}>
            {isRunning ? "Pause" : "Run"}
          </button>
          <button className="reset outline" onClick={resetMotion}>
            Reset
          </button>
        </div>
      </header>

      <section className="canvas-wrapper">
        <div className="axis">
          <span>X+</span>
          <span>Y+</span>
        </div>
        <div className="canvas">
          <img
            className="background"
            src={`${IMAGE_BASE}/sys%20catesien.PNG`}
            alt="Cartesian reference"
          />

          <svg className="trail" viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}>
            {trail.length > 1 && (
              <polyline points={trailPath} fill="none" stroke="#38bdf8" />
            )}
          </svg>

          <div
            className="part fixed"
            style={{
              width: BASE.width,
              height: BASE.height,
              transform: `translate3d(${BASE.x}px, ${BASE.y}px, 0)`,
            }}
          >
            <img src={BASE.src} alt="Fixed frame" draggable={false} />
          </div>

          <div
            className="belt belt-top"
            style={{
              left: BASE.x + 40,
              top: LAYOUT.railTopY + 20,
              width: BASE.width - 80,
            }}
          />
          <div
            className="belt belt-bottom"
            style={{
              left: BASE.x + 40,
              top: LAYOUT.railBottomY + 20,
              width: BASE.width - 80,
            }}
          />

          <div
            className="part carriage"
            style={{
              width: LAYOUT.carriage.width,
              height: LAYOUT.carriage.height,
              transform: `translate3d(${carriageLeft.x}px, ${carriageLeft.y}px, 0)`,
            }}
          >
            <img src={LAYOUT.carriage.src} alt="Left carriage" />
          </div>

          <div
            className="part carriage"
            style={{
              width: LAYOUT.carriage.width,
              height: LAYOUT.carriage.height,
              transform: `translate3d(${carriageRight.x}px, ${carriageRight.y}px, 0)`,
            }}
          >
            <img src={LAYOUT.carriage.src} alt="Right carriage" />
          </div>

          <div
            className="part tool"
            style={{
              width: LAYOUT.tool.width,
              height: LAYOUT.tool.height,
              transform: `translate3d(${tool.x}px, ${
                tool.y - zOffset
              }px, 0)`,
            }}
          >
            <img src={LAYOUT.tool.src} alt="Tool head" />
            <span className="z-label">Z {Math.round(zOffset)} mm</span>
          </div>
        </div>

        <div className="controls">
          <div className="control">
            <label>Motor A</label>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={motorA}
              onChange={(event) => setMotorA(Number(event.target.value))}
            />
            <span>{motorA.toFixed(2)}</span>
          </div>
          <div className="control">
            <label>Motor B</label>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={motorB}
              onChange={(event) => setMotorB(Number(event.target.value))}
            />
            <span>{motorB.toFixed(2)}</span>
          </div>
          <div className="control">
            <label>Z Axis</label>
            <input
              type="range"
              min={LIMITS.z.min}
              max={LIMITS.z.max}
              step={1}
              value={zOffset}
              onChange={(event) => setZOffset(Number(event.target.value))}
            />
            <span>{Math.round(zOffset)} mm</span>
          </div>
        </div>
      </section>
    </div>
  );
}
