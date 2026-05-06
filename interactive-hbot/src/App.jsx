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
  fixed: true,
};

const LAYOUT = {
  gantry: {
    id: "gantry",
    name: "Moving Gantry (Y)",
    src: `${IMAGE_BASE}/part%202.PNG`,
    width: 760,
    height: 150,
    x: 110,
  },
  carriage: {
    id: "carriage",
    name: "Carriage (X)",
    src: `${IMAGE_BASE}/part3.PNG`,
    width: 250,
    height: 185,
    offsetY: 110,
  },
  tool: {
    id: "tool",
    name: "Tool Head (XY)",
    src: `${IMAGE_BASE}/part4.PNG`,
    width: 160,
    height: 160,
    offsetX: 52,
    offsetY: 215,
  },
};

const MARGIN = 26;

const LIMITS = {
  gantryY: {
    min: BASE.y + MARGIN,
    max:
      BASE.y +
      BASE.height -
      LAYOUT.tool.offsetY -
      LAYOUT.tool.height -
      MARGIN,
  },
  carriageX: {
    min: BASE.x + MARGIN,
    max:
      BASE.x +
      BASE.width -
      LAYOUT.tool.offsetX -
      LAYOUT.tool.width -
      MARGIN,
  },
};

const INITIAL_MOTION = {
  gantryY: BASE.y + 90,
  carriageX: BASE.x + 260,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function App() {
  const [motion, setMotion] = useState(INITIAL_MOTION);
  const [active, setActive] = useState(null);
  const containerRef = useRef(null);

  const parts = useMemo(() => {
    const gantry = {
      ...LAYOUT.gantry,
      x: LAYOUT.gantry.x,
      y: motion.gantryY,
    };
    const carriage = {
      ...LAYOUT.carriage,
      x: motion.carriageX,
      y: motion.gantryY + LAYOUT.carriage.offsetY,
    };
    const tool = {
      ...LAYOUT.tool,
      x: motion.carriageX + LAYOUT.tool.offsetX,
      y: motion.gantryY + LAYOUT.tool.offsetY,
    };

    return [BASE, gantry, carriage, tool];
  }, [motion]);

  const partMap = useMemo(
    () => new Map(parts.map((part) => [part.id, part])),
    [parts]
  );

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!active || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const pointer = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      if (active.id === "gantry") {
        const nextY = clamp(
          pointer.y - active.offsetY,
          LIMITS.gantryY.min,
          LIMITS.gantryY.max
        );
        setMotion((current) => ({ ...current, gantryY: nextY }));
        return;
      }

      if (active.id === "carriage") {
        const nextX = clamp(
          pointer.x - active.offsetX,
          LIMITS.carriageX.min,
          LIMITS.carriageX.max
        );
        setMotion((current) => ({ ...current, carriageX: nextX }));
        return;
      }

      if (active.id === "tool") {
        const toolX = pointer.x - active.offsetX;
        const toolY = pointer.y - active.offsetY;
        const nextCarriageX = clamp(
          toolX - LAYOUT.tool.offsetX,
          LIMITS.carriageX.min,
          LIMITS.carriageX.max
        );
        const nextGantryY = clamp(
          toolY - LAYOUT.tool.offsetY,
          LIMITS.gantryY.min,
          LIMITS.gantryY.max
        );
        setMotion({ carriageX: nextCarriageX, gantryY: nextGantryY });
      }
    };

    const handlePointerUp = () => {
      setActive(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [active]);

  const handlePointerDown = (event, partId) => {
    const part = partMap.get(partId);
    if (!part || part.fixed) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setActive({
      id: partId,
      offsetX: pointer.x - part.x,
      offsetY: pointer.y - part.y,
    });
  };

  const resetMotion = () => setMotion(INITIAL_MOTION);

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Interactive H-Bot Cartesian Assembly</h1>
          <p>
            The red frame is fixed. Drag the gantry to move on Y, drag the
            carriage to move on X, or drag the tool head for full XY motion with
            realistic mechanical limits.
          </p>
        </div>
        <button className="reset" onClick={resetMotion}>
          Reset position
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
              className={`part ${part.fixed ? "fixed" : ""} ${
                active?.id === part.id ? "dragging" : ""
              }`}
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
            <strong>Travel limits:</strong> X {Math.round(
              LIMITS.carriageX.min
            )}–{Math.round(LIMITS.carriageX.max)} px, Y {Math.round(
              LIMITS.gantryY.min
            )}–{Math.round(LIMITS.gantryY.max)} px
          </div>
          <div>Active: {active?.id ?? "None"}</div>
        </div>
      </section>
    </div>
  );
}
