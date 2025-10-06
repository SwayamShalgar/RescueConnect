import { Geist, Geist_Mono } from "next/font/google";
import 'leaflet/dist/leaflet.css';
import "./globals.css";
import TranslateProvider from "./components/TranslateProvider";
import PWAInstaller from "./components/PWAInstaller";
import SyncNotification from "./components/SyncNotification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RescueConnect - Emergency Response Platform",
  description: "Emergency Response Platform for disaster management, rescue operations, and real-time communication with volunteers",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RescueConnect",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="RescueConnect" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PWAInstaller />
        <SyncNotification />
        <TranslateProvider>
          {children}
        </TranslateProvider>
      </body>
    </html>
  );
}
