"use client";

import { useState, useEffect } from "react";
import { Monitor } from "lucide-react";
import Link from "next/link";

export default function ResponsiveWarning() {
  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    const check = () => setTooSmall(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!tooSmall) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center w-16 h-16 rounded-none bg-foreground mx-auto mb-4">
          <Monitor className="w-8 h-8 text-background" />
        </div>
        <h2 className="text-xl font-bold mb-2">Larger Screen Required</h2>
        <p className="text-sm text-muted leading-relaxed mb-4">
          GenFlow Visual Builder is designed for desktop use. Please use a screen at least{" "}
          <strong className="text-foreground">1024px</strong> wide for the best
          experience.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-foreground text-background hover:opacity-90 active:scale-[0.98] text-sm font-medium hover:bg-foreground transition-colors duration-150"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
