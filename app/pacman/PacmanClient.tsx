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
  const hasStartedSound = useRef(false);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const wakaSoundRef = useRef<HTMLAudioElement | null>(null);
  const winSoundRef = useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = useRef<HTMLAudioElement | null>(null);
  const [hideText, setHideText] = useState(false);
  const wakaPoolRef = useRef<HTMLAudioElement[]>([]);
  const wakaIndexRef = useRef(0);
  const lastWakaTimeRef = useRef(0);


  function playStartSoundOnce() {
    if (hasStartedSound.current) return;
  
    hasStartedSound.current = true;
  
    if (startSoundRef.current) {
      startSoundRef.current.currentTime = 0;
      startSoundRef.current.volume = 0.8;
      startSoundRef.current.play().catch(() => {});
    }
  
    if (wakaSoundRef.current) {
      wakaSoundRef.current.volume = 0;
      wakaSoundRef.current.play().then(() => {
        if (wakaSoundRef.current) {
          wakaSoundRef.current.pause();
          wakaSoundRef.current.currentTime = 0;
          wakaSoundRef.current.volume = 0.5;
        }
      }).catch(() => {});
    }
    
  }
  
  useEffect(() => {
    if (wakaPoolRef.current.length === 0) {
      wakaPoolRef.current = Array.from({ length: 4 }, () => {
        const audio = new Audio("/pacman-waka.mp3");
        audio.preload = "auto";
        audio.volume = 0.5;
        return audio;
      });
    }

    if (!startSoundRef.current) {
      startSoundRef.current = new Audio("/pacman-start.mp3");
      startSoundRef.current.preload = "auto";
    }
    
    if (!wakaSoundRef.current) {
      wakaSoundRef.current = new Audio("/pacman-waka.mp3");
      wakaSoundRef.current.preload = "auto";
      wakaSoundRef.current.volume = 0.5;
    }
    
    if (!winSoundRef.current) {
      winSoundRef.current = new Audio("/pacman-win.mp3");
      winSoundRef.current.preload = "auto";
      winSoundRef.current.volume = 0.8;
    }

    if (!loseSoundRef.current) {
      loseSoundRef.current = new Audio("/pacman-lose.mp3");
      loseSoundRef.current.preload = "auto";
      loseSoundRef.current.volume = 0.8;
    }
    
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
      ctx.fillRect(0, 0, canvas!.width, canvas!.height);

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
      if (
        nextDirection !== "none" &&
        canMove(pacman.x, pacman.y, nextDirection)
      ) {
        direction = nextDirection;
      }
    
      if (canMove(pacman.x, pacman.y, direction)) {
        const next = getNextPosition(pacman.x, pacman.y, direction);
        pacman = next;
      }
    
      const key = `${pacman.x},${pacman.y}`;
    
      if (dots.has(key)) {
        dots.delete(key);
      
        const now = Date.now();
      
        if (
          hasStartedSound.current &&
          wakaPoolRef.current.length > 0 &&
          now - lastWakaTimeRef.current > 250
        ) {
          const waka = wakaPoolRef.current[wakaIndexRef.current];
          waka.currentTime = 0;
          waka.play().catch(() => {});
      
          wakaIndexRef.current =
            (wakaIndexRef.current + 1) % wakaPoolRef.current.length;
      
          lastWakaTimeRef.current = now;
        }
      }
    }

    let ghostMoveCounter = 0;
    const ghostSpeed = 4;

    function moveGhosts() {
      ghostMoveCounter++;

      if (ghostMoveCounter % ghostSpeed !== 0) return;

      ghosts = ghosts.map((ghost) => {
        const ghostDirections: Direction[] = ["left", "right", "up", "down"];

        const possibleDirections = ghostDirections.filter((dir) =>
          canMove(ghost.x, ghost.y, dir)
        );

        if (possibleDirections.length === 0) return ghost;

        const bestDirection = possibleDirections.sort((a, b) => {
          const nextA = getNextPosition(ghost.x, ghost.y, a);
          const nextB = getNextPosition(ghost.x, ghost.y, b);

          const distA =
            Math.abs(nextA.x - pacman.x) + Math.abs(nextA.y - pacman.y);
          const distB =
            Math.abs(nextB.x - pacman.x) + Math.abs(nextB.y - pacman.y);

          return distA - distB;
        })[0];

        const next = getNextPosition(ghost.x, ghost.y, bestDirection);
        return { ...ghost, x: next.x, y: next.y };
      });
    }

    function checkCollisions() {
      const hitGhost = ghosts.some(
        (ghost) => ghost.x === pacman.x && ghost.y === pacman.y
      );

      if (hitGhost) {
        // 🔴 stop waka sounds
        wakaPoolRef.current.forEach(a => {
          a.pause();
          a.currentTime = 0;
        });
      
        // 🔴 play lose sound
        if (loseSoundRef.current && hasStartedSound.current) {
          loseSoundRef.current.currentTime = 0;
          loseSoundRef.current.play().catch(() => {});
        }
      
        setStatus("lose");
        return true;
      }

      if (dots.size === 0) {
        // 🔴 STOP all waka sounds first
        wakaPoolRef.current.forEach(a => {
          a.pause();
          a.currentTime = 0;
        });
      
        // 🟢 THEN play win sound
        if (winSoundRef.current && hasStartedSound.current) {
          winSoundRef.current.currentTime = 0;
          winSoundRef.current.play().catch(() => {});
        }
      
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
      playStartSoundOnce();
      setHideText(true);
      if (e.key === "ArrowUp") nextDirection = "up";
      if (e.key === "ArrowDown") nextDirection = "down";
      if (e.key === "ArrowLeft") nextDirection = "left";
      if (e.key === "ArrowRight") nextDirection = "right";
    }

    let touchStartX = 0;
    let touchStartY = 0;

    function handleTouchStart(e: TouchEvent) {
      setHideText(true);
      playStartSoundOnce();
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }

    function handleTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) nextDirection = "right";
        else if (dx < -20) nextDirection = "left";
      } else {
        if (dy > 20) nextDirection = "down";
        else if (dy < -20) nextDirection = "up";
      }
    }

    window.addEventListener("keydown", handleKey);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);

    render();
    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(animationFrameId);
    };

  }, [status]); //[status, gameStarted]);

  function sendDirection(key: string) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }

  return (
    <div className="fixed inset-0 overflow-hidden touch-none bg-black text-white flex flex-col items-center justify-start gap-4 p-4 pt-10">
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
          {/*!hideText && (
  <p
    onClick={() => {
      setHideText(true);
      playStartSoundOnce();
    }}
    className="mt-4 text-sm text-gray-400 cursor-pointer"
  >
    Click here to start
  </p>
)*/}
        </>
      ) : (
            <div className="flex items-center justify-center w-full h-full">
              <div className="
                relative
                w-full 
                max-w-[90vw] 
                max-h-[85vh] 
                aspect-[3/4]
                border-4 border-blue-500 
                rounded-2xl 
                shadow-[0_0_30px_rgba(59,130,246,0.9)]
                animate-pulse
                overflow-hidden
                bg-black
              ">
                <img
                  src="/invitation.png"
                  alt="Invitation"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
      )}
    </div>
  );
}