import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "CoachPlay — Cloud Couch Gaming",
  description: "Play retro console games in your browser. No installs, no downloads. Stream SNES, GBA, PSX, N64 games with friends using just a session code.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CoachPlay" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Portrait detection — runs before paint to avoid flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function checkOrientation() {
                  var overlay = document.getElementById('portrait-overlay');
                  if (!overlay) return;
                  var isPortrait = window.innerHeight > window.innerWidth;
                  if (isPortrait) {
                    overlay.style.display = 'flex';
                  } else {
                    overlay.style.display = 'none';
                  }
                }
                window.addEventListener('resize', checkOrientation);
                window.addEventListener('orientationchange', function() {
                  setTimeout(checkOrientation, 100);
                });
                document.addEventListener('DOMContentLoaded', checkOrientation);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-[100dvh] overflow-hidden bg-background text-foreground`}
      >
        {/* Portrait mode blocker — JS above shows/hides this */}
        <div
          id="portrait-overlay"
          style={{ display: "none" }}
          className="fixed inset-0 z-[9999] bg-black text-white flex-col items-center justify-center text-center p-6"
        >
          <div className="mb-6 w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse text-rose-400">
              <rect width="12" height="20" x="6" y="2" rx="2" ry="2"/>
              <path d="M12 18h.01"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3 tracking-wide">Rotate Your Device</h1>
          <p className="text-gray-400 max-w-xs leading-relaxed text-sm">
            CoachPlay is optimized for landscape mode. Rotate your device to continue playing.
          </p>
          {/* Animated rotation hint */}
          <div className="mt-8 flex items-center gap-2 text-white/30 text-xs tracking-widest uppercase font-bold animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Rotate 90°
          </div>
        </div>

        <AuthProvider>
          <main className="w-full h-full relative landscape-only">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
