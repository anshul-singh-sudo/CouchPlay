import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ConnectionState } from "@/lib/webrtc/useSessionConnection";

export type GameMode = 1 | 2 | 3 | 4;
export type SessionRole = "host" | "client" | null;

export interface Player {
  playerId: string;
  playerIndex: 1 | 2 | 3 | 4;
  role: "screen" | "controller";
  lastSeen: number;
}

export interface GameInfo {
  slug: string;
  title: string;
  system: string;
  romUrl: string;
  coverArtUrl?: string;
}

interface GameStore {
  // ── Session state ─────────────────────────────────────────────────────────
  sessionCode: string | null;
  sessionRole: SessionRole;
  gameMode: GameMode;
  connectedPlayers: Player[];
  connectionState: ConnectionState;

  // ── Emulator state ────────────────────────────────────────────────────────
  currentGame: GameInfo | null;
  emulatorReady: boolean;
  showGamepad: boolean;
  muted: boolean;

  // ── UI state ──────────────────────────────────────────────────────────────
  showJoinModal: boolean;
  joinInputCode: string;

  // ── Actions ───────────────────────────────────────────────────────────────
  setSessionCode: (code: string | null) => void;
  setSessionRole: (role: SessionRole) => void;
  setGameMode: (mode: GameMode) => void;
  setConnectionState: (state: ConnectionState) => void;
  setCurrentGame: (game: GameInfo | null) => void;
  setEmulatorReady: (ready: boolean) => void;
  toggleGamepad: () => void;
  toggleMute: () => void;
  setShowJoinModal: (show: boolean) => void;
  setJoinInputCode: (code: string) => void;

  // Player management
  upsertPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  pruneStalePlayer: (staleThresholdMs?: number) => void;

  /** Create a session code and store it */
  createSession: (gameSlug: string) => Promise<string | null>;

  /** Reset session state (called on disconnect / go home) */
  clearSession: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set) => ({
        // ── Initial state ────────────────────────────────────────────────────
        sessionCode: null,
        sessionRole: null,
        gameMode: 1,
        connectedPlayers: [],
        connectionState: "disconnected",
        currentGame: null,
        emulatorReady: false,
        showGamepad: true,
        muted: false,
        showJoinModal: false,
        joinInputCode: "",

        // ── Setters ──────────────────────────────────────────────────────────
        setSessionCode: (code) => set({ sessionCode: code }),
        setSessionRole: (role) => set({ sessionRole: role }),
        setGameMode: (mode) => set({ gameMode: mode }),
        setConnectionState: (state) => set({ connectionState: state }),
        setCurrentGame: (game) => set({ currentGame: game }),
        setEmulatorReady: (ready) => set({ emulatorReady: ready }),
        toggleGamepad: () => set((s) => ({ showGamepad: !s.showGamepad })),
        toggleMute: () => set((s) => ({ muted: !s.muted })),
        setShowJoinModal: (show) => set({ showJoinModal: show }),
        setJoinInputCode: (code) => set({ joinInputCode: code }),

        // ── Player management ────────────────────────────────────────────────
        upsertPlayer: (player) =>
          set((s) => {
            const existing = s.connectedPlayers.find(
              (p) => p.playerId === player.playerId
            );
            if (existing) {
              return {
                connectedPlayers: s.connectedPlayers.map((p) =>
                  p.playerId === player.playerId ? { ...p, ...player } : p
                ),
              };
            }
            return {
              connectedPlayers: [...s.connectedPlayers, player],
            };
          }),

        removePlayer: (playerId) =>
          set((s) => ({
            connectedPlayers: s.connectedPlayers.filter(
              (p) => p.playerId !== playerId
            ),
          })),

        pruneStalePlayer: (staleThresholdMs = 10_000) =>
          set((s) => ({
            connectedPlayers: s.connectedPlayers.filter(
              (p) => p.lastSeen > Date.now() - staleThresholdMs
            ),
          })),

        // ── Async actions ────────────────────────────────────────────────────
        createSession: async (gameSlug: string) => {
          try {
            const res = await fetch("/api/v1/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gameSlug }),
            });
            if (!res.ok) return null;
            const data = await res.json();
            set({ sessionCode: data.code, sessionRole: "host", gameMode: 3 });
            return data.code as string;
          } catch {
            return null;
          }
        },

        clearSession: () =>
          set({
            sessionCode: null,
            sessionRole: null,
            connectedPlayers: [],
            connectionState: "disconnected",
            emulatorReady: false,
          }),
      }),
      {
        name: `${process.env.NAME}-game-store`,
        // Only persist user preferences, not session state (sessions are ephemeral)
        partialize: (state) => ({
          showGamepad: state.showGamepad,
          muted: state.muted,
        }),
      }
    ),
    { name: `${process.env.NAME} Store` }
  )
);
