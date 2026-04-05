"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useSessionConnection } from "@/lib/webrtc/useSessionConnection";
import { EmulatorPlayer, type EmulatorPlayerHandle } from "@/components/emulator/EmulatorPlayer";
import type { GamepadButton } from "@/components/gamepad/VirtualGamepad";
import { Users, Wifi, WifiOff, Signal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SessionInfo {
  gameSlug: string;
  system: string;
  romUrl: string;
  title: string;
}

interface ConnectedPlayer {
  playerId: string;
  playerIndex: number;
  lastSeen: number;
}

export default function ScreenPage({ params }: { params: { sessionCode: string } }) {
  const sessionCode = params.sessionCode.toUpperCase();
  const emulatorRef = useRef<EmulatorPlayerHandle>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectedPlayers, setConnectedPlayers] = useState<ConnectedPlayer[]>([]);
  const [latency, setLatency] = useState<number | null>(null);

  // Fetch session info from DB to get the correct game/system/ROM
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/v1/sessions/${sessionCode}`);
        if (res.ok) {
          const data = await res.json();
          setSessionInfo(data);
        } else {
          // Fallback for dev/demo: default SNES config
          setSessionInfo({
            gameSlug: "demo",
            system: "snes",
            romUrl: "/roms/demo.smc",
            title: "Demo Game",
          });
        }
      } catch {
        setSessionInfo({
          gameSlug: "demo",
          system: "snes",
          romUrl: "/roms/demo.smc",
          title: "Demo Game",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [sessionCode]);

  // Prune stale players every 5s (no input for >10s = disconnected)
  useEffect(() => {
    const interval = setInterval(() => {
      const staleThreshold = Date.now() - 10_000;
      setConnectedPlayers((prev) => prev.filter((p) => p.lastSeen > staleThreshold));
    }, 5_000);
    return () => clearInterval(interval);
  }, []);

  const handleRemoteInput = useCallback((data: Record<string, unknown>) => {
    if (!data.button || !data.state) return;

    const button = data.button as GamepadButton;
    const pressed = data.state === "pressed";
    const playerId = (data.playerId as string) || "unknown";
    const playerIndex = (data.playerIndex as number) || 1;
    const ts = data.timestamp as number;

    // Measure one-way latency
    if (ts) setLatency(Date.now() - ts);

    // Inject input directly into emulator via ref handle (not DOM events)
    emulatorRef.current?.sendInput(button, pressed, playerIndex);

    // Track connected players
    setConnectedPlayers((prev) => {
      const existing = prev.find((p) => p.playerId === playerId);
      if (existing) {
        return prev.map((p) =>
          p.playerId === playerId ? { ...p, lastSeen: Date.now() } : p
        );
      }
      return [...prev, { playerId, playerIndex, lastSeen: Date.now() }];
    });
  }, []);

  const { connectionState } = useSessionConnection(sessionCode, "host", handleRemoteInput);

  if (loading) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-t-rose-600 border-rose-600/20 animate-spin" />
      </div>
    );
  }

  if (!sessionInfo) return null;

  return (
    <div className="w-full h-full relative">
      <EmulatorPlayer
        ref={emulatorRef}
        system={sessionInfo.system}
        romUrl={sessionInfo.romUrl}
        sessionCode={sessionCode}
      />

      {/* Session Info HUD — top center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col items-center gap-2 pointer-events-none">
        <div className="px-5 py-2.5 bg-black/80 backdrop-blur-md rounded-full text-white font-bold text-base border border-white/20 shadow-2xl flex items-center gap-3">
          <span className="text-rose-500 animate-pulse text-lg">●</span>
          <span className="font-mono tracking-widest">{sessionCode}</span>
        </div>

        {/* Connection Status */}
        <AnimatePresence>
          {connectionState !== "connected" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="px-4 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-bold backdrop-blur-md border border-yellow-500/30 flex items-center gap-1.5"
            >
              <WifiOff className="w-3 h-3" /> Waiting for controllers...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Players + Latency HUD — top right */}
      <div className="absolute top-4 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none">
        {latency !== null && (
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border flex items-center gap-1.5 ${
            latency < 20
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : latency < 80
              ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
              : "bg-red-500/20 text-red-400 border-red-500/30"
          }`}>
            <Signal className="w-3 h-3" /> {latency}ms
          </div>
        )}

        {connectedPlayers.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10">
            <Users className="w-3.5 h-3.5 text-white/60" />
            <span className="text-xs font-bold text-white/80">
              {connectedPlayers.length} / 4
            </span>
          </div>
        )}

        {connectedPlayers.map((p) => (
          <div
            key={p.playerId}
            className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold backdrop-blur-md border border-green-500/30 flex items-center gap-1.5"
          >
            <Wifi className="w-3 h-3" /> P{p.playerIndex} Connected
          </div>
        ))}
      </div>
    </div>
  );
}
