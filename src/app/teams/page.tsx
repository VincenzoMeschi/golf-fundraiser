"use client";

import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import TeamManagement from "@/components/TeamManagement/TeamManagement";

export default function Teams() {
  const { user } = useUser();
  const [hasSpots, setHasSpots] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkSpotPurchase();
    }
  }, [user]);

  const checkSpotPurchase = async () => {
    setLoading(true);
    const response = await fetch("/api/teams/check-spots", {
      method: "POST",
      body: JSON.stringify({ userId: user?.id }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setHasSpots(data.hasSpots);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        {hasSpots ? (
          <TeamManagement />
        ) : (
          <Card className="max-w-2xl mx-auto p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">You must purchase at least one spot to access team management. Please register first.</p>
            <a href="/register" className="text-primary underline mt-2 inline-block">
              Go to Registration
            </a>
          </Card>
        )}
      </SignedIn>
    </div>
  );
}
