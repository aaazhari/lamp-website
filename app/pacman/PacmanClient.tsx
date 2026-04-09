"use client";
import { useEffect, useRef, useState } from "react";

//const CELL = 24;
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
  const [cell, setCell] = useState(24);
  const [boardWidth, setBoardWidth] = useState(COLS * 24);
  const [boardHeight, setBoardHeight] = useState(ROWS * 24);
  const gameStartTimeRef = useRef<number | null>(null);
  const gameEndedRef = useRef(false);
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

  function trackEvent(eventName: string, data: Record<string, unknown> = {}) {
    if (typeof window === "undefined") return;
  
    const win = window as Window & {
      dataLayer?: Array<Record<string, unknown>>;
    };
  
    win.dataLayer = win.dataLayer || [];
  
    win.dataLayer.push({
      event: eventName,
      ...data,
    });
  }

  function playStartSoundOnce() {
    gameEndedRef.current = false;
    if (hasStartedSound.current) return;
    trackEvent("first_interaction");
    trackEvent("game_start");
    gameStartTimeRef.current = Date.now();
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

    if (loseSoundRef.current) {
      loseSoundRef.current.volume = 0;
      loseSoundRef.current.play().then(() => {
        if (loseSoundRef.current) {
          loseSoundRef.current.pause();
          loseSoundRef.current.currentTime = 0;
          loseSoundRef.current.volume = 0.8;
        }
      }).catch(() => {});
    }
    
  }
  

useEffect(() => {
  function updateBoardSize() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const horizontalPadding = 8;
    const verticalPadding = 40;

    const maxCellByWidth = Math.floor((viewportWidth - horizontalPadding) / COLS);
    const maxCellByHeight = Math.floor((viewportHeight - verticalPadding) / ROWS);

    const isPhone = window.innerWidth < 768;
    const nextCell = isPhone
    ? Math.max(18, Math.min(maxCellByWidth, 42))
    : Math.max(18, Math.min(maxCellByWidth, maxCellByHeight, 34));

    setCell(nextCell);
    const exactWidth = nextCell * COLS;
    const exactHeight = nextCell * ROWS;
    
    setBoardWidth(exactWidth);
    setBoardHeight(exactHeight);
  }

  updateBoardSize();
  window.addEventListener("resize", updateBoardSize);

  return () => window.removeEventListener("resize", updateBoardSize);
}, []);


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
            ctx.strokeRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
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
          x * cell + cell / 2,
          y * cell + cell / 2,
          char === "o" ? Math.max(4, cell * 0.2) : Math.max(2, cell * 0.1),
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
      const px = pacman.x * cell + cell / 2;
      const py = pacman.y * cell + cell / 2;
      const angle = getPacmanAngle();

      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.arc(
        px,
        py,
        cell / 2 - 3,
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
      const gx = ghost.x * cell + cell / 2;
      const gy = ghost.y * cell + cell / 2;

      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      const ghostRadius = Math.max(7, cell * 0.33);
      ctx.arc(gx, gy - 2, ghostRadius, Math.PI, 0);
      ctx.lineTo(gx + ghostRadius, gy + ghostRadius);
      ctx.lineTo(gx + ghostRadius / 2, gy + ghostRadius / 2);
      ctx.lineTo(gx, gy + ghostRadius);
      ctx.lineTo(gx - ghostRadius / 2, gy + ghostRadius / 2);
      ctx.lineTo(gx - ghostRadius, gy + ghostRadius);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      const eyeOffset = Math.max(3, cell * 0.12);
      const eyeRadius = Math.max(2, cell * 0.08);
      
      ctx.arc(gx - eyeOffset, gy - 2, eyeRadius, 0, Math.PI * 2);
      ctx.arc(gx + eyeOffset, gy - 2, eyeRadius, 0, Math.PI * 2);
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
    
      const nextGhosts: Ghost[] = [];
    
      ghosts.forEach((ghost, index) => {
        const ghostDirections: Direction[] = ["left", "right", "up", "down"];
    
        const possibleDirections = ghostDirections.filter((dir) => {
          if (!canMove(ghost.x, ghost.y, dir)) return false;
    
          const next = getNextPosition(ghost.x, ghost.y, dir);
    
          const occupiedByCurrentGhosts = ghosts.some(
            (otherGhost, otherIndex) =>
              otherIndex !== index &&
              otherGhost.x === next.x &&
              otherGhost.y === next.y
          );
    
          const occupiedByNextGhosts = nextGhosts.some(
            (nextGhost) => nextGhost.x === next.x && nextGhost.y === next.y
          );
    
          return !occupiedByCurrentGhosts && !occupiedByNextGhosts;
        });
    
        if (possibleDirections.length === 0) {
          nextGhosts.push(ghost);
          return;
        }
    
        const bestDirection = possibleDirections.sort((a, b) => {
          const nextA = getNextPosition(ghost.x, ghost.y, a);
          const nextB = getNextPosition(ghost.x, ghost.y, b);
    
          let distA = 0;
          let distB = 0;
    
          // Ghost 1 = chaser
          if (index === 0) {
            distA = Math.abs(nextA.x - pacman.x) + Math.abs(nextA.y - pacman.y);
            distB = Math.abs(nextB.x - pacman.x) + Math.abs(nextB.y - pacman.y);
            return distA - distB;
          }
    
          // Ghost 2 = ambusher / less direct
          const targetX = pacman.x + (direction === "right" ? 2 : direction === "left" ? -2 : 0);
          const targetY = pacman.y + (direction === "down" ? 2 : direction === "up" ? -2 : 0);
    
          distA = Math.abs(nextA.x - targetX) + Math.abs(nextA.y - targetY);
          distB = Math.abs(nextB.x - targetX) + Math.abs(nextB.y - targetY);
          return distA - distB;
        })[0];
    
        const next = getNextPosition(ghost.x, ghost.y, bestDirection);
        nextGhosts.push({ ...ghost, x: next.x, y: next.y });
      });
    
      ghosts = nextGhosts;
    }

    function checkCollisions() {
      const hitGhost = ghosts.some(
        (ghost) => ghost.x === pacman.x && ghost.y === pacman.y
      );

      if (hitGhost) {
        if (gameEndedRef.current) return true;
        gameEndedRef.current = true;

        trackEvent("game_lose");

        if (gameStartTimeRef.current) {
          const seconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        
          trackEvent("time_spent", { seconds });
        }
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
        if (gameEndedRef.current) return true;
        gameEndedRef.current = true;

        trackEvent("game_win");

        if (gameStartTimeRef.current) {
          const seconds = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
        
          trackEvent("time_spent", { seconds });
        }
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

  }, [status, cell]);

  function sendDirection(key: string) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }

  return (
    <div className="fixed inset-0 overflow-hidden touch-none bg-black text-white flex flex-col items-center justify-center gap-2 px-1 py-0 md:gap-4 md:p-4">
      {status === "playing" ? (
        <>
        <div
          className="border-4 border-blue-600 p-2 rounded-xl bg-black shadow-[0_0_25px_rgba(37,99,235,0.25)] origin-center md:scale-100"
          style={{
            width: boardWidth + 16,
            transform: typeof window !== "undefined" && window.innerWidth < 768 ? "scaleY(1.18)" : "scale(1)",
          }}
        >
            <canvas
            ref={canvasRef}
            width={boardWidth}
            height={boardHeight}
            className="block"
            style={{
              width: boardWidth,
              height:
                typeof window !== "undefined" && window.innerWidth < 768
                  ? boardHeight * 1.35
                  : boardHeight,
            }}
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