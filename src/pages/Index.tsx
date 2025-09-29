"use client";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Activity, Target } from "lucide-react";

const Index = () => {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <Activity className="w-24 h-24 mx-auto text-red-500" />
        <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-blue-600 bg-clip-text text-transparent">
          Web Swing Hero
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Swing through the city as a web-slinging hero! Tap to shoot webs between buildings, avoid drones and flying enemies, and survive as long as possible. Score increases with distance—can you beat your high score?
        </p>
      </div>
      <div className="flex justify-center">
        <Button asChild size="lg" className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700">
          <Link to="/game">
            <Target className="w-5 h-5 mr-2" />
            Start Swinging!
          </Link>
        </Button>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
        <div className="space-y-2 p-4 bg-white/70 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold">How to Play</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Tap/click to shoot a web and attach to a building.</li>
            <li>Release to swing forward with momentum.</li>
            <li>Avoid red drones (falling) and black enemies (flying).</li>
            <li>Swing higher to dodge—gravity pulls you down!</li>
          </ul>
        </div>
        <div className="space-y-2 p-4 bg-white/70 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold">Tips</h3>
          <p className="text-sm text-gray-600">
            Time your swings to build speed. Difficulty increases with faster obstacles and more spawns. Aim for 1000+ score!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;