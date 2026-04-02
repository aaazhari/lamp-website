"use client";

import { useEffect, useRef, useState } from "react";

const CELL = 24;
const ROWS = 15;
const COLS = 19;

const MAZE = [
  "###################",
  "#........#........#",
  "#.###.##.#.##.###.#",
  "#o###.##.#.##.###o#",
  "#.................#",
  "#.###.#.###.#.###.#",
  "#.....#..#..#.....#",
  "#####.##   ##.#####",
  "    #.#     #.#    ",
  "#####.# ### #.#####",
  "#........#........#",
  "#.###.##.#.##.###.#",
  "#o..#........#..o.#",
  "###.#.#.###.#.#.###",
  "#.....#..P..#.....#",
].map((row) => row.padEnd(COLS, " "));

type Status = "playing" | "win" | "lose";
type Direction = "up" | "down" | "left" | "right" | "none";

type Ghost = {
  x: number;
  y: number;
  color: string;
};

export default function PacmanPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<Status>("playing");

  useEffect(() => {
    if (status !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

    let animationFrameId = 0;
    let lastMoveTime = 0;
    const moveDelay = 170;

    let pacman = { x: 10, y: 14 };
    let direction: Direction = "none";
    let nextDirection: Direction = "none";
    let mouthOpen = 0.2;
    let mouthClosing = false;

    let ghosts: Ghost[] = [
      { x: 9, y: 8, color: "#7dd3fc" },
      { x: 11, y: 8, color: "#f9a8d4" },
    ];

    const dots = new Set<string>();

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const char = MAZE[y][x];
        if (char === "." || char === "o") {
          dots.add(`${x},${y}`);
        }
      }
    }

    dots.delete(`${pacman.x},${pacman.y}`);

    function isWall(x: number, y: number) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true;
      return MAZE[y][x] === "#";
    }

    function getNextPosition(x: number, y: number, dir: Direction) {
      if (dir === "left") return { x: x - 1, y };
      if (dir === "right") return { x: x + 1, y };
      if (dir === "up") return { x, y: y - 1 };
      if (dir === "down") return { x, y: y + 1 };
      return { x, y };
    }

    function canMove(x: number, y: number, dir: Direction) {
      if (dir === "none") return false;
      const next = getNextPosition(x, y, dir);
      return !isWall(next.x, next.y);
    }

    function drawMaze() {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);

      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (MAZE[y][x] === "#") {
            ctx.strokeRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
          }
        }
      }
    }

    function drawDots() {
      dots.forEach((key) => {
        const [x, y] = key.split(",").map(Number);
        const char = MAZE[y][x];

        ctx.beginPath();
        ctx.fillStyle = "#f5d0c5";
        ctx.arc(
          x * CELL + CELL / 2,
          y * CELL + CELL / 2,
          char === "o" ? 5 : 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    }

    function getPacmanAngle() {
      if (direction === "right") return 0;
      if (direction === "left") return Math.PI;
      if (direction === "up") return -Math.PI / 2;
      if (direction === "down") return Math.PI / 2;
      return 0;
    }

    function drawPacman() {
      const px = pacman.x * CELL + CELL / 2;
      const py = pacman.y * CELL + CELL / 2;
      const angle = getPacmanAngle();

      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(
        px,
        py,
        CELL / 2 - 3,
        angle + mouthOpen,
        angle + Math.PI * 2 - mouthOpen
      );
      ctx.closePath();
      ctx.fill();

      if (mouthClosing) mouthOpen -= 0.02;
      else mouthOpen += 0.02;

      if (mouthOpen > 0.35) mouthClosing = true;
      if (mouthOpen < 0.08) mouthClosing = false;
    }

    function drawGhost(ghost: Ghost) {
      const gx = ghost.x * CELL + CELL / 2;
      const gy = ghost.y * CELL + CELL / 2;

      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(gx, gy - 2, 8, Math.PI, 0);
      ctx.lineTo(gx + 8, gy + 8);
      ctx.lineTo(gx + 4, gy + 4);
      ctx.lineTo(gx, gy + 8);
      ctx.lineTo(gx - 4, gy + 4);
      ctx.lineTo(gx - 8, gy + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(gx - 3, gy - 2, 2, 0, Math.PI * 2);
      ctx.arc(gx + 3, gy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    function movePacman() {
      if (nextDirection !== "none" && canMove(pacman.x, pacman.y, nextDirection)) {
        direction = nextDirection;
      }

      if (canMove(pacman.x, pacman.y, direction)) {
        const next = getNextPosition(pacman.x, pacman.y, direction);
        pacman = next;
      }

      dots.delete(`${pacman.x},${pacman.y}`);
    }

    let ghostMoveCounter = 0;
const ghostSpeed = 3; // higher = slower (try 3–6)

function moveGhosts() {
    ghostMoveCounter++;
  
    // Only move ghosts every few frames
    if (ghostMoveCounter % ghostSpeed !== 0) return;
  
    ghosts = ghosts.map((ghost) => {
      const possibleDirections: Direction[] = ["left", "right", "up", "down"].filter(
        (dir) => canMove(ghost.x, ghost.y, dir)
      ) as Direction[];
  
      if (possibleDirections.length === 0) return ghost;
  
      const bestDirection = possibleDirections.sort((a, b) => {
        const nextA = getNextPosition(ghost.x, ghost.y, a);
        const nextB = getNextPosition(ghost.x, ghost.y, b);
  
        const distA = Math.abs(nextA.x - pacman.x) + Math.abs(nextA.y - pacman.y);
        const distB = Math.abs(nextB.x - pacman.x) + Math.abs(nextB.y - pacman.y);
  
        return distA - distB;
      })[0];
  
      const next = getNextPosition(ghost.x, ghost.y, bestDirection);
      return { ...ghost, x: next.x, y: next.y };
    });
  }

    function checkCollisions() {
      const hitGhost = ghosts.some((ghost) => ghost.x === pacman.x && ghost.y === pacman.y);
      if (hitGhost) {
        setStatus("lose");
        return true;
      }

      if (dots.size === 0) {
        setStatus("win");
        return true;
      }

      return false;
    }

    function render() {
      drawMaze();
      drawDots();
      drawPacman();
      ghosts.forEach(drawGhost);
    }

    function gameLoop(timestamp: number) {
      if (timestamp - lastMoveTime > moveDelay) {
        lastMoveTime = timestamp;

        movePacman();
        moveGhosts();

        if (checkCollisions()) {
          render();
          return;
        }
      }

      render();
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") nextDirection = "up";
      if (e.key === "ArrowDown") nextDirection = "down";
      if (e.key === "ArrowLeft") nextDirection = "left";
      if (e.key === "ArrowRight") nextDirection = "right";
    }

    window.addEventListener("keydown", handleKey);
    render();
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  function sendDirection(key: string) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-4">
      {status === "playing" ? (
        <>
          <div className="border-4 border-blue-600 p-2 rounded-xl bg-black shadow-[0_0_25px_rgba(37,99,235,0.25)]">
            <canvas
              ref={canvasRef}
              width={COLS * CELL}
              height={ROWS * CELL}
              className="max-w-full h-auto"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 md:hidden">
            <div></div>
            <button
              onClick={() => sendDirection("ArrowUp")}
              className="bg-white text-black px-4 py-2 rounded"
            >
              ↑
            </button>
            <div></div>

            <button
              onClick={() => sendDirection("ArrowLeft")}
              className="bg-white text-black px-4 py-2 rounded"
            >
              ←
            </button>
            <div></div>

            <button
              onClick={() => sendDirection("ArrowRight")}
              className="bg-white text-black px-4 py-2 rounded"
            >
              →
            </button>

            <div></div>
            <button
              onClick={() => sendDirection("ArrowDown")}
              className="bg-white text-black px-4 py-2 rounded"
            >
              ↓
            </button>
            <div></div>
          </div>
        </>
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome to LAMP Event</h1>
          <p className="mt-4 text-xl">IHC Bring Your Kid To Work Day</p>
        </div>
      )}
    </div>
  );
}