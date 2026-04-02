"use client";

import { useEffect, useRef, useState } from "react";

export default function PacmanPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"playing" | "win" | "lose">("playing");

  useEffect(() => {
    if (status !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    let pacman = { x: 50, y: 50, size: 20 };
    let food = { x: 200, y: 150, size: 10 };
    let enemy = { x: 300, y: 100, size: 20 };

    let dx = 2;
    let dy = 0;

    function draw() {
        if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(pacman.x, pacman.y, pacman.size, 0.2, Math.PI * 2 - 0.2);
      ctx.lineTo(pacman.x, pacman.y);
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();

      pacman.x += dx;
      pacman.y += dy;

      if (Math.hypot(pacman.x - food.x, pacman.y - food.y) < pacman.size) {
        setStatus("win");
        return;
      }

      if (Math.hypot(pacman.x - enemy.x, pacman.y - enemy.y) < pacman.size) {
        setStatus("lose");
        return;
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        dx = 2;
        dy = 0;
      }
      if (e.key === "ArrowLeft") {
        dx = -2;
        dy = 0;
      }
      if (e.key === "ArrowUp") {
        dx = 0;
        dy = -2;
      }
      if (e.key === "ArrowDown") {
        dx = 0;
        dy = 2;
      }
    }

    window.addEventListener("keydown", handleKey);
    draw();

    return () => {
      window.removeEventListener("keydown", handleKey);
      cancelAnimationFrame(animationFrameId);
    };
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white gap-4">
      {status === "playing" && (
        <>
          <canvas ref={canvasRef} width={500} height={300} />
  
          {/* Mobile Controls */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div></div>
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp" }));
              }}
              className="bg-white text-black px-4 py-2 rounded"
            >
              ↑
            </button>
            <div></div>
  
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
              }}
              className="bg-white text-black px-4 py-2 rounded"
            >
              ←
            </button>
  
            <div></div>
  
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
              }}
              className="bg-white text-black px-4 py-2 rounded"
            >
              →
            </button>
  
            <div></div>
            <button
              onClick={() => {
                window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
              }}
              className="bg-white text-black px-4 py-2 rounded"
            >
              ↓
            </button>
            <div></div>
          </div>
        </>
      )}
  
      {status !== "playing" && (
        <div className="text-center">
          <h1 className="text-4xl font-bold">Welcome to LAMP Event</h1>
          <p className="mt-4 text-xl">
            {status === "win" ? "You Win 🎉" : "You Lose 😢"}
          </p>
        </div>
      )}
    </div>
  );
}