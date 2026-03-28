"use client";

import { useCallback } from "react";
import { VirtualGamepad, GamepadButton } from "@/components/gamepad/VirtualGamepad";
import { useSessionConnection } from "@/lib/webrtc/useSessionConnection";
import { useAuth } from "@/components/providers/auth-provider";
import { Wifi, WifiOff } from "lucide-react";

export default function ControllerPage({ params }: { params: { sessionCode: string } }) {
  const { user } = useAuth();
  const { connectionState, sendData } = useSessionConnection(params.sessionCode, "client", () => {});

  const handleButtonChange = useCallback((btn: GamepadButton, pressed: boolean) => {
    sendData({
      playerId: user?.id || "guest",
      button: btn,
      state: pressed ? "pressed" : "released",
      timestamp: Date.now(),
    });
  }, [sendData, user]);

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center">
      {/* Top Bar Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[60] flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm flex items-center gap-2">
            Session: {params.sessionCode}
          </div>
        </div>

        <div className="px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white font-medium text-sm flex items-center gap-2">
          {connectionState === "connected" ? (
            <><Wifi className="w-4 h-4 text-green-400" /> Connected</>
          ) : (
            <><WifiOff className="w-4 h-4 text-yellow-400" /> {connectionState}</>
          )}
        </div>
      </div>

      <VirtualGamepad onButtonChange={handleButtonChange} />
    </div>
  );
}
