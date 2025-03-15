"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type SpotDetails = {
  spotId?: string;
  name: string;
  phone: string;
  email: string;
  userId?: string;
};

type Team = {
  _id: string;
  name: string;
  members: { spotId: string; registrationId: string }[];
};

type SortConfig = {
  key: keyof SpotDetails;
  direction: "asc" | "desc";
};

export default function Register() {
  const { user } = useUser();
  const [spots, setSpots] = useState(1);
  const [donation, setDonation] = useState(150);
  const [spotDetails, setSpotDetails] = useState<SpotDetails[]>([{ name: "", phone: "", email: user?.primaryEmailAddress?.emailAddress || "" }]);
  const [purchasedSpots, setPurchasedSpots] = useState<SpotDetails[]>([]);
  const [editedSpot, setEditedSpot] = useState<SpotDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalSpots, setTotalSpots] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });
  const [teams, setTeams] = useState<Team[]>([]); // Store team data
  const searchParams = useSearchParams();

  const fetchTeams = useCallback(async () => {
    const response = await fetch("/api/teams");
    const data = await response.json();
    setTeams(data || []);
  }, []);

  const fetchPurchasedSpots = useCallback(
    async (isPolling = false) => {
      if (!user?.id) return;
      const response = await fetch("/api/teams/user-spots", {
        method: "POST",
        body: JSON.stringify({ userId: user.id }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      console.log(`Fetched purchased spots for user ${user.id}:`, data.spots);
      setPurchasedSpots(data.spots || []);
      setTotalSpots(data.spots.reduce((sum: number) => sum + 1, 0));
      if (isPolling && data.spots.length > 0) {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (user) {
      fetchPurchasedSpots();
      fetchTeams(); // Fetch teams when the user is logged in
    }
  }, [user, fetchPurchasedSpots, fetchTeams]);

  useEffect(() => {
    if (searchParams.get("success") === "true" && user) {
      setLoading(true);
      const interval = setInterval(() => {
        fetchPurchasedSpots(true);
        fetchTeams(); // Refresh teams on polling
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [searchParams, fetchPurchasedSpots, fetchTeams, user]);

  const handleSpotChange = (index: number, field: keyof SpotDetails, value: string) => {
    const newSpotDetails = [...spotDetails];
    newSpotDetails[index] = { ...newSpotDetails[index], [field]: value };
    setSpotDetails(newSpotDetails);
  };

  const handleSpotsChange = (value: number) => {
    const newTotal = totalSpots + value;
    if (newTotal > 4) {
      alert(`Cannot add ${value} spot(s). You already have ${totalSpots}, and the maximum is 4.`);
      return;
    }
    setSpots(value);
    const newSpotDetails = [...spotDetails];
    if (value > newSpotDetails.length) {
      for (let i = newSpotDetails.length; i < value; i++) {
        newSpotDetails.push({ name: "", phone: "", email: "" });
      }
    } else {
      newSpotDetails.length = value;
    }
    setSpotDetails(newSpotDetails);
  };

  const handleCheckout = async () => {
    if (donation < 150) {
      setDonation(150);
    } else {
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          spots,
          donation,
          userId: user?.id,
          spotDetails,
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to initiate payment");
        return;
      }
      const { url } = await response.json();
      window.location.href = url;
    }
  };

  const handleEditSpotChange = (field: keyof SpotDetails, value: string) => {
    if (!editedSpot) return;
    setEditedSpot({ ...editedSpot, [field]: value });
  };

  const handleSubmitEditSpot = async () => {
    if (!editedSpot || !editedSpot.spotId) return;

    const response = await fetch("/api/teams/edit-spot", {
      method: "PUT",
      body: JSON.stringify({ userId: user?.id, spotId: editedSpot.spotId, updatedDetails: editedSpot }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      fetchPurchasedSpots();
      fetchTeams(); // Refresh teams after editing spot
      setEditedSpot(null); // Close dialog
    } else {
      const error = await response.json();
      alert(error.error || "Failed to update spot");
    }
  };

  const filteredRegistrations = purchasedSpots
    .filter((spot) => {
      const nameMatch = spot.name.toLowerCase().includes(searchTerm.toLowerCase());
      const phoneMatch = spot.phone.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = spot.email.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || phoneMatch || emailMatch;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ""; // Fallback to empty string if undefined
      const bValue = b[sortConfig.key] ?? ""; // Fallback to empty string if undefined
      if (sortConfig.direction === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    });

  // Function to get the team name for a spot
  const getTeamNameForSpot = (spotId: string | undefined) => {
    if (!spotId) return "Not Assigned";
    const team = teams.find((t) => t.members.some((m) => m.spotId === spotId));
    return team ? team.name : "Not Assigned";
  };

  const handleSort = (key: keyof SpotDetails) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="bg-background">
      {/* Hero Section with Background Image */}
      <section className="relative h-64">
        <Image src="https://res.cloudinary.com/dazxax791/image/upload/v1741935541/wvjbv64sllc38p7y042e.webp" alt="Stadium View" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <h1 className="text-4xl font-bold text-primary-foreground drop-shadow-lg">Register for Golf Outing</h1>
        </div>
      </section>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          {loading && <p className="text-muted-foreground">Loading purchased spots...</p>}

          <div className="grid grid-cols-1 md:grid-cols-[40%_1fr] gap-6">
            {/* Purchase Spots Card */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Spots</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="spots">Number of Spots</Label>
                    <Input id="spots" type="number" min={1} max={4 - totalSpots} value={spots} onChange={(e) => handleSpotsChange(parseInt(e.target.value))} className="w-full" />
                    <p className="text-sm text-muted-foreground mt-1">Current total: {totalSpots}/4</p>
                  </div>
                  <div>
                    <Label htmlFor="donation">Donation per Spot ($150 min)</Label>
                    <Input id="donation" type="number" min={150} value={donation} onChange={(e) => setDonation(parseInt(e.target.value))} className="w-full" />
                  </div>
                </div>
                <div className="space-y-4">
                  {spotDetails.map((spot, index) => (
                    <div key={index} className="space-y-2 p-4 bg-muted rounded-md border-l-4 border-primary">
                      <h3 className="font-semibold text-primary">Spot {totalSpots + index + 1}</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`name-${index}`}>Name</Label>
                          <Input id={`name-${index}`} value={spot.name} onChange={(e) => handleSpotChange(index, "name", e.target.value)} placeholder="Full Name" className="w-full" />
                        </div>
                        <div>
                          <Label htmlFor={`phone-${index}`}>Phone</Label>
                          <Input id={`phone-${index}`} value={spot.phone} onChange={(e) => handleSpotChange(index, "phone", e.target.value)} placeholder="Phone Number" className="w-full" />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input id={`email-${index}`} type="email" value={spot.email} onChange={(e) => handleSpotChange(index, "email", e.target.value)} placeholder="Email" className="w-full" />
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={handleCheckout} className="w-full bg-primary hover:bg-primary/90">
                  {donation >= 150 ? `Proceed to Payment (\$${spots * donation})` : "Too Low. Click To Update"}
                </Button>
              </CardContent>
            </Card>

            {/* Your Purchased Spots and Registrations Card */}
            <Card>
              <CardHeader>
                <CardTitle>Your Purchased Spots ({purchasedSpots.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {purchasedSpots.length === 0 ? (
                  <p className="text-muted-foreground">No spots purchased yet.</p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="search-registrations">Search Your Registrations</Label>
                      <Input id="search-registrations" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, phone, or email" className="w-full" />
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                            Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("phone")} className="cursor-pointer">
                            Phone {sortConfig.key === "phone" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                            Email {sortConfig.key === "email" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead>Team</TableHead> {/* New column for team name */}
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegistrations.map((spot) => (
                          <TableRow key={spot.spotId}>
                            <TableCell>{spot.name}</TableCell>
                            <TableCell>{spot.phone}</TableCell>
                            <TableCell>{spot.email}</TableCell>
                            <TableCell>{getTeamNameForSpot(spot.spotId)}</TableCell> {/* Display team name */}
                            <TableCell>
                              <Dialog open={editedSpot?.spotId === spot.spotId} onOpenChange={(open) => setEditedSpot(open ? { ...spot } : null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Edit Spot: {spot.name}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-name">Name</Label>
                                      <Input id="edit-name" value={editedSpot?.name || ""} onChange={(e) => handleEditSpotChange("name", e.target.value)} placeholder="Name" className="w-full" />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-phone">Phone</Label>
                                      <Input id="edit-phone" value={editedSpot?.phone || ""} onChange={(e) => handleEditSpotChange("phone", e.target.value)} placeholder="Phone" className="w-full" />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-email">Email</Label>
                                      <Input id="edit-email" value={editedSpot?.email || ""} onChange={(e) => handleEditSpotChange("email", e.target.value)} placeholder="Email" className="w-full" />
                                    </div>
                                    <Button onClick={handleSubmitEditSpot} className="w-full bg-green-500 hover:bg-green-600">
                                      Submit Changes
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SignedIn>
    </div>
  );
}
