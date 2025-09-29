"use client";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">WS</span>
          </div>
          <span className="font-bold bg-gradient-to-r from-red-500 via-purple-600 to-blue-600 bg-clip-text text-transparent text-lg">
            Web Swing Hero
          </span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            to="/"
            className={cn(
              "transition-colors text-foreground/80 hover:text-foreground/100 font-medium",
              "text-sm"
            )}
          >
            Home
          </Link>
          <Link
            to="/game"
            className={cn(
              "transition-colors text-foreground/80 hover:text-foreground/100 font-medium",
              "text-sm"
            )}
          >
            Play Game
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;