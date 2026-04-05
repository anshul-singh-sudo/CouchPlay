"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity, Users, Gamepad2, Upload, RefreshCw,
  Shield, AlertCircle, Wifi, CheckCircle
} from "lucide-react";

interface Session {
  code: string;
  status: string;
  gameSlug: string | null;
  playerCount?: number;
}

interface GameEntry {
  slug: string;
  title: string;
  system: string;
  playCount: number;
  isFeatured: boolean;
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/50 font-bold text-xs tracking-widest uppercase">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-4xl font-black">{value}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  // Fetch active sessions
  const { data: sessionsData, refetch: refetchSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/v1/sessions?status=active");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json() as Promise<Session[]>;
    },
    refetchInterval: 5_000, // Poll every 5s for live sessions
  });

  // Fetch game library
  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["admin-games"],
    queryFn: async () => {
      const res = await fetch("/api/v1/games?limit=50");
      if (!res.ok) throw new Error("Failed to fetch games");
      return res.json() as Promise<{ games: GameEntry[] }>;
    },
  });

  const activeSessions = sessionsData ?? [];
  const games = gamesData?.games ?? [];

  const handleRomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus("uploading");
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let system = 'Unknown';
      if (ext === 'gba') system = 'GBA';
      else if (ext === 'z64' || ext === 'n64' || ext === 'v64') system = 'N64';
      else if (ext === 'sfc' || ext === 'smc') system = 'SNES';
      else if (ext === 'nes') system = 'NES';
      else if (ext === 'md' || ext === 'gen' || ext === 'bin') system = 'Genesis';

      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      let r2Key = "";

      if (process.env.NODE_ENV === "development") {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch("/api/v1/games/upload-local", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Local upload failed");
        const data = await uploadRes.json();
        r2Key = data.r2Key;
      } else {
        // Production: R2
        const getUrlRes = await fetch("/api/v1/games/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type || "application/octet-stream" })
        });

        if (!getUrlRes.ok) throw new Error("Failed to get presigned URL");
        const { url, r2Key: newR2Key } = await getUrlRes.json();
        r2Key = newR2Key;

        const putRes = await fetch(url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type || "application/octet-stream"
          }
        });

        if (!putRes.ok) throw new Error("Failed to upload to R2");
      }

      // Add to database
      const dbRes = await fetch("/api/v1/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          system,
          r2Key,
          description: `Uploaded ${system} game.`,
          publisher: "Unknown",
          releaseYear: new Date().getFullYear(),
          coverArtUrl: "",
          thumbnailUrl: "",
          isFeatured: false
        })
      });

      if (!dbRes.ok) throw new Error("Failed to save to database record");

      setUploadStatus("done");
      refetchGames();
      setTimeout(() => setUploadStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      setTimeout(() => setUploadStatus("idle"), 5000);
    }
  };

  const uploadButtonLabel = {
    idle: "Upload ROM",
    uploading: "Uploading...",
    done: "Upload Complete",
    error: "Upload Failed",
  }[uploadStatus];

  const uploadButtonIcon = {
    idle: <Upload className="w-4 h-4" />,
    uploading: <RefreshCw className="w-4 h-4 animate-spin" />,
    done: <CheckCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  }[uploadStatus];

  return (
    <div className="min-h-[100dvh] w-full bg-black text-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-8 py-8">

        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider">
                {process.env.NAME} <span className="text-rose-500">ADMIN</span>
              </h1>
              <p className="text-white/40 text-xs font-medium">System Dashboard</p>
            </div>
          </div>

          <div className="flex gap-3">
            <label className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm cursor-pointer transition-colors
              ${uploadStatus === "done" ? "bg-green-600" : uploadStatus === "error" ? "bg-red-600" : "bg-rose-600 hover:bg-rose-500"}
            `}>
              {uploadButtonIcon}
              {uploadButtonLabel}
              <input type="file" accept=".zip,.rom,.smc,.sfc,.gba,.bin,.iso,.z64,.n64" className="hidden" onChange={handleRomUpload} />
            </label>
            <button
              onClick={() => refetchSessions()}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="Active Sessions"
            value={sessionsLoading ? "—" : activeSessions.length}
            icon={<Activity className="w-4 h-4 text-green-400" />}
            color="bg-green-500/10"
          />
          <StatCard
            label="Games Library"
            value={gamesLoading ? "—" : games.length}
            icon={<Gamepad2 className="w-4 h-4 text-purple-400" />}
            color="bg-purple-500/10"
          />
          <StatCard
            label="Live Players"
            value={activeSessions.reduce((sum, s) => sum + (s.playerCount ?? 0), 0)}
            icon={<Users className="w-4 h-4 text-blue-400" />}
            color="bg-blue-500/10"
          />
          <StatCard
            label="System Status"
            value="Online"
            icon={<Wifi className="w-4 h-4 text-emerald-400" />}
            color="bg-emerald-500/10"
          />
        </div>

        {/* Live Sessions Table */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black tracking-widest uppercase text-white/80">
              Live Sessions
            </h2>
            <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Auto-refresh 5s
            </div>
          </div>
          <div className="w-full overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Game</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-white/5">
                {sessionsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-5 py-4">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-white/30">
                      No active sessions
                    </td>
                  </tr>
                ) : (
                  activeSessions.map((s) => (
                    <tr key={s.code} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-rose-400 font-bold tracking-widest">
                        {s.code}
                      </td>
                      <td className="px-5 py-3.5 text-white/70">{s.gameSlug ?? "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={async () => {
                            await fetch(`/api/v1/sessions/${s.code}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "closed" }),
                            });
                            refetchSessions();
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                        >
                          End Session
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Games Library Table */}
        <div>
          <h2 className="text-lg font-black tracking-widest uppercase text-white/80 mb-4">
            Game Library
          </h2>
          <div className="w-full overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-5 py-3.5">Title</th>
                  <th className="px-5 py-3.5">System</th>
                  <th className="px-5 py-3.5">Plays</th>
                  <th className="px-5 py-3.5">Featured</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-white/5">
                {gamesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-5 py-3.5">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : games.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-white/30">
                      No games uploaded yet
                    </td>
                  </tr>
                ) : (
                  games.map((g) => (
                    <tr key={g.slug} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">{g.title}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 bg-white/10 rounded text-xs font-bold uppercase tracking-widest">
                          {g.system}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white/60">{g.playCount.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        {g.isFeatured && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded text-xs font-bold">
                            Featured
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
