"use client";
import * as React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw } from "lucide-react";
import { showSuccess } from "@/utils/toast";

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Anchor {
  x: number;
  y: number;
}

interface Obstacle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  type: "drone" | "enemy";
}

interface Building {
  x: number;
  width: number;
  height: number;
}

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const navigate = useNavigate();

  const gameLoopRef = useRef<number>();

  const initGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - rect.top; // Account for header

    let player: Player = { x: 100, y: canvas.height / 2, vx: 0, vy: 0, radius: 15 };
    let webAttached = false;
    let anchor: Anchor = { x: 0, y: 0 };
    let obstacles: Obstacle[] = [];
    let buildings: Building[] = [];
    let gameSpeed = 2;
    let spawnRate = 0.02;
    let distance = 0;
    let startTime = Date.now();
    let touching = false;

    // Generate initial buildings
    for (let i = 0; i < 10; i++) {
      buildings.push({
        x: i * 250,
        width: 80 + Math.random() * 40,
        height: 120 + Math.random() * 80,
      });
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - rect.top;
    };

    window.addEventListener("resize", resize);
    resize();

    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      touching = true;
      if (!webAttached && gameState === "playing") {
        // Shoot web to nearest building top ahead
        const futureX = player.x + 200;
        let nearestBuilding: Building | null = null;
        let minDist = Infinity;
        buildings.forEach((b) => {
          if (b.x > player.x && b.x < futureX + 100) {
            const dist = Math.abs(b.x - futureX);
            if (dist < minDist) {
              minDist = dist;
              nearestBuilding = b;
            }
          }
        });
        if (nearestBuilding !== null) {
          const building = nearestBuilding as Building;
          anchor.x = building.x + building.width / 2;
          anchor.y = canvas.height - building.height;
          webAttached = true;
        } else {
          // Fallback anchor
          anchor.x = player.x + 250;
          anchor.y = 150 + Math.random() * 100;
          webAttached = true;
        }
      }
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      touching = false;
      if (webAttached && gameState === "playing") {
        webAttached = false;
        // Boost velocity in direction of release
        const dx = player.x - anchor.x;
        const dy = player.y - anchor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          player.vx += (dx / dist) * 5;
          player.vy += (dy / dist) * 5;
        }
      }
    };

    canvas.style.touchAction = "none";
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchend", handleEnd, { passive: false });
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mouseup", handleEnd);

    const update = () => {
      if (gameState !== "playing") return;

      // Physics
      player.vy += 0.8; // Gravity
      if (webAttached) {
        const dx = anchor.x - player.x;
        const dy = anchor.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 10) { // Slack
          const tension = 0.015 * (dist - 10);
          player.vx += (dx / dist) * tension;
          player.vy += (dy / dist) * tension;
        }
      }
      player.x += player.vx;
      player.y += player.vy;
      player.vx *= 0.99; // Air resistance
      player.vy *= 0.99;

      // Boundaries
      if (player.y > canvas.height - player.radius) {
        player.y = canvas.height - player.radius;
        player.vy = 0;
        setGameState("gameover");
      }
      if (player.x < 0) player.x = 0;

      // Scroll buildings and distance
      buildings.forEach((b) => (b.x -= gameSpeed));
      buildings = buildings.filter((b) => b.x > -b.width);
      while (buildings.length < 10) {
        const last = buildings[buildings.length - 1];
        buildings.push({
          x: last.x + 200 + Math.random() * 100,
          width: 80 + Math.random() * 40,
          height: 120 + Math.random() * 80,
        });
      }
      distance += gameSpeed;
      setScore(Math.floor(distance));

      // Increasing difficulty
      gameSpeed += 0.005;
      spawnRate += 0.0001;
      if (spawnRate > 0.05) spawnRate = 0.05;

      // Spawn obstacles
      if (Math.random() < spawnRate) {
        const type = Math.random() < 0.6 ? "drone" : "enemy";
        const y = Math.random() * (canvas.height - 200) + 100;
        obstacles.push({
          x: canvas.width + 50,
          y,
          vx: -(gameSpeed + Math.random() * 2),
          vy: type === "drone" ? 3 + Math.random() * 2 : 0,
          width: 25,
          height: 25,
          type,
        });
      }

      // Update obstacles
      obstacles.forEach((obs) => {
        obs.x += obs.vx;
        obs.y += obs.vy;
        if (obs.type === "enemy") {
          obs.y += Math.sin(obs.x * 0.01) * 2; // Wavy flight
        }
      });
      obstacles = obstacles.filter((obs) => obs.x > -obs.width && obs.y < canvas.height);

      // Collision
      obstacles.forEach((obs) => {
        const dx = player.x - (obs.x + obs.width / 2);
        const dy = player.y - (obs.y + obs.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < player.radius + 15) {
          setGameState("gameover");
        }
      });

      if (highScore < Math.floor(distance)) setHighScore(Math.floor(distance));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#87CEEB");
      gradient.addColorStop(1, "#E0F6FF");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw buildings (cartoon style)
      buildings.forEach((b) => {
        ctx.fillStyle = "#8B4513"; // Brown
        ctx.fillRect(b.x, canvas.height - b.height, b.width, b.height);
        ctx.fillStyle = "#654321"; // Windows
        for (let w = 0; w < 3; w++) {
          ctx.fillRect(b.x + 10 + w * 20, canvas.height - b.height + 20, 10, 10);
          ctx.fillRect(b.x + 10 + w * 20, canvas.height - b.height + 50, 10, 10);
        }
      });

      // Draw web (white line)
      if (webAttached) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(anchor.x, anchor.y);
        ctx.stroke();
      }

      // Draw player (red circle with mask eyes)
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.fillRect(player.x - 5, player.y - 5, 4, 4); // Left eye
      ctx.fillRect(player.x + 1, player.y - 5, 4, 4); // Right eye

      // Draw obstacles
      obstacles.forEach((obs) => {
        ctx.fillStyle = obs.type === "drone" ? "darkred" : "black";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Simple cartoon details
        if (obs.type === "drone") {
          ctx.fillStyle = "gray";
          ctx.fillRect(obs.x + 5, obs.y - 5, 15, 5); // Propellers
        } else {
          ctx.fillStyle = "yellow";
          ctx.fillRect(obs.x + 8, obs.y + 8, 9, 9); // Eye
        }
      });

      // Score
      ctx.fillStyle = "black";
      ctx.font = "bold 24px Arial";
      ctx.fillText(`Score: ${Math.floor(distance)}`, 20, 40);
      ctx.font = "16px Arial";
      ctx.fillText(`High: ${highScore}`, 20, 65);
      ctx.fillText(`Speed: ${gameSpeed.toFixed(1)}`, 20, 85);

      if (gameState === "menu") {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Web Swing Hero", canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = "24px Arial";
        ctx.fillText("Tap to swing! Avoid obstacles.", canvas.width / 2, canvas.height / 2);
        ctx.fillText("Tap anywhere to start", canvas.width / 2, canvas.height / 2 + 50);
      } else if (gameState === "gameover") {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 100);
        ctx.font = "24px Arial";
        ctx.fillText(`Final Score: ${Math.floor(distance)}`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.textAlign = "left";
      }
    };

    const loop = () => {
      update();
      draw();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    const startGame = () => {
      player = { x: 100, y: canvas.height / 2, vx: 0, vy: 0, radius: 15 };
      webAttached = false;
      obstacles = [];
      distance = 0;
      gameSpeed = 2;
      spawnRate = 0.02;
      setScore(0);
      setGameState("playing");
      startTime = Date.now();
      loop();
    };

    const restart = () => {
      cancelAnimationFrame(gameLoopRef.current!);
      startGame();
    };

    if (gameState === "menu") {
      draw();
      canvas.onclick = startGame;
      canvas.ontouchstart = (e) => {
        e.preventDefault();
        startGame();
      };
    }

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchend", handleEnd);
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mouseup", handleEnd);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      canvas.onclick = null;
      canvas.ontouchstart = null;
    };
  }, [gameState, highScore]);

  useEffect(() => {
    if (gameState === "playing" || gameState === "menu") {
      return initGame();
    }
  }, [initGame, gameState]);

  const handleRestart = () => {
    setGameState("menu");
  };

  const handleHome = () => {
    navigate({ to: "/" });
    showSuccess("Back to home—great swinging!");
  };

  if (gameState === "gameover") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6 bg-white/90 backdrop-blur-xl p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold text-gray-800">Game Over!</h2>
          <p className="text-xl text-gray-600">Final Score: {score}</p>
          <p className="text-lg text-gray-500">High Score: {highScore}</p>
          <div className="space-y-3">
            <Button onClick={handleRestart} className="w-full bg-red-500 hover:bg-red-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Restart Game
            </Button>
            <Button onClick={handleHome} variant="outline" className="w-full">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none", background: "#87CEEB" }}
      />
    </div>
  );
};

export default Game;