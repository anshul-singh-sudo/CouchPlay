"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Settings, Users, Gamepad2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Dummy local db for mocked games
const GAMES = [
  { id: "super-mario-64", title: "Super Mario 64", system: "N64", bg: "bg-red-900" },
  { id: "zelda-oot", title: "Legend of Zelda: Ocarina of Time", system: "N64", bg: "bg-green-900" },
  { id: "pokemon-emerald", title: "Pokemon Emerald", system: "GBA", bg: "bg-emerald-900" },
  { id: "crash-bandicoot", title: "Crash Bandicoot", system: "PSX", bg: "bg-orange-900" },
  { id: "tekken-3", title: "Tekken 3", system: "PSX", bg: "bg-yellow-900" },
];

export default function Home() {
  const router = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handlePlayHero = () => {
    router.push(`/play/${GAMES[selectedIndex].id}`);
  };

  const handleJoinSession = () => {
    const code = prompt("Enter Session Code:");
    if (code) router.push(`/join/${code.toUpperCase()}`);
  };

  return (
    <div className="w-full h-full relative bg-black flex flex-col text-white overflow-hidden">
      {/* Dynamic Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 ${GAMES[selectedIndex].bg} blur-[100px] scale-150 z-0 pointer-events-none`}
        />
      </AnimatePresence>

      {/* Top Console Bar */}
      <header className="w-full p-6 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-8 h-8 text-white" />
          <h1 className="text-2xl font-black tracking-widest text-shadow-sm">COACHPLAY</h1>
        </div>
        <div className="flex gap-4">
          <button onClick={handleJoinSession} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors font-medium">
            <Users className="w-4 h-4" /> Join Session
          </button>
          <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-end pb-8 px-12 z-10">
        
        {/* Hero Title & Actions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <div className="text-sm font-bold text-white/50 tracking-widest uppercase mb-2">
              {GAMES[selectedIndex].system}
            </div>
            <h2 className="text-6xl font-black mb-6 max-w-2xl leading-tight">
              {GAMES[selectedIndex].title}
            </h2>
            <button 
              onClick={handlePlayHero}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              <Play className="fill-black w-6 h-6" /> Play Now
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Horizontal Game Carousel */}
        <div className="w-full overflow-x-auto snap-x snap-mandatory flex gap-6 pb-4 scrollbar-hide no-scrollbar" style={{ scrollbarWidth: "none" }}>
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              onClick={() => setSelectedIndex(i)}
              className={`snap-center shrink-0 w-64 h-36 rounded-2xl cursor-pointer ${game.bg} border-2 overflow-hidden relative shadow-lg transition-all ${selectedIndex === i ? "border-white scale-100" : "border-transparent opacity-50 scale-95 hover:opacity-80"}`}
            >
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-3">
                <div className="text-xs font-bold text-white/70">{game.system}</div>
                <div className="font-bold text-sm truncate">{game.title}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
