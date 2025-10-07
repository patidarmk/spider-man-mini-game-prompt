"use client";
import * as React from "react";
import { useRef, useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
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
  type: "drone" | "enemy" | "sign";
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
  const [restartTimer, setRestartTimer] = useState(0);
  const navigate = useNavigate();

  const gameLoopRef = useRef<number>();

  // Mutable game state variables held in refs
  const playerRef = useRef<Player>({ x: 0, y: 0, vx: 0, vy: 0, radius: 15 });
  const webAttachedRef = useRef(false);
  const anchorRef = useRef<Anchor>({ x: 0, y: 0 });
  const obstaclesRef = useRef<Obstacle[]>([]);
  const buildingsRef = useRef<Building[]>([]);
  const skylineBuildingsRef = useRef<Building[]>([]);
  const gameSpeedRef = useRef(2);
  const spawnRateRef = useRef(0.02);
  const distanceRef = useRef(0);
  const touchingRef = useRef(false);

  // Function to initialize/reset game variables
  const resetGameVariables = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    playerRef.current = { x: 100, y: canvas.height / 2, vx: 0, vy: 0, radius: 15 };
    webAttachedRef.current = false;
    anchorRef.current = { x: 0, y: 0 };
    obstaclesRef.current = [];
    buildingsRef.current = [];
    skylineBuildingsRef.current = [];
    gameSpeedRef.current = 2;
    spawnRateRef.current = 0.02;
    distanceRef.current = 0;
    touchingRef.current = false;

    // Generate initial foreground buildings
    for (let i = 0; i < 10; i++) {
      buildingsRef.current.push({
        x: i * 250,
        width: 80 + Math.random() * 40,
        height: 120 + Math.random() * 80,
      });
    }

    // Generate skyline background buildings
    for (let i = 0; i < 20; i++) {
      skylineBuildingsRef.current.push({
        x: i * 300,
        width: 60 + Math.random() * 120,
        height: 200 + Math.random() * 300,
      });
    }
  }, []); // No dependencies, as it only uses canvasRef.current and sets refs

  // Start game function
  const startGame = useCallback(() => {
    resetGameVariables();
    setGameState("playing");
    setRestartTimer(0);
  }, [resetGameVariables]);

  // Restart game function
  const restartGame = useCallback(() => {
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    startGame();
  }, [startGame]);

  // Game loop update logic
  const updateGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameState !== "playing") return;

    const player = playerRef.current;
    const webAttached = webAttachedRef.current;
    const anchor = anchorRef.current;
    let obstacles = obstaclesRef.current;
    let buildings = buildingsRef.current;
    let skylineBuildings = skylineBuildingsRef.current;
    let gameSpeed = gameSpeedRef.current;
    let spawnRate = spawnRateRef.current;
    let distance = distanceRef.current;

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
      setGameState("gameover"); // This is a React state update
      setRestartTimer(3); // This is a React state update
    }
    if (player.x < 0) player.x = 0;

    // Scroll foreground buildings and distance
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

    // Scroll skyline buildings (slower for parallax effect)
    skylineBuildings.forEach((b) => (b.x -= gameSpeed * 0.5));
    skylineBuildings = skylineBuildings.filter((b) => b.x > -b.width);
    while (skylineBuildings.length < 20) {
      const last = skylineBuildings[skylineBuildings.length - 1];
      skylineBuildings.push({
        x: last.x + 300 + Math.random() * 200,
        width: 60 + Math.random() * 120,
        height: 200 + Math.random() * 300,
      });
    }

    distance += gameSpeed;
    setScore(Math.floor(distance)); // This is a React state update

    // Increasing difficulty
    gameSpeed += 0.005;
    spawnRate += 0.0001;
    if (spawnRate > 0.05) spawnRate = 0.05;

    // Spawn obstacles (drones, enemies, signs)
    if (Math.random() < spawnRate) {
      const rand = Math.random();
      let type: Obstacle["type"];
      let y: number;
      if (rand < 0.4) {
        type = "drone";
        y = Math.random() * (canvas.height - 200) + 100; // Corrected line
      } else if (rand < 0.7) {
        type = "enemy";
        y = Math.random() * (canvas.height - 200) + 100;
      } else {
        type = "sign";
        y = canvas.height - 150 + Math.sin(Date.now() * 0.001) * 20;
      }
      obstacles.push({
        x: canvas.width + 50,
        y,
        vx: -(gameSpeed + Math.random() * 2),
        vy: type === "drone" ? Math.sin(Date.now() * 0.001) * 1 : (type === "sign" ? Math.sin(Date.now() * 0.002) * 0.5 : 0),
        width: type === "sign" ? 60 : 25,
        height: type === "sign" ? 20 : 25,
        type,
      });
    }

    // Update obstacles
    obstacles.forEach((obs) => {
      obs.x += obs.vx;
      obs.y += obs.vy;
      if (obs.type === "enemy") {
        obs.y += Math.sin(obs.x * 0.01) * 2; // Wavy flight
      } else if (obs.type === "sign") {
        obs.y += Math.sin((Date.now() + obs.x) * 0.001) * 0.5; // Gentle bob
      }
    });
    obstacles = obstacles.filter((obs) => obs.x > -obs.width && obs.y < canvas.height && obs.y > 0);

    // Collision
    obstacles.forEach((obs) => {
      const dx = player.x - (obs.x + obs.width / 2);
      const dy = player.y - (obs.y + obs.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < player.radius + (obs.type === "sign" ? 20 : 15)) {
        setGameState("gameover"); // This is a React state update
        setRestartTimer(3); // This is a React state update
      }
    });

    if (highScore < Math.floor(distance)) setHighScore(Math.floor(distance)); // This is a React state update

    // Update refs with new values
    obstaclesRef.current = obstacles;
    buildingsRef.current = buildings;
    skylineBuildingsRef.current = skylineBuildings;
    gameSpeedRef.current = gameSpeed;
    spawnRateRef.current = spawnRate;
    distanceRef.current = distance;
  }, [gameState, highScore]); // Dependencies for updateGame

  // Game loop draw logic
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const player = playerRef.current;
    const webAttached = webAttachedRef.current;
    const anchor = anchorRef.current;
    const obstacles = obstaclesRef.current;
    const buildings = buildingsRef.current;
    const skylineBuildings = skylineBuildingsRef.current;
    const distance = distanceRef.current;
    const gameSpeed = gameSpeedRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // City skyline background (distant buildings in gray/blue tones)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, "#87CEEB");
    skyGradient.addColorStop(0.7, "#B0E0E6");
    skyGradient.addColorStop(1, "#E0F6FF");
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw skyline buildings (faded, static heights)
    ctx.fillStyle = "rgba(100, 100, 100, 0.3)"; // Semi-transparent gray for depth
    skylineBuildings.forEach((b) => {
      ctx.fillRect(b.x, canvas.height - b.height, b.width, b.height);
      // Simple windows on skyline
      ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
      for (let w = 0; w < 4; w++) {
        ctx.fillRect(b.x + 10 + w * 15, canvas.height - b.height + 30, 8, 8);
      }
      ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
    });

    // Draw foreground buildings (cartoon style, brown with windows)
    buildings.forEach((b) => {
      ctx.fillStyle = "#8B4513"; // Brown
      ctx.fillRect(b.x, canvas.height - b.height, b.width, b.height);
      ctx.fillStyle = "#FFFFE0"; // Yellow windows
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

    // Draw player (red circle with mask eyes, superhero style)
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.fillRect(player.x - 5, player.y - 5, 4, 4); // Left eye
    ctx.fillRect(player.x + 1, player.y - 5, 4, 4); // Right eye
    // Cape effect (simple triangle)
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + player.radius);
    ctx.lineTo(player.x - 10, player.y + player.radius + 15);
    ctx.lineTo(player.x + 10, player.y + player.radius + 15);
    ctx.fill();

    // Draw obstacles
    obstacles.forEach((obs) => {
      if (obs.type === "drone") {
        ctx.fillStyle = "darkred";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = "gray";
        ctx.fillRect(obs.x + 5, obs.y - 5, 15, 5); // Propellers
      } else if (obs.type === "enemy") {
        ctx.fillStyle = "black";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = "yellow";
        ctx.fillRect(obs.x + 8, obs.y + 8, 9, 9); // Eye
      } else if (obs.type === "sign") {
        ctx.fillStyle = "orange";
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("DANGER", obs.x + obs.width / 2, obs.y + obs.height / 2 + 4);
      }
    });

    // Score
    ctx.fillStyle = "black";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
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
      ctx.fillText("Click to shoot web, release to swing!", canvas.width / 2, canvas.height / 2);
      ctx.fillText("Avoid drones, enemies, and signs", canvas.width / 2, canvas.height / 2 + 30);
      ctx.fillText("Click anywhere to start", canvas.width / 2, canvas.height / 2 + 80);
    } else if (gameState === "gameover") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 50);
      ctx.font = "24px Arial";
      ctx.fillText(`Final Score: ${Math.floor(distance)}`, canvas.width / 2, canvas.height / 2);
      ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 30);
      if (restartTimer > 0) {
        ctx.fillText(`Restarting in ${restartTimer}s...`, canvas.width / 2, canvas.height / 2 + 80);
      }
      ctx.textAlign = "left";
    }
  }, [gameState, highScore, score, restartTimer]); // Dependencies for drawGame

  // Main game loop effect
  useEffect(() => {
    const loop = () => {
      updateGame();
      drawGame();
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(loop);
    } else if (gameState === "menu") {
      drawGame(); // Draw menu screen
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, updateGame, drawGame]);

  // Effect for canvas event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - rect.top;
      if (gameState === "menu" || gameState === "gameover") {
        drawGame(); // Redraw menu/gameover screen on resize
      }
    };

    const handleStart = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      touchingRef.current = true;
      if (!webAttachedRef.current && gameState === "playing") {
        const player = playerRef.current;
        const buildings = buildingsRef.current;
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
          anchorRef.current.x = building.x + building.width / 2;
          anchorRef.current.y = canvas.height - building.height;
          webAttachedRef.current = true;
        } else {
          // Fallback anchor
          anchorRef.current.x = player.x + 250;
          anchorRef.current.y = 150 + Math.random() * 100;
          webAttachedRef.current = true;
        }
      } else if (gameState === "menu") {
        startGame();
      }
    };

    const handleEnd = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      touchingRef.current = false;
      if (webAttachedRef.current && gameState === "playing") {
        webAttachedRef.current = false;
        const player = playerRef.current;
        const anchor = anchorRef.current;
        const dx = player.x - anchor.x;
        const dy = player.y - anchor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          player.vx += (dx / dist) * 5;
          player.vy += (dy / dist) * 5;
        }
      }
    };

    window.addEventListener("resize", resize);
    canvas.style.touchAction = "none";
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchend", handleEnd, { passive: false });
    canvas.addEventListener("mousedown", handleStart);
    canvas.addEventListener("mouseup", handleEnd);

    // Initial resize and draw for menu
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchend", handleEnd);
      canvas.removeEventListener("mousedown", handleStart);
      canvas.removeEventListener("mouseup", handleEnd);
    };
  }, [gameState, startGame, drawGame]); // Dependencies for event listeners

  // Auto-restart timer logic
  useEffect(() => {
    if (gameState === "gameover" && restartTimer > 0) {
      const interval = setInterval(() => {
        setRestartTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            restartGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState, restartTimer, restartGame]);

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
          <p className="text-sm text-gray-400">Restarting automatically in {restartTimer}s...</p>
          <Button onClick={handleHome} variant="outline" className="w-full">
            Back to Home
          </Button>
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