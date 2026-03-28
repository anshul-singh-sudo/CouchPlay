"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, GamepadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { VirtualGamepad } from "@/components/gamepad/VirtualGamepad";
import { useGamepadToKeyboard } from "@/hooks/useGamepadToKeyboard";

interface EmulatorPlayerProps {
  system: string;
  romUrl: string;
  gameSlug: string;
}

export function EmulatorPlayer({ system, romUrl, gameSlug }: EmulatorPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [showGamepad, setShowGamepad] = useState(true);
  const router = useRouter();
  const { dispatchKey } = useGamepadToKeyboard();

  useEffect(() => {
    if (!containerRef.current) return;

    const w = window as any;
    w.EJS_player = "#emulator-target";
    w.EJS_core = system.toLowerCase();
    w.EJS_gameUrl = romUrl || "https://demo.test/rom.zip"; 
    w.EJS_pathtodata = "https://cdn.jsdelivr.net/gh/emulatorjs/emulatorjs@main/data/";
    w.EJS_color = "#e11d48";
    w.EJS_HideControls = true;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/gh/emulatorjs/emulatorjs@main/data/loader.js";
    script.async = true;
    
    script.onload = () => {
      setIsReady(true);
    };

    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
        const container = document.getElementById("emulator-target");
        if (container) container.innerHTML = "";
      } catch (e) {}
    };
  }, [system, romUrl]);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      <div id="emulator-target" ref={containerRef} className="w-full h-full absolute inset-0 z-0"></div>

      {/* Top Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[60] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button 
            onClick={() => router.push('/')}
            className="p-3 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm">
            Session: LOCAL
          </div>
        </div>

        <div className="pointer-events-auto">
          <button 
            onClick={() => setShowGamepad(p => !p)}
            className={`p-3 backdrop-blur-md rounded-full text-white transition-colors ${showGamepad ? 'bg-rose-600/80 hover:bg-rose-600' : 'bg-black/50 hover:bg-black/80'}`}
          >
            <GamepadIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {isReady && showGamepad && (
        <VirtualGamepad onButtonChange={dispatchKey} />
      )}

      {!isReady && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white font-medium tracking-widest text-sm uppercase">Loading Engine...</p>
        </div>
      )}
    </div>
  );
}
