"use client";

import { useEffect, useRef, useState } from "react";

export default function PacmanPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<"playing" | "win" | "lose">("playing");

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let pacman = { x: 50, y: 50, size: 20 };
    let food = { x: 200, y: 150, size: 10 };
    let enemy = { x: 300, y: 100, size: 20 };

    let dx = 2;
    let dy = 0;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pacman
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(pacman.x, pacman.y, pacman.size, 0.2, Math.PI * 2 - 0.2);
      ctx.lineTo(pacman.x, pacman.y);
      ctx.fill();

      // Food
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(food.x, food.y, food.size, 0, Math.PI * 2);
      ctx.fill();

      // Enemy
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
      ctx.fill();

      // Move pacman
      pacman.x += dx;
      pacman.y += dy;

      // Win condition
      if (
        Math.hypot(pacman.x - food.x, pacman.y - food.y) <
        pacman.size
      ) {
        setStatus("win");
        return;
      }

      // Lose condition
      if (
        Math.hypot(pacman.x - enemy.x, pacman.y - enemy.y) <
        pacman.size
      ) {
        setStatus("lose");
        return;
      }

      if (status === "playing") {
        requestAnimationFrame(draw);
      }
    }

    if (status === "playing") {
      draw();
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

    return () => window.removeEventListener("keydown", handleKey);
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      {status === "playing" && (
        <canvas ref={canvasRef} width={500} height={300} />
      )}

      {status !== "playing" && (
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            Welcome to LAMP Event
          </h1>
          <p className="mt-4 text-xl">
            {status === "win" ? "You Win 🎉" : "You Lose 😢"}
          </p>
        </div>
      )}
    </div>
  );
}