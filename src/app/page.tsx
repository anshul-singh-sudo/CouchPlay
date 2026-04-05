"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Users, Gamepad2, ChevronRight, X, Plus, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

// API data types
interface Game {
  slug: string;
  title: string;
  system: string;
  coverArtUrl?: string;
  thumbnailUrl?: string;
  isFeatured: boolean;
  playCount: number;
  description?: string;
  publisher?: string;
}

// System filter tabs
const SYSTEMS = ["ALL", "SNES", "GBA", "PSX", "N64", "PSP"];

// System background gradients for cinematic effect
const SYSTEM_GRADIENTS: Record<string, string> = {
  snes: "from-purple-900 via-indigo-900 to-black",
  gba: "from-emerald-900 via-teal-900 to-black",
  psx: "from-gray-900 via-slate-800 to-black",
  n64: "from-red-900 via-orange-900 to-black",
  psp: "from-cyan-900 via-blue-900 to-black",
  genesis: "from-blue-900 via-blue-800 to-black",
};

// Fallback gradient when no matching system
const DEFAULT_GRADIENT = "from-rose-900 via-pink-900 to-black";

function getGradient(system: string): string {
  return SYSTEM_GRADIENTS[system?.toLowerCase()] || DEFAULT_GRADIENT;
}

// Game card placeholder colors for when no cover art
const CARD_COLORS = [
  "bg-gradient-to-br from-rose-800 to-rose-950",
  "bg-gradient-to-br from-blue-800 to-blue-950",
  "bg-gradient-to-br from-emerald-800 to-emerald-950",
  "bg-gradient-to-br from-amber-800 to-amber-950",
  "bg-gradient-to-br from-purple-800 to-purple-950",
  "bg-gradient-to-br from-cyan-800 to-cyan-950",
];

