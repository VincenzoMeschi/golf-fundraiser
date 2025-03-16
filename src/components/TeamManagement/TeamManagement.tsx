"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import { Separator } from "../ui/separator";

type Team = {
  _id: string;
  name: string;
  isPrivate: boolean;
  creatorId: string;
  members: { spotId: string; registrationId: string }[];
  whitelist: string[];
};

type Spot = {
  spotId: string;
  name: string;
  phone: string;
  email: string;
  userId?: string;
};

export default function TeamManagement() {
  const { user } = useUser();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userSpots, setUserSpots] = useState<Spot[]>([]);
  const [allSpots, setAllSpots] = useState<Spot[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [whitelistEntry, setWhitelistEntry] = useState("");
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editIsPrivate, setEditIsPrivate] = useState<boolean>(false);
  const [editWhitelist, setEditWhitelist] = useState<string[]>([]);
  const [editTeamName, setEditTeamName] = useState<string>("");
  const [joinTeam, setJoinTeam] = useState<Team | null>(null);
  const [selectedJoinSpots, setSelectedJoinSpots] = useState<string[]>([]);
  const [originalWhitelist, setOriginalWhitelist] = useState<string[]>([]);
  const [openTeamId, setOpenTeamId] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    const response = await fetch("/api/teams");
    const data = await response.json();
    setTeams(data);
    if (selectedTeam) {
      const updatedTeam = data.find((t: Team) => t._id === selectedTeam._id);
      if (updatedTeam) {
        setSelectedTeam(updatedTeam);
      }
    }
  }, [selectedTeam]);

  const fetchUserSpots = useCallback(async () => {
    if (!user?.id) return;
    const response = await fetch("/api/teams/user-spots", {
      method: "POST",
      body: JSON.stringify({ userId: user.id }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    setUserSpots(data.spots || []);
  }, [user?.id]);

  const fetchAllSpots = useCallback(async () => {
    const response = await fetch("/api/teams/all-spots");
    const data = await response.json();
    setAllSpots(data.spots || []);
  }, []);

  useEffect(() => {
    fetchTeams();
    fetchUserSpots();
    fetchAllSpots();
  }, [fetchTeams, fetchAllSpots, fetchUserSpots]);

  const getSpotName = (spotId: string) => {
    const spot = allSpots.find((s) => s.spotId === spotId);
    return spot?.name || "Unknown";
  };

  const createTeam = async () => {
    if (selectedSpots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one spot to create a team",
        variant: "destructive",
      });
      return;
    }
    const response = await fetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({
        name: newTeamName,
        isPrivate,
        creatorId: user?.id,
        initialSpots: selectedSpots,
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      fetchTeams();
      fetchUserSpots();
      fetchAllSpots();
      setNewTeamName("");
      setIsPrivate(false);
      setSelectedSpots([]);
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: `Team "${newTeamName}" created successfully!`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const addSpotToTeam = async () => {
    if (!joinTeam || selectedJoinSpots.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one spot to join the team",
        variant: "destructive",
      });
      return;
    }

    if (joinTeam.members.length + selectedJoinSpots.length > 4) {
      toast({
        title: "Error",
        description: "Cannot exceed 4 total members in the team",
        variant: "destructive",
      });
      return;
    }

    for (const spotId of selectedJoinSpots) {
      const response = await fetch("/api/teams", {
        method: "PUT",
        body: JSON.stringify({ teamId: joinTeam._id, spotId, userId: user?.id }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || `Failed to add spot ${getSpotName(spotId)} to team`,
          variant: "destructive",
        });
        return;
      }
    }

    fetchTeams();
    fetchUserSpots();
    fetchAllSpots();
    setJoinTeam(null);
    setSelectedJoinSpots([]);
    toast({
      title: "Success",
      description: "Spots added to team successfully!",
    });
  };

  const removeSpotFromTeam = async (teamId: string, spotId: string) => {
    console.log(`Removing spot ${spotId} from team ${teamId} for user ${user?.id}`);
    const response = await fetch("/api/teams", {
      method: "PATCH",
      body: JSON.stringify({ teamId, spotId, userId: user?.id }),
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      fetchTeams();
      fetchUserSpots();
      fetchAllSpots();
      toast({
        title: "Success",
        description: "Spot removed from team successfully!",
      });
    } else {
      const error = await response.json();
      console.error(`Failed to remove spot: ${error.error}`);
      toast({
        title: "Error",
        description: error.error || "Failed to remove spot from team",
        variant: "destructive",
      });
    }
  };

  const whitelistUser = (teamId: string) => {
    if (!whitelistEntry) {
      toast({
        title: "Error",
        description: "Please enter an email or full name to whitelist",
        variant: "destructive",
      });
      return;
    }

    if (editWhitelist.some((entry) => entry.toLowerCase() === whitelistEntry.toLowerCase())) {
      toast({
        title: "Error",
        description: `${whitelistEntry} is already in the whitelist`,
        variant: "destructive",
      });
      return;
    }

    setEditWhitelist((prev) => [...prev, whitelistEntry]);
    setWhitelistEntry("");
    toast({
      title: "Success",
      description: `Added ${whitelistEntry} to whitelist (pending save)`,
    });
  };

  const removeWhitelistedEmail = (teamId: string, entry: string) => {
    setEditWhitelist((prev) => prev.filter((e) => e !== entry));
    toast({
      title: "Success",
      description: `Removed ${entry} from whitelist (pending save)`,
    });
  };

  const submitTeamEdits = async () => {
    if (!selectedTeam) return;

    console.log("Submitting edits:", {
      teamId: selectedTeam._id,
      userId: user?.id,
      isPrivate: editIsPrivate,
      name: editTeamName,
      whitelist: editWhitelist,
    });

    const response = await fetch("/api/teams", {
      method: "PUT",
      body: JSON.stringify({
        teamId: selectedTeam._id,
        userId: user?.id,
        isPrivate: editIsPrivate,
        name: editTeamName,
        whitelist: editWhitelist,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      await fetchTeams();
      const updatedTeam = teams.find((t) => t._id === selectedTeam._id);
      if (updatedTeam) {
        setSelectedTeam(updatedTeam);
        setEditTeamName(updatedTeam.name);
        setEditIsPrivate(updatedTeam.isPrivate);
        setEditWhitelist([...updatedTeam.whitelist]);
        setOriginalWhitelist([...updatedTeam.whitelist]);
      }
      toast({
        title: "Success",
        description: "Team updated successfully!",
      });
      setIsEditDialogOpen(false);
      setSelectedTeam(null);
    } else {
      const error = await response.json();
      toast({
        title: "Try Again",
        description: error.error || "No changes were made by the user.",
        variant: "destructive",
      });
    }
  };

  const toggleSpotSelection = (spotId: string) => {
    setSelectedSpots((prev) => (prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]));
  };

  const toggleJoinSpotSelection = (spotId: string) => {
    if (!joinTeam) return;
    const remainingCapacity = 4 - joinTeam.members.length;
    setSelectedJoinSpots((prev) => (prev.includes(spotId) ? prev.filter((id) => id !== spotId) : prev.length < remainingCapacity ? [...prev, spotId] : prev));
  };

  const filteredTeams = teams.filter((team) => {
    const teamNameMatch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const memberNameMatch = team.members.some((member) => getSpotName(member.spotId).toLowerCase().includes(searchTerm.toLowerCase()));
    return teamNameMatch || memberNameMatch;
  });

  const isWhitelisted = (team: Team) => {
    const availableSpots = userSpots.filter((s) => !teams.some((t) => t.members.some((m) => m.spotId === s.spotId)));
    return availableSpots.some((spot) => {
      const spotEmail = spot.email?.toLowerCase();
      const spotName = spot.name?.toLowerCase();
      return team.whitelist.some((entry) => entry.toLowerCase() === spotEmail || entry.toLowerCase() === spotName);
    });
  };

  const openEditDialog = (team: Team) => {
    setSelectedTeam(team);
    setEditIsPrivate(team.isPrivate);
    setEditWhitelist([...team.whitelist]);
    setEditTeamName(team.name);
    setOriginalWhitelist([...team.whitelist]);
    setIsEditDialogOpen(true);
  };

  const openJoinDialog = (team: Team) => {
    setJoinTeam(team);
    setSelectedJoinSpots([]);
  };

  const modifiedChanges =
    (selectedTeam && editTeamName !== selectedTeam.name ? 1 : 0) +
    (selectedTeam && editIsPrivate !== selectedTeam.isPrivate ? 1 : 0) +
    (selectedTeam && JSON.stringify(editWhitelist) !== JSON.stringify(originalWhitelist) ? 1 : 0);

  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-64 sm:h-80">
        <Image src="https://res.cloudinary.com/dazxax791/image/upload/v1741935869/jbr0murfxrtwat0ag41l.jpg" alt="Meadows Golf Course" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 px-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground drop-shadow-lg">Manage Your Teams</h1>
        </div>
      </section>

      <div className="container mx-auto px-4 py-4 sm:py-8 min-h-screen">
        <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6 text-primary sr-only">Team Management</h1>

        {/* Active Teams Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg sm:text-xl">Active Teams</CardTitle>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-sm sm:text-base px-3 py-1 sm:px-4 sm:py-2">Create Team</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">Create a Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="team-name" className="text-sm sm:text-base">
                        Team Name
                      </Label>
                      <Input id="team-name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team Name" className="w-full text-sm sm:text-base mt-1" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="private" checked={isPrivate} onCheckedChange={(checked) => setIsPrivate(checked as boolean)} />
                      <Label htmlFor="private" className="text-sm sm:text-base">
                        Private Team
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">Select Initial Spots</Label>
                      {userSpots
                        .filter((spot) => !teams.some((t) => t.members.some((m) => m.spotId === spot.spotId)))
                        .map((spot) => (
                          <div key={spot.spotId} className="flex items-center space-x-2">
                            <Checkbox checked={selectedSpots.includes(spot.spotId)} onCheckedChange={() => toggleSpotSelection(spot.spotId)} />
                            <Label className="text-sm sm:text-base">{spot.name}</Label>
                          </div>
                        ))}
                    </div>
                    <Button onClick={createTeam} className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base py-2">
                      Create Team
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <Separator className="my-2" />
            <div className="space-y-2">
              <Label htmlFor="search-teams" className="text-sm sm:text-base">
                Search Teams
              </Label>
              <Input
                id="search-teams"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by team name or member name"
                className="w-full text-sm sm:text-base mt-1"
              />
            </div>
            {/* Accordion for mobile, Table for desktop */}
            <div className="sm:hidden space-y-4">
              {filteredTeams.map((team) => (
                <details key={team._id} className="border rounded-lg overflow-hidden" open={openTeamId === team._id} onToggle={(e) => setOpenTeamId(e.currentTarget.open ? team._id : null)}>
                  <summary className="flex items-center justify-between p-3 sm:p-4 bg-gray-100 cursor-pointer hover:bg-gray-200">
                    <span className="text-sm sm:text-base font-semibold">{team.name}</span>
                    <span className="text-xs sm:text-sm">{team.members.length}/4 Members</span>
                  </summary>
                  <div className="p-4 bg-white space-y-2">
                    <p className="text-sm sm:text-base">
                      <strong>Type:</strong>
                      <p>{team.isPrivate ? "Private" : "Public"}</p>
                    </p>
                    <div className="text-sm sm:text-base">
                      <strong>Members:</strong>
                      <ul className="list-disc pt-1 space-y-1">
                        {team.members.map((member) => (
                          <li key={member.spotId} className="flex items-center justify-between">
                            <span>{getSpotName(member.spotId)}</span>
                            {(userSpots.some((s) => s.spotId === member.spotId) || team.creatorId === user?.id) && (
                              <button onClick={() => removeSpotFromTeam(team._id, member.spotId)} className="ml-2 text-red-500 underline hover:text-red-700 text-sm sm:text-base">
                                Remove
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <Dialog open={joinTeam?._id === team._id} onOpenChange={(open) => setJoinTeam(open ? team : null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 w-full sm:w-auto"
                            disabled={!userSpots.some((s) => !teams.some((t) => t.members.some((m) => m.spotId === s.spotId))) || team.members.length >= 4 || (team.isPrivate && !isWhitelisted(team))}>
                            Join
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">Join Team: {team.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-sm sm:text-base">Select Reservations (Max {joinTeam ? 4 - joinTeam.members.length - selectedJoinSpots.length : 0} more)</Label>
                              {userSpots
                                .filter((spot) => !teams.some((t) => t.members.some((m) => m.spotId === spot.spotId)))
                                .map((spot) => (
                                  <div key={spot.spotId} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={selectedJoinSpots.includes(spot.spotId)}
                                      onCheckedChange={() => toggleJoinSpotSelection(spot.spotId)}
                                      disabled={!selectedJoinSpots.includes(spot.spotId) && selectedJoinSpots.length >= (joinTeam ? 4 - joinTeam.members.length : 0)}
                                    />
                                    <Label className="text-sm sm:text-base">{spot.name}</Label>
                                  </div>
                                ))}
                            </div>
                            <Button onClick={addSpotToTeam} className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base py-2" disabled={selectedJoinSpots.length === 0}>
                              Submit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {team.creatorId === user?.id && (
                        <Dialog
                          open={isEditDialogOpen}
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) {
                              setSelectedTeam(null);
                            }
                          }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2 w-full sm:w-auto" onClick={() => openEditDialog(team)}>
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <div className="space-y-6">
                              {/* Team Details Section */}
                              <div className="space-y-4">
                                <h3 className="text-lg sm:text-xl font-semibold text-primary">Team Details</h3>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-team-name" className="text-sm sm:text-base">
                                    Team Name
                                  </Label>
                                  <Input
                                    id="edit-team-name"
                                    value={editTeamName}
                                    onChange={(e) => setEditTeamName(e.target.value)}
                                    placeholder="Enter team name"
                                    className="w-full text-sm sm:text-base mt-1"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch id="is-private" checked={editIsPrivate} onCheckedChange={(checked) => setEditIsPrivate(checked)} />
                                  <Label htmlFor="is-private" className="text-sm sm:text-base">
                                    Make Team Private
                                  </Label>
                                </div>
                              </div>
                              {/* Whitelist Section (if private) */}
                              {editIsPrivate && (
                                <div className="space-y-4">
                                  <h3 className="text-lg sm:text-xl font-semibold text-primary">Manage Whitelist</h3>
                                  <div className="space-y-2">
                                    <Label className="text-sm sm:text-base">Whitelisted Emails or Names</Label>
                                    {editWhitelist.length > 0 ? (
                                      <ul className="list-disc pl-5 space-y-1">
                                        {editWhitelist.map((entry) => {
                                          const isPendingAdd = !originalWhitelist.some((originalEntry) => originalEntry.toLowerCase() === entry.toLowerCase());
                                          return (
                                            <li key={entry} className={isPendingAdd ? "text-gray-400" : "text-foreground"}>
                                              {entry} {isPendingAdd && "(pending)"}
                                              <Button variant="link" className="ml-2 text-red-500 hover:text-red-700 text-xs sm:text-sm" onClick={() => removeWhitelistedEmail(team._id, entry)}>
                                                Remove
                                              </Button>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    ) : (
                                      <p className="text-sm sm:text-base text-muted-foreground">No whitelisted entries yet.</p>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      placeholder="Enter email or full name to whitelist"
                                      value={whitelistEntry}
                                      onChange={(e) => setWhitelistEntry(e.target.value)}
                                      className="w-full text-sm sm:text-base mt-1"
                                    />
                                    <Button onClick={() => whitelistUser(team._id)} className="bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base py-1 sm:py-2">
                                      Add
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {/* Submit Changes Button */}
                              <Button
                                onClick={submitTeamEdits}
                                disabled={modifiedChanges === 0}
                                className={`w-full ${modifiedChanges === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} text-white text-sm sm:text-base py-2`}>
                                Submit Changes
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </details>
              ))}
            </div>
            {/* Table for desktop */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm min-w-[100px]">Team Name</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[120px]">Members</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[80px]">Type</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[80px]">Members Count</TableHead>
                    <TableHead className="text-xs sm:text-sm min-w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team._id} className={team.creatorId === user?.id ? "bg-blue-100 hover:bg-blue-200" : ""}>
                      <TableCell className="font-bold text-xs sm:text-sm">{team.name}</TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        <div className="flex flex-col space-y-1">
                          {team.members.map((member) => (
                            <div key={member.spotId} className="inline-flex items-center whitespace-nowrap">
                              <span>{getSpotName(member.spotId)}</span>
                              {(userSpots.some((s) => s.spotId === member.spotId) || team.creatorId === user?.id) && (
                                <button onClick={() => removeSpotFromTeam(team._id, member.spotId)} className="ml-2 text-red-500 underline hover:text-red-700">
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">{team.isPrivate ? "Private" : "Public"}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{team.members.length}/4</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog open={joinTeam?._id === team._id} onOpenChange={(open) => setJoinTeam(open ? team : null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2"
                                disabled={
                                  !userSpots.some((s) => !teams.some((t) => t.members.some((m) => m.spotId === s.spotId))) || team.members.length >= 4 || (team.isPrivate && !isWhitelisted(team))
                                }>
                                Join
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl">Join Team: {team.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-sm sm:text-base">Select Reservations (Max {joinTeam ? 4 - joinTeam.members.length - selectedJoinSpots.length : 0} more)</Label>
                                  {userSpots
                                    .filter((spot) => !teams.some((t) => t.members.some((m) => m.spotId === spot.spotId)))
                                    .map((spot) => (
                                      <div key={spot.spotId} className="flex items-center space-x-2">
                                        <Checkbox
                                          checked={selectedJoinSpots.includes(spot.spotId)}
                                          onCheckedChange={() => toggleJoinSpotSelection(spot.spotId)}
                                          disabled={!selectedJoinSpots.includes(spot.spotId) && selectedJoinSpots.length >= (joinTeam ? 4 - joinTeam.members.length : 0)}
                                        />
                                        <Label className="text-sm sm:text-base">{spot.name}</Label>
                                      </div>
                                    ))}
                                </div>
                                <Button onClick={addSpotToTeam} className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base py-2" disabled={selectedJoinSpots.length === 0}>
                                  Submit
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                          {team.creatorId === user?.id && (
                            <Dialog
                              open={isEditDialogOpen}
                              onOpenChange={(open) => {
                                setIsEditDialogOpen(open);
                                if (!open) {
                                  setSelectedTeam(null);
                                }
                              }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="text-xs sm:text-sm px-2 py-1 sm:px-4 sm:py-2" onClick={() => openEditDialog(team)}>
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <div className="space-y-6">
                                  {/* Team Details Section */}
                                  <div className="space-y-4">
                                    <h3 className="text-lg sm:text-xl font-semibold text-primary">Team Details</h3>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-team-name" className="text-sm sm:text-base">
                                        Team Name
                                      </Label>
                                      <Input
                                        id="edit-team-name"
                                        value={editTeamName}
                                        onChange={(e) => setEditTeamName(e.target.value)}
                                        placeholder="Enter team name"
                                        className="w-full text-sm sm:text-base mt-1"
                                      />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch id="is-private" checked={editIsPrivate} onCheckedChange={(checked) => setEditIsPrivate(checked)} />
                                      <Label htmlFor="is-private" className="text-sm sm:text-base">
                                        Make Team Private
                                      </Label>
                                    </div>
                                  </div>
                                  {/* Whitelist Section (if private) */}
                                  {editIsPrivate && (
                                    <div className="space-y-4">
                                      <h3 className="text-lg sm:text-xl font-semibold text-primary">Manage Whitelist</h3>
                                      <div className="space-y-2">
                                        <Label className="text-sm sm:text-base">Whitelisted Emails or Names</Label>
                                        {editWhitelist.length > 0 ? (
                                          <ul className="list-disc pl-5 space-y-1">
                                            {editWhitelist.map((entry) => {
                                              const isPendingAdd = !originalWhitelist.some((originalEntry) => originalEntry.toLowerCase() === entry.toLowerCase());
                                              return (
                                                <li key={entry} className={isPendingAdd ? "text-gray-400" : "text-foreground"}>
                                                  {entry} {isPendingAdd && "(pending)"}
                                                  <Button variant="link" className="ml-2 text-red-500 hover:text-red-700 text-xs sm:text-sm" onClick={() => removeWhitelistedEmail(team._id, entry)}>
                                                    Remove
                                                  </Button>
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        ) : (
                                          <p className="text-sm sm:text-base text-muted-foreground">No whitelisted entries yet.</p>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          placeholder="Enter email or full name to whitelist"
                                          value={whitelistEntry}
                                          onChange={(e) => setWhitelistEntry(e.target.value)}
                                          className="w-full text-sm sm:text-base mt-1"
                                        />
                                        <Button onClick={() => whitelistUser(team._id)} className="bg-green-500 hover:bg-green-600 text-white text-sm sm:text-base py-1 sm:py-2">
                                          Add
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {/* Submit Changes Button */}
                                  <Button
                                    onClick={submitTeamEdits}
                                    disabled={modifiedChanges === 0}
                                    className={`w-full ${modifiedChanges === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"} text-white text-sm sm:text-base py-2`}>
                                    Submit Changes
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
