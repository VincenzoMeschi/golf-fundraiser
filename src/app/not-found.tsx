"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();

  // Redirect to home page after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    // Cleanup the timer on component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">404 - Page Not Found</h1>
        <p className="text-lg text-muted-foreground">Oops! The page you're looking for doesn't exist.</p>
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
