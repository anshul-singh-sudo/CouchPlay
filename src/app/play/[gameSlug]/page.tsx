import { EmulatorPlayer } from "@/components/emulator/EmulatorPlayer";

// Mock DB fetch based on the dummy GAMEs from Home
const GAMES: Record<string, { system: string; romUrl: string }> = {
  "super-mario-64": { system: "n64", romUrl: "" },
  "zelda-oot": { system: "n64", romUrl: "" },
  "pokemon-emerald": { system: "gba", romUrl: "" },
  "crash-bandicoot": { system: "psx", romUrl: "" },
  "tekken-3": { system: "psx", romUrl: "" },
};

export default function PlayScreen({ params }: { params: { gameSlug: string } }) {
  const game = GAMES[params.gameSlug];

  if (!game) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white font-mono">
        Game Not Found or Unsupported
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <EmulatorPlayer 
        gameSlug={params.gameSlug}
        system={game.system}
        romUrl={game.romUrl}
      />
    </div>
  );
}
