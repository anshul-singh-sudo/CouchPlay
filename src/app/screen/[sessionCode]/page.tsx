"use client";

import { useState, useCallback } from "react";
import { useSessionConnection } from "@/lib/webrtc/useSessionConnection";
import { EmulatorPlayer } from "@/components/emulator/EmulatorPlayer";
import { GamepadButton } from "@/components/gamepad/VirtualGamepad";

// Default Keyboard Mapping matching Mode 1
const BUTTON_KEY_MAP: Record<GamepadButton, string> = {
  UP: "ArrowUp", DOWN: "ArrowDown", LEFT: "ArrowLeft", RIGHT: "ArrowRight",
  A: "x", B: "z", X: "s", Y: "a",
  L: "q", R: "w", START: "Enter", SELECT: "Shift",
};

export default function ScreenPage({ params }: { params: { sessionCode: string } }) {
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  
  // connectionState is unused since it's just host viewing the connection locally, we can omit destructuring it.
  useSessionConnection(params.sessionCode, "host", useCallback((data: Record<string, unknown>) => {
    // Process incoming Remote Gamepad Data
    if (data.button && data.state) {
      const key = BUTTON_KEY_MAP[data.button as GamepadButton];
      if (!key) return;
      
      const eventName = data.state === "pressed" ? "keydown" : "keyup";
      const keyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;

      const event = new KeyboardEvent(eventName, {
        key, code: key, keyCode, which: keyCode, bubbles: true, cancelable: true,
      });

      document.dispatchEvent(event);

      // Track active players
      if (data.playerId && typeof data.playerId === "string" && !activePlayers.includes(data.playerId)) {
        setActivePlayers(prev => [...prev, data.playerId as string]);
      }
    }
  }, [activePlayers]));


  return (
    <div className="w-full h-full relative">
      <EmulatorPlayer 
        system="snes" // Defaulting to SNES for now, should be DB driven
        romUrl="/roms/test.z64"
      />

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 pointer-events-none">
        <div className="px-6 py-3 bg-black/80 backdrop-blur-md rounded-full text-white font-bold text-lg border border-white/20 shadow-2xl flex items-center gap-3">
          <span className="text-rose-500 animate-pulse">●</span> {params.sessionCode}
        </div>
      </div>
      
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
          {activePlayers.length > 0 && (
             <div className="px-4 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-bold backdrop-blur-md uppercase tracking-widest border border-green-500/30">
               P1 Joined
             </div>
          )}
      </div>
    </div>
  );
}
