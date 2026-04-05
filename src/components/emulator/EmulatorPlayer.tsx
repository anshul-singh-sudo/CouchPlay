"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { ArrowLeft, GamepadIcon, Volume2, VolumeX, Maximize, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { VirtualGamepad } from "@/components/gamepad/VirtualGamepad";
import type { GamepadButton } from "@/components/gamepad/VirtualGamepad";
import { motion, AnimatePresence } from "framer-motion";

interface EmulatorPlayerProps {
  system: string;
  romUrl: string;
  sessionCode?: string;
  localPlayers?: 1 | 2;
  playerIndex?: 1 | 2 | 3 | 4;
  /** Called when the emulator signals it is ready */
  onReady?: () => void;
}

export interface EmulatorPlayerHandle {
  /** Inject a button press directly into the EJS input loop via postMessage */
  sendInput: (button: GamepadButton, pressed: boolean, playerIndex?: number) => void;
}

// Button → EmulatorJS keyCode mapping per player index
// EJS uses the keyboard emulation layer; we send synthetic events INTO the iframe
// which is isolated but not a separate thread — this bypasses main-thread event queue saturation
const BUTTON_KEY_MAP: Record<GamepadButton, string> = {
  UP: "ArrowUp",
  DOWN: "ArrowDown",
  LEFT: "ArrowLeft",
  RIGHT: "ArrowRight",
  A: "x",
  B: "z",
  X: "s",
  Y: "a",
  L: "q",
  R: "w",
  L2: "1",
  R2: "2",
  START: "Enter",
  SELECT: "Shift",
};

// Player 2 uses distinct key bindings to avoid conflicts
const P2_BUTTON_KEY_MAP: Record<GamepadButton, string> = {
  UP: "t",
  DOWN: "g",
  LEFT: "f",
  RIGHT: "h",
  A: "k",
  B: "j",
  X: "i",
  Y: "u",
  L: "y",
  R: "o",
  L2: "3",
  R2: "4",
  START: "]",
  SELECT: "[",
};

const EmulatorPlayer = forwardRef<EmulatorPlayerHandle, EmulatorPlayerProps>(
  function EmulatorPlayer({ system, romUrl, sessionCode, localPlayers = 1, onReady }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [showGamepad, setShowGamepad] = useState(true);
    const [showOverlay, setShowOverlay] = useState(true);
    const [muted, setMuted] = useState(false);
    const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const router = useRouter();

    // Auto-hide overlay after 3s of inactivity
    const resetOverlayTimer = useCallback(() => {
      setShowOverlay(true);
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
      overlayTimer.current = setTimeout(() => setShowOverlay(false), 3000);
    }, []);

    useEffect(() => {
      resetOverlayTimer();
      return () => {
        if (overlayTimer.current) clearTimeout(overlayTimer.current);
      };
    }, [resetOverlayTimer]);

    // Listen for postMessage from the EJS iframe to know when it's ready
    useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === "EJS_READY") {
          setIsReady(true);
          onReady?.();
        }
      };
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }, [onReady]);

    // Expose sendInput handle to parent (e.g. Screen page for remote input)
    useImperativeHandle(ref, () => ({
      sendInput(button: GamepadButton, pressed: boolean, playerIdx = 1) {
        const map = playerIdx === 2 ? P2_BUTTON_KEY_MAP : BUTTON_KEY_MAP;
        const key = map[button];
        if (!key || !iframeRef.current?.contentWindow) return;
        const keyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
        // Post synthetic keyboard event into the iframe — avoids polluting parent document
        iframeRef.current.contentWindow.postMessage(
          {
            type: "EJS_INPUT",
            eventName: pressed ? "keydown" : "keyup",
            key,
            keyCode,
          },
          "*"
        );
      },
    }));

    // Local gamepad handler for Mode 1 & 2 (local device)
    const handleLocalButton = useCallback(
      (button: GamepadButton, pressed: boolean, playerIdx: 1 | 2 = 1) => {
        if (!iframeRef.current?.contentWindow) return;
        const map = playerIdx === 2 ? P2_BUTTON_KEY_MAP : BUTTON_KEY_MAP;
        const key = map[button];
        if (!key) return;
        const keyCode = key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0;
        iframeRef.current.contentWindow.postMessage(
          { type: "EJS_INPUT", eventName: pressed ? "keydown" : "keyup", key, keyCode },
          "*"
        );
      },
      []
    );

    const iframeSrc = `/emulator-shell.html?system=${encodeURIComponent(system)}&rom=${encodeURIComponent(romUrl)}&muted=${muted}`;

    return (
      <div
        className="w-full h-full bg-black relative flex items-center justify-center"
        onPointerMove={resetOverlayTimer}
        onTouchStart={resetOverlayTimer}
      >
        {/* EJS runs inside an isolated iframe — keeps it off the main React render thread */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          className="w-full h-full absolute inset-0 z-0 border-none"
          allow="autoplay; fullscreen; gamepad"
          sandbox="allow-scripts allow-same-origin allow-forms"
          title="CoachPlay Emulator"
        />

        {/* Top Overlay Bar — fades in/out */}
        <AnimatePresence>
          {showOverlay && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-[60] p-4 flex items-center justify-between pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
            >
              <div className="flex items-center gap-3 pointer-events-auto">
                <button
                  onClick={() => router.push("/")}
                  className="p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white font-mono text-sm border border-white/10">
                  {sessionCode ? `SESSION: ${sessionCode}` : "LOCAL PLAY"}
                </div>
                {isReady && (
                  <div className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30 tracking-widest uppercase">
                    ● Live
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pointer-events-auto">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => iframeRef.current?.requestFullscreen()}
                  className="p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                >
                  <Maximize className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (iframeRef.current) iframeRef.current.src = iframeSrc;
                    setIsReady(false);
                  }}
                  className="p-2.5 bg-black/60 hover:bg-black/90 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowGamepad((p) => !p)}
                  className={`p-2.5 backdrop-blur-md rounded-full text-white transition-colors border ${
                    showGamepad
                      ? "bg-rose-600/80 hover:bg-rose-600 border-rose-500/50"
                      : "bg-black/60 hover:bg-black/90 border-white/10"
                  }`}
                >
                  <GamepadIcon className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Virtual Gamepad overlay — local play */}
        {isReady && showGamepad && (
          <>
            {localPlayers >= 2 && (
              <div className="absolute top-0 left-0 w-full h-1/2 origin-center rotate-180 z-50">
                <VirtualGamepad
                  playerIndex={2}
                  onButtonChange={(btn, pressed) => handleLocalButton(btn, pressed, 2)}
                />
              </div>
            )}
            <div className={`absolute bottom-0 left-0 w-full z-50 ${localPlayers >= 2 ? "h-1/2" : "h-full"}`}>
              <VirtualGamepad
                playerIndex={1}
                onButtonChange={(btn, pressed) => handleLocalButton(btn, pressed, 1)}
              />
            </div>
          </>
        )}

        {/* Loading Screen */}
        <AnimatePresence>
          {!isReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center gap-6"
            >
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-rose-600/30 absolute inset-0 animate-ping" />
                <div className="w-20 h-20 rounded-full border-4 border-t-rose-600 border-rose-600/20 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-black text-lg tracking-[0.3em] uppercase mb-1">
                  Loading Engine
                </p>
                <p className="text-white/30 text-xs tracking-widest uppercase">
                  {system.toUpperCase()} Core
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

EmulatorPlayer.displayName = "EmulatorPlayer";
export { EmulatorPlayer };
