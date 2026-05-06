import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const IMAGE_BASE =
  "https://raw.githubusercontent.com/Endtobi7/test-animation-/main";

const CANVAS = {
  width: 980,
  height: 620,
  padding: 18,
};

const INITIAL_PARTS = [
  {
    id: "part0",
    name: "Base Rail",
    src: `${IMAGE_BASE}/part%200.PNG`,
    width: 820,
    height: 520,
    x: 80,
    y: 60,
  },
  {
    id: "part2",
    name: "Upper Rail",
    src: `${IMAGE_BASE}/part%202.PNG`,
    width: 760,
    height: 140,
    x: 110,
    y: 80,
  },
  {
    id: "part3",
    name: "Carriage",
    src: `${IMAGE_BASE}/part3.PNG`,
    width: 260,
    height: 200,
    x: 360,
    y: 250,
  },
  {
    id: "part4",
    name: "Tool Head",
    src: `${IMAGE_BASE}/part4.PNG`,
    width: 160,
    height: 160,
    x: 410,
    y: 320,
  },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const clampPosition = (part, position) => {
  const minX = CANVAS.padding;
  const minY = CANVAS.padding;
  const maxX = CANVAS.width - part.width - CANVAS.padding;
  const maxY = CANVAS.height - part.height - CANVAS.padding;

  return {
    x: clamp(position.x, minX, maxX),
    y: clamp(position.y, minY, maxY),
  };
};

export default function App() {
  const [parts, setParts] = useState(INITIAL_PARTS);
  const [activeId, setActiveId] = useState(null);
  const [pointerOffset, setPointerOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const partMap = useMemo(
    () => new Map(parts.map((part) => [part.id, part])),
    [parts]
  );

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!activeId || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const next = {
        x: event.clientX - rect.left - pointerOffset.x,
        y: event.clientY - rect.top - pointerOffset.y,
      };

      setParts((current) =>
        current.map((part) => {
          if (part.id !== activeId) return part;
          const clamped = clampPosition(part, next);
          return { ...part, x: clamped.x, y: clamped.y };
        })
      );
    };

    const handlePointerUp = () => {
      setActiveId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeId, pointerOffset]);

  const handlePointerDown = (event, partId) => {
    const part = partMap.get(partId);
    if (!part) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveId(partId);

    const rect = event.currentTarget.getBoundingClientRect();
    setPointerOffset({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const resetParts = () => setParts(INITIAL_PARTS);

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Interactive H-Bot Cartesian Assembly</h1>
          <p>
            Drag each part to explore the H-bot layout. Movement is constrained
            to keep the assembly inside the frame for a smooth, realistic feel.
          </p>
        </div>
        <button className="reset" onClick={resetParts}>
          Reset positions
        </button>
      </header>

      <section className="canvas-wrapper">
        <div className="axis">
          <span>X+</span>
          <span>Y+</span>
        </div>
        <div className="canvas" ref={containerRef}>
          <img
            className="background"
            src={`${IMAGE_BASE}/sys%20catesien.PNG`}
            alt="Cartesian reference"
          />
          {parts.map((part) => (
            <div
              key={part.id}
              className={`part ${activeId === part.id ? "dragging" : ""}`}
              style={{
                width: part.width,
                height: part.height,
                transform: `translate3d(${part.x}px, ${part.y}px, 0)`,
              }}
              onPointerDown={(event) => handlePointerDown(event, part.id)}
            >
              <img src={part.src} alt={part.name} draggable={false} />
              <span className="label">{part.name}</span>
            </div>
          ))}
        </div>
        <div className="limits">
          <div>
            <strong>Limits:</strong> X [{CANVAS.padding}…{CANVAS.width -
              CANVAS.padding}
            ] px, Y [{CANVAS.padding}…{CANVAS.height - CANVAS.padding}] px
          </div>
          <div>Active part: {activeId ?? "None"}</div>
        </div>
      </section>
    </div>
  );
}