// Join Session Modal
function JoinModal({
  open,
  onClose,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length >= 4) onJoin(trimmed);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black tracking-widest uppercase">Join Session</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-white/50 tracking-widest uppercase mb-2 block">
                    Session Code
                  </label>
                  <input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                    placeholder="XKQP7"
                    maxLength={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-center text-3xl font-black tracking-[0.5em] text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={code.length < 4}
                  className="w-full bg-white text-black py-4 rounded-xl font-black text-base hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-5 h-5" />
                  Join Now
                </button>
              </form>

              <p className="text-center text-white/30 text-xs mt-4">
                Ask the session host for the 5-character code
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Game Card skeleton
function GameCardSkeleton() {
  return (
    <div className="shrink-0 w-60 h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
  );
}

export default function Home() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeSystem, setActiveSystem] = useState("ALL");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  // Fetch games from API
  const { data: gamesData, isLoading } = useQuery({
    queryKey: ["games", activeSystem],
    queryFn: async () => {
      const systemParam = activeSystem !== "ALL" ? `&system=${activeSystem.toLowerCase()}` : "";
      const res = await fetch(`/api/v1/games?limit=20${systemParam}`);
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json() as Promise<{ games: Game[] }>;
    },
    staleTime: 60_000, // Cache for 1min
  });

  const { data: featuredData } = useQuery({
    queryKey: ["games", "featured"],
    queryFn: async () => {
      const res = await fetch("/api/v1/games?featured=true&limit=5");
      if (!res.ok) throw new Error("Failed to fetch featured");
      return res.json() as Promise<{ games: Game[] }>;
    },
    staleTime: 120_000,
  });

  const games = gamesData?.games ?? [];
  const featuredGames = featuredData?.games ?? [];
  const heroGame = featuredGames[selectedIndex] ?? games[0];

  const handlePlay = useCallback(() => {
    if (heroGame) router.push(`/play/${heroGame.slug}`);
  }, [heroGame, router]);

  const handleJoin = useCallback((code: string) => {
    setShowJoinModal(false);
    router.push(`/join/${code}`);
  }, [router]);

  const handleCreateSession = useCallback(async () => {
    if (!heroGame || creatingSession) return;
    setCreatingSession(true);
    try {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: heroGame.slug }),
      });
      if (res.ok) {
        const session = await res.json();
        router.push(`/screen/${session.code}`);
      }
    } finally {
      setCreatingSession(false);
    }
  }, [heroGame, creatingSession, router]);

  return (
    <div className="w-full h-full relative bg-black flex flex-col text-white overflow-hidden">

      {/* Cinematic Background — blurs to match selected game system */}
      <AnimatePresence mode="wait">
        <motion.div
          key={heroGame?.slug ?? "default"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className={`absolute inset-0 bg-gradient-to-br ${getGradient(heroGame?.system ?? "")} z-0 pointer-events-none`}
        />
      </AnimatePresence>
      {/* Additional noise/grain texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.08] bg-[url('/noise.png')] bg-repeat" />

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <header className="relative z-10 w-full px-8 py-5 flex items-center justify-between shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-black" />
          </div>
          <span className="text-xl font-black tracking-[0.2em] uppercase">{process.env.NAME}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors font-semibold text-sm border border-white/10"
          >
            <Users className="w-4 h-4" />
            Join Session
          </button>
          <button
            onClick={() => router.push("/pricing")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 transition-colors font-bold text-sm shadow-lg shadow-rose-900/50"
          >
            <Zap className="w-4 h-4" />
            Go Pro
          </button>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col justify-end pb-6 px-8 z-10 min-h-0">
        <AnimatePresence mode="wait">
          {heroGame && (
            <motion.div
              key={heroGame.slug}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-6"
            >
              <div className="text-xs font-black text-white/50 tracking-[0.3em] uppercase mb-2">
                {heroGame.system?.toUpperCase()}
                {heroGame.publisher && ` · ${heroGame.publisher}`}
              </div>
              <h2 className="text-5xl font-black mb-2 max-w-xl leading-none tracking-tight">
                {heroGame.title}
              </h2>
              {heroGame.description && (
                <p className="text-white/50 text-sm max-w-md mb-5 leading-relaxed line-clamp-2">
                  {heroGame.description}
                </p>
              )}

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-3 bg-white text-black px-7 py-3.5 rounded-full font-black text-base hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  <Play className="fill-black w-5 h-5" />
                  Play Now
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={creatingSession}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors border border-white/10 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {creatingSession ? "Creating..." : "Start Session"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── SYSTEM FILTER TABS ──────────────────────────────────────── */}
        <div className="flex gap-2 mb-4 shrink-0">
          {SYSTEMS.map((sys) => (
            <button
              key={sys}
              onClick={() => { setActiveSystem(sys); setSelectedIndex(0); }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors ${activeSystem === sys
                ? "bg-white text-black"
                : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                }`}
            >
              {sys}
            </button>
          ))}
        </div>

        {/* ── GAME CAROUSEL ─────────────────────────────────────────────── */}
        <div
          className="w-full flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 shrink-0"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <GameCardSkeleton key={i} />)
            : games.map((game, i) => (
              <motion.div
                key={game.slug}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedIndex(i)}
                className={`
                    snap-center shrink-0 w-60 h-36 rounded-2xl cursor-pointer
                    border-2 overflow-hidden relative shadow-xl transition-all
                    ${i === selectedIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-90"}
                    ${game.thumbnailUrl ? "" : CARD_COLORS[i % CARD_COLORS.length]}
                  `}
              >
                {game.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={game.thumbnailUrl}
                    alt={game.title}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                )}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                  <div className="text-[10px] font-black text-white/60 tracking-widest uppercase mb-0.5">
                    {game.system}
                  </div>
                  <div className="font-bold text-sm truncate leading-tight">{game.title}</div>
                </div>
                {game.isFeatured && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-600 rounded-full text-[9px] font-black tracking-widest uppercase">
                    Featured
                  </div>
                )}
              </motion.div>
            ))}
        </div>
      </main>

      {/* Join Session Modal */}
      <JoinModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoin}
      />
    </div>
  );
}
