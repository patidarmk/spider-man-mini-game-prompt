"use client";
import * as React from "react";
import { Outlet } from "@tanstack/react-router";
import Header from "./Header";
import { MadeWithApplaa } from "./made-with-applaa";

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      <main className="container max-w-screen-2xl mx-auto px-4 py-8 flex-1">
        <Outlet />
      </main>
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <MadeWithApplaa />
      </footer>
    </div>
  );
};

export default Layout;