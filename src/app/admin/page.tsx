import { Activity, Users, Gamepad2, Settings } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="min-h-[100dvh] w-full bg-black text-white p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black tracking-widest">COACHPLAY <span className="text-rose-500">ADMIN</span></h1>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
              Manage Games
            </button>
            <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-full text-sm font-bold transition-colors shadow-lg shadow-rose-900/50">
              Upload ROM
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Total Users", value: "12,349", icon: <Users className="w-5 h-5 text-blue-400" /> },
            { label: "Active Sessions", value: "342", icon: <Activity className="w-5 h-5 text-green-400" /> },
            { label: "Games Library", value: "1,204", icon: <Gamepad2 className="w-5 h-5 text-purple-400" /> },
            { label: "System Health", value: "99.9%", icon: <Settings className="w-5 h-5 text-gray-400" /> },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 font-bold text-sm tracking-widest uppercase">{stat.label}</span>
                {stat.icon}
              </div>
              <div className="text-4xl font-black">{stat.value}</div>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6 text-white/80">Active Live Sessions</h2>
          <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left">
              <thead className="bg-white/5 border-b border-white/10 text-white/50 text-sm uppercase tracking-widest">
                <tr>
                  <th className="p-4">Session Code</th>
                  <th className="p-4">Host User</th>
                  <th className="p-4">Game</th>
                  <th className="p-4">Players</th>
                  <th className="p-4">Latency (avg)</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {[
                  { code: "XKQP7", host: "user_89f21...", game: "Super Mario 64", players: 2, ping: "18ms" },
                  { code: "9MLP2", host: "guest_22x...", game: "Tekken 3", players: 4, ping: "45ms" },
                  { code: "VBN44", host: "user_a1b2c...", game: "Crash Bandicoot", players: 1, ping: "12ms" },
                ].map((s, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-rose-400">{s.code}</td>
                    <td className="p-4 opacity-70">{s.host}</td>
                    <td className="p-4">{s.game}</td>
                    <td className="p-4">{s.players} / 4</td>
                    <td className="p-4 text-green-400">{s.ping}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
