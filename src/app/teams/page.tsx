"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import TeamManagement from "@/components/TeamManagement/TeamManagement";

export default function Teams() {
  const { user } = useUser();
  const [hasSpots, setHasSpots] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSpotPurchase = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/teams/check-spots", {
      method: "POST",
      body: JSON.stringify({ userId: user?.id }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setHasSpots(data.hasSpots);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      checkSpotPurchase();
    }
  }, [user, checkSpotPurchase]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-4 sm:py-8 min-h-screen flex items-center justify-center">
        <p className="text-sm sm:text-base text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen">
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {hasSpots ? (
          <TeamManagement />
        ) : (
          <Card className="max-w-md sm:max-w-2xl mx-auto p-4 sm:p-6 text-center">
            <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Access Denied</h1>
            <p className="text-sm sm:text-base text-muted-foreground">You must purchase at least one spot to access team management. Please register first.</p>
            <a href="/register" className="text-primary underline mt-2 inline-block text-sm sm:text-base">
              Go to Registration
            </a>
          </Card>
        )}
      </SignedIn>
    </div>
  );
}
