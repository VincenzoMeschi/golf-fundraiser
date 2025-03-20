"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotFound() {
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to home page after 3 seconds with a full page refresh
  useEffect(() => {
    if (!isMounted) return; // Prevent action before mount

    const timer = setTimeout(() => {
      // Use window.location.replace to redirect with a full refresh
      window.location.replace("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isMounted]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">404 - Page Not Found</h1>
        <p className="text-lg text-muted-foreground">Oops! The page you&apos;re looking for doesn&apos;t exist.</p>
        <p className="text-sm text-muted-foreground">You will be redirected to the home page in 3 seconds...</p>
        <p className="text-sm">
          <Link href="/" className="text-primary hover:underline">
            Click here to go back to the home page immediately.
          </Link>
        </p>
      </div>
    </div>
  );
}
