"use client";

import { useState, useEffect } from "react";
import { EmulatorPlayer } from "@/components/emulator/EmulatorPlayer";
import { ErrorBoundary } from "@/components/providers/error-boundary";
import { useQuery } from "@tanstack/react-query";

interface GameDetail {
  slug: string;
  title: string;
  system: string;
  romUrl: string;
}

import { useGameStore } from "@/lib/store/useGameStore";

export default function PlayScreen({ params }: { params: { gameSlug: string } }) {
  const [mounted, setMounted] = useState(false);
  const gameMode = useGameStore((state) => state.gameMode);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: game, isLoading, error } = useQuery({
    queryKey: ["game", params.gameSlug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/games/${params.gameSlug}`);
      if (!res.ok) throw new Error("Game not found");
      return res.json() as Promise<GameDetail>;
    },
    enabled: mounted,
  });

  if (!mounted || isLoading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-rose-600 border-rose-600/20 animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center text-white p-8">
        <h2 className="text-2xl font-black tracking-widest uppercase mb-4 text-rose-500">Error</h2>
        <p className="text-white/60 mb-8 max-w-lg text-center leading-relaxed">
          {error?.message || "Game Not Found"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ErrorBoundary>
        <EmulatorPlayer 
          system={game.system}
          romUrl={game.romUrl}
          localPlayers={gameMode === 2 ? 2 : 1}
        />
      </ErrorBoundary>
    </div>
  );
}
