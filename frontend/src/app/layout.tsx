import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "QeviDiet – AI-Powered Diet Planner",
  description: "Personalized AI diet plans for muscle gain, fat loss, lean body & maintenance. Calculate your BMR, TDEE, and macros automatically.",
  keywords: "diet planner, AI nutrition, meal plan, BMR calculator, TDEE, macros, fat loss, muscle gain",
  openGraph: {
    title: "QeviDiet – AI-Powered Diet Planner",
    description: "Your intelligent nutrition companion. Get personalized weekly meal plans based on your body and goals.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {/* Animated Background */}
          <div className="animated-bg" aria-hidden="true">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-orb bg-orb-3" />
          </div>
          <div className="grid-bg" aria-hidden="true" />

          {children}

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(10, 15, 30, 0.95)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                color: '#f0f4ff',
                borderRadius: '12px',
                backdropFilter: 'blur(20px)',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: '#00ff87', secondary: '#050814' } },
              error: { iconTheme: { primary: '#ff006e', secondary: '#050814' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
