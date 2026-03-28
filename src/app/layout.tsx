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
  title: "CoachPlay",
  description: "Cloud couch gaming in your browser",
  manifest: "/manifest.json",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-[100dvh] overflow-hidden bg-background text-foreground`}
      >
        <div id="portrait-overlay" className="fixed inset-0 z-[9999] bg-black text-white flex-col items-center justify-center text-center p-6 hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-4 animate-pulse"><rect width="12" height="20" x="6" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
          <h1 className="text-2xl font-bold mb-2">Please Rotate Your Device</h1>
          <p className="text-gray-400">CoachPlay requires landscape orientation for the best experience.</p>
        </div>
        <AuthProvider>
          <main className="w-full h-full relative">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
