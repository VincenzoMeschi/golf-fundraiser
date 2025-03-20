"use client";

import { useState, useEffect } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Registration = {
  _id: string;
  userId: string;
  paymentStatus: string;
  spotDetails: {
    spotId: string;
    name: string;
    phone: string;
    email: string;
  }[];
};

type Team = {
  _id: string;
  name: string;
  isPrivate: boolean;
  creatorId: string;
  members: { spotId: string; registrationId: string }[];
};

type Sponsor = {
  _id: string;
  userId: string;
  name: string;
  price: number;
  logo: string;
  websiteLink: string;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

export default function AdminDashboard() {
  const { user } = useUser();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({
    paidUsers: "",
    reservations: "",
    teams: "",
    sponsors: "",
  });
  const [currentPage, setCurrentPage] = useState({
    paidUsers: 1,
    reservations: 1,
    teams: 1,
    sponsors: 1,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "",
    direction: "asc",
  });
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Check if user is admin
      const isAdmin = user.publicMetadata?.role === "admin";
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      try {
        // Fetch registrations
        const regResponse = await fetch("/api/admin/registrations");
        const regData = await regResponse.json();
        setRegistrations(regData || []);

        // Fetch teams
        const teamResponse = await fetch("/api/teams");
        const teamData = await teamResponse.json();
        setTeams(teamData || []);

        // Fetch sponsors
        const sponsorResponse = await fetch("/api/admin/sponsors");
        const sponsorData = await sponsorResponse.json();
        setSponsors(sponsorData || []);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter and sort paid registrations
  const paidRegistrations = registrations.filter((reg) => reg.paymentStatus === "completed").filter((reg) => reg.userId.toLowerCase().includes(searchTerms.paidUsers.toLowerCase()));
  const sortedPaidRegistrations = [...paidRegistrations].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key as keyof Registration] || "";
    const bValue = b[sortConfig.key as keyof Registration] || "";
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === "asc" ? 1 : -1;
  });
  const paginatedPaidRegistrations = sortedPaidRegistrations.slice((currentPage.paidUsers - 1) * itemsPerPage, currentPage.paidUsers * itemsPerPage);

  // Filter and sort reservations
  const allReservations = registrations.flatMap((reg) =>
    reg.spotDetails.map((spot) => ({
      ...spot,
      userId: reg.userId, // Add userId to each spot for display
      paymentStatus: reg.paymentStatus,
    }))
  );
  const filteredReservations = allReservations.filter((spot) =>
    [spot.name, spot.phone, spot.email, spot.userId].some((field) => field?.toLowerCase().includes(searchTerms.reservations.toLowerCase()))
  );
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key as keyof (typeof allReservations)[number]] || "";
    const bValue = b[sortConfig.key as keyof (typeof allReservations)[number]] || "";
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === "asc" ? 1 : -1;
  });
  const paginatedReservations = sortedReservations.slice((currentPage.reservations - 1) * itemsPerPage, currentPage.reservations * itemsPerPage);

  // Filter and sort teams
  const filteredTeams = teams.filter((team) => team.name.toLowerCase().includes(searchTerms.teams.toLowerCase()) || team.creatorId.toLowerCase().includes(searchTerms.teams.toLowerCase()));
  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key as keyof Team] || "";
    const bValue = b[sortConfig.key as keyof Team] || "";
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === "asc" ? 1 : -1;
  });
  const paginatedTeams = sortedTeams.slice((currentPage.teams - 1) * itemsPerPage, currentPage.teams * itemsPerPage);

  // Filter and sort sponsors
  const filteredSponsors = sponsors.filter(
    (sponsor) => sponsor.name.toLowerCase().includes(searchTerms.sponsors.toLowerCase()) || sponsor.userId.toLowerCase().includes(searchTerms.sponsors.toLowerCase())
  );
  const sortedSponsors = [...filteredSponsors].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key as keyof Sponsor] || "";
    const bValue = b[sortConfig.key as keyof Sponsor] || "";
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }
    return sortConfig.direction === "asc" ? 1 : -1;
  });
  const paginatedSponsors = sortedSponsors.slice((currentPage.sponsors - 1) * itemsPerPage, currentPage.sponsors * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (section: keyof typeof currentPage, page: number) => {
    setCurrentPage((prev) => ({ ...prev, [section]: page }));
  };

  // If not signed in, redirect to sign-in
  if (!user) {
    return <RedirectToSignIn />;
  }

  // If not admin, show unauthorized message
  const isAdmin = user.publicMetadata?.role === "admin";
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Unauthorized</h1>
        <p className="text-muted-foreground">You do not have access to this dashboard.</p>
      </div>
    );
  }

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <div className="flex items-center gap-2">
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        {loading ? (
          <p className="text-muted-foreground">Loading data...</p>
        ) : (
          <div className="space-y-8">
            {/* Paid Users */}
            <Card>
              <CardHeader>
                <CardTitle className="pb-4">Users Who Paid ({paidRegistrations.length})</CardTitle>
                <Input
                  placeholder="Search by User ID..."
                  value={searchTerms.paidUsers}
                  onChange={(e) => setSearchTerms((prev) => ({ ...prev, paidUsers: e.target.value }))}
                  className="w-full max-w-sm"
                />
              </CardHeader>
              <CardContent>
                {paidRegistrations.length === 0 ? (
                  <p className="text-muted-foreground">No paid registrations found.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => handleSort("userId")} className="cursor-pointer">
                            User ID {sortConfig.key === "userId" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("spotDetails")} className="cursor-pointer">
                            Spots Purchased {sortConfig.key === "spotDetails" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPaidRegistrations.map((reg) => (
                          <TableRow key={reg._id}>
                            <TableCell>{reg.userId}</TableCell>
                            <TableCell>{reg.spotDetails.length}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between mt-2">
                      <Button onClick={() => handlePageChange("paidUsers", currentPage.paidUsers - 1)} disabled={currentPage.paidUsers === 1}>
                        Previous
                      </Button>
                      <span>
                        Page {currentPage.paidUsers} of {Math.ceil(paidRegistrations.length / itemsPerPage)}
                      </span>
                      <Button onClick={() => handlePageChange("paidUsers", currentPage.paidUsers + 1)} disabled={currentPage.paidUsers * itemsPerPage >= paidRegistrations.length}>
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* All Reservations */}
            <Card>
              <CardHeader>
                <CardTitle className="pb-4">All Reservations ({allReservations.length})</CardTitle>
                <Input
                  placeholder="Search by Name, Phone, Email, or User ID..."
                  value={searchTerms.reservations}
                  onChange={(e) => setSearchTerms((prev) => ({ ...prev, reservations: e.target.value }))}
                  className="w-full max-w-sm mt-2"
                />
              </CardHeader>
              <CardContent>
                {allReservations.length === 0 ? (
                  <p className="text-muted-foreground">No reservations found.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => handleSort("userId")} className="cursor-pointer">
                            User ID {sortConfig.key === "userId" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                            Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("phone")} className="cursor-pointer">
                            Phone {sortConfig.key === "phone" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("email")} className="cursor-pointer">
                            Email {sortConfig.key === "email" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("paymentStatus")} className="cursor-pointer">
                            Payment Status {sortConfig.key === "paymentStatus" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedReservations.map((spot) => (
                          <TableRow key={spot.spotId}>
                            <TableCell>{spot.userId}</TableCell>
                            <TableCell>{spot.name}</TableCell>
                            <TableCell>{spot.phone}</TableCell>
                            <TableCell>{spot.email}</TableCell>
                            <TableCell>{spot.paymentStatus}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between mt-2">
                      <Button onClick={() => handlePageChange("reservations", currentPage.reservations - 1)} disabled={currentPage.reservations === 1}>
                        Previous
                      </Button>
                      <span>
                        Page {currentPage.reservations} of {Math.ceil(allReservations.length / itemsPerPage)}
                      </span>
                      <Button onClick={() => handlePageChange("reservations", currentPage.reservations + 1)} disabled={currentPage.reservations * itemsPerPage >= allReservations.length}>
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* All Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="pb-4">All Teams ({teams.length})</CardTitle>
                <Input
                  placeholder="Search by Name or Creator ID..."
                  value={searchTerms.teams}
                  onChange={(e) => setSearchTerms((prev) => ({ ...prev, teams: e.target.value }))}
                  className="w-full max-w-sm mt-2"
                />
              </CardHeader>
              <CardContent>
                {teams.length === 0 ? (
                  <p className="text-muted-foreground">No teams found.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                            Team Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("isPrivate")} className="cursor-pointer">
                            Type {sortConfig.key === "isPrivate" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("creatorId")} className="cursor-pointer">
                            Creator ID {sortConfig.key === "creatorId" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("members")} className="cursor-pointer">
                            Members {sortConfig.key === "members" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTeams.map((team) => (
                          <TableRow key={team._id}>
                            <TableCell>{team.name}</TableCell>
                            <TableCell>{team.isPrivate ? "Private" : "Public"}</TableCell>
                            <TableCell>{team.creatorId}</TableCell>
                            <TableCell>
                              <ul>
                                {team.members.map((member, i) => {
                                  return <li key={i}>{member.registrationId}</li>;
                                })}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between mt-2">
                      <Button onClick={() => handlePageChange("teams", currentPage.teams - 1)} disabled={currentPage.teams === 1}>
                        Previous
                      </Button>
                      <span>
                        Page {currentPage.teams} of {Math.ceil(teams.length / itemsPerPage)}
                      </span>
                      <Button onClick={() => handlePageChange("teams", currentPage.teams + 1)} disabled={currentPage.teams * itemsPerPage >= teams.length}>
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* All Sponsors */}
            <Card>
              <CardHeader>
                <CardTitle className="pb-4">All Sponsors ({sponsors.length})</CardTitle>
                <Input
                  placeholder="Search by Name or User ID..."
                  value={searchTerms.sponsors}
                  onChange={(e) => setSearchTerms((prev) => ({ ...prev, sponsors: e.target.value }))}
                  className="w-full max-w-sm mt-2"
                />
              </CardHeader>
              <CardContent>
                {sponsors.length === 0 ? (
                  <p className="text-muted-foreground">No sponsors found.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead onClick={() => handleSort("userId")} className="cursor-pointer">
                            User ID {sortConfig.key === "userId" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("name")} className="cursor-pointer">
                            Name {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("price")} className="cursor-pointer">
                            Price {sortConfig.key === "price" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("logo")} className="cursor-pointer">
                            Logo URL {sortConfig.key === "logo" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                          <TableHead onClick={() => handleSort("websiteLink")} className="cursor-pointer">
                            Website {sortConfig.key === "websiteLink" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSponsors.map((sponsor) => (
                          <TableRow key={sponsor._id}>
                            <TableCell>{sponsor.userId}</TableCell>
                            <TableCell>{sponsor.name}</TableCell>
                            <TableCell>${sponsor.price.toLocaleString()}</TableCell>
                            <TableCell>{sponsor.logo}</TableCell>
                            <TableCell>
                              <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                {sponsor.websiteLink}
                              </a>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-between mt-2">
                      <Button onClick={() => handlePageChange("sponsors", currentPage.sponsors - 1)} disabled={currentPage.sponsors === 1}>
                        Previous
                      </Button>
                      <span>
                        Page {currentPage.sponsors} of {Math.ceil(sponsors.length / itemsPerPage)}
                      </span>
                      <Button onClick={() => handlePageChange("sponsors", currentPage.sponsors + 1)} disabled={currentPage.sponsors * itemsPerPage >= sponsors.length}>
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
