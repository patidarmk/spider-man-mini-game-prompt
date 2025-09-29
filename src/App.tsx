import * as React from 'react'
import { 
  createRouter, 
  RouterProvider, 
  createRootRoute, 
  createRoute as createTanStackRoute, 
  Outlet 
} from '@tanstack/react-router'
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import Game from "./pages/Game";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Create root route
const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Outlet />
      </TooltipProvider>
    </QueryClientProvider>
  ),
})

// Create layout route
const layoutRoute = createTanStackRoute({
  getParentRoute: () => rootRoute,
  component: Layout,
  id: 'layout'
})

// Create index route
const indexRoute = createTanStackRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Index,
  id: 'index'
})

// Create game route
const gameRoute = createTanStackRoute({
  getParentRoute: () => layoutRoute,
  path: '/game',
  component: Game,
  id: 'game'
})

// Create not found route
const notFoundRoute = createTanStackRoute({
  getParentRoute: () => layoutRoute,
  path: '*',
  component: NotFound,
  id: 'not-found'
})

// Create route tree
const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    gameRoute,
    notFoundRoute,
  ])
])

// Create router
const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent' as const,
  defaultPreloadStaleTime: 0,
})

// Register for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const App = () => <RouterProvider router={router} />

export default App;