import { CheckCircle2 } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="text-center mb-16 mt-12">
        <h1 className="text-5xl font-black tracking-widest mb-4">UNLOCK <span className="text-rose-500 text-shadow-sm">{process.env.NAME}</span> ROOTS</h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Experience true cloud couch gaming with zero limits. Invite up to 3 friends to your session from anywhere in the world.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 max-w-5xl w-full justify-center">
        {/* Free Plan */}
        <div className="flex-1 rounded-3xl bg-white/5 border border-white/10 p-10 flex flex-col relative overflow-hidden">
          <h2 className="text-2xl font-bold mb-2">Guest Mode</h2>
          <div className="text-4xl font-black mb-8">Free</div>

          <ul className="flex flex-col gap-4 mb-12 flex-1 text-white/70 font-medium">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-white/30" /> Supported: Ad-breaks</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-white/30" /> Local Single Player (Mode 1)</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-white/30" /> 1 Save State</li>
          </ul>

          <button className="w-full py-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-bold tracking-widest text-sm uppercase">
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="flex-1 rounded-3xl bg-gradient-to-br from-rose-900/40 to-black border border-rose-500/50 p-10 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.15)] transform md:-translate-y-4">
          <div className="absolute top-0 right-0 py-1 px-4 bg-rose-600 text-xs font-black tracking-widest uppercase rounded-bl-xl">Most Popular</div>
          <h2 className="text-2xl font-bold mb-2 text-rose-100">Pro Upgrade</h2>
          <div className="text-4xl font-black mb-8 flex items-baseline gap-2">
            $5.99 <span className="text-lg text-rose-500/60 font-bold uppercase tracking-widest">/ month</span>
          </div>

          <ul className="flex flex-col gap-4 mb-12 flex-1 text-rose-100/90 font-medium">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-rose-500" /> Ad-Free Experience</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-rose-500" /> Multi-device Play (up to 4 phones)</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-rose-500" /> WebRTC P2P Global Sessions</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-rose-500" /> Unlimited Cloud Saves</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="text-rose-500" /> Access to Premium Game Cores</li>
          </ul>

          <button className="w-full py-4 rounded-full bg-rose-600 hover:bg-rose-500 transition-colors font-black tracking-widest text-sm uppercase shadow-lg shadow-rose-900/50">
            Subscribe via Stripe
          </button>
        </div>
      </div>
    </div>
  );
}
