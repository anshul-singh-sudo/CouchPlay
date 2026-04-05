"use client";

import { useCallback, useState, useEffect } from "react";
import { VirtualGamepad, GamepadButton } from "@/components/gamepad/VirtualGamepad";
import { useSessionConnection } from "@/lib/webrtc/useSessionConnection";
import { useAuth } from "@/components/providers/auth-provider";
import { Wifi, WifiOff } from "lucide-react";

export default function ControllerPage({ params }: { params: { sessionCode: string } }) {
  const { user } = useAuth();
  const { connectionState, sendData } = useSessionConnection(params.sessionCode, "client", () => {});
  const [playerIndex, setPlayerIndex] = useState<1|2|3|4>(1);

  // Join the session via API to get an assigned player index
  useEffect(() => {
    async function joinSession() {
      try {
        const res = await fetch(`/api/v1/sessions/${params.sessionCode}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "controller" }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.playerIndex) setPlayerIndex(data.playerIndex as 1|2|3|4);
        }
      } catch (err) {
        console.error("Failed to join session explicitly:", err);
      }
    }
    joinSession();
  }, [params.sessionCode]);

  const handleButtonChange = useCallback((btn: GamepadButton, pressed: boolean) => {
    sendData({
      playerId: user?.id || "guest",
      playerIndex, // Include assigned index so host knows which controller this is
      button: btn,
      state: pressed ? "pressed" : "released",
      timestamp: Date.now(),
    });
  }, [sendData, user, playerIndex]);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      {/* Top Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[60] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm flex items-center gap-2 border border-white/10">
            <span className="text-white/50">Code:</span> {params.sessionCode}
          </div>
          <div className="px-3 py-2 bg-rose-600/30 text-rose-300 backdrop-blur-md rounded-full font-bold text-xs tracking-widest border border-rose-500/30">
            P{playerIndex}
          </div>
        </div>

        <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm flex items-center gap-2 border border-white/10">
          {connectionState === "connected" ? (
            <><Wifi className="w-4 h-4 text-green-400" /> Connected</>
          ) : (
            <><WifiOff className="w-4 h-4 text-yellow-500" /> {connectionState}</>
          )}
        </div>
      </div>

      <VirtualGamepad 
        onButtonChange={handleButtonChange} 
        playerIndex={playerIndex}
        variant="standalone"
      />
    </div>
  );
}
