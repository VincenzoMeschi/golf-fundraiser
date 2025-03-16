"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { Slider } from "@/components/ui/slider";

type Sponsor = {
  _id: string;
  userId: string;
  name: string;
  price: number;
  logo: string;
  websiteLink: string;
};

export default function Sponsor() {
  const { user } = useUser();
  const { toast } = useToast();
  const [sponsor, setSponsor] = useState<Sponsor | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(200);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [editSponsor, setEditSponsor] = useState<Sponsor | null>(null);

  const fetchSponsor = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/sponsor?userId=${user.id}`);
      const data = await response.json();
      setSponsor(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching sponsor:", err);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSponsor();
  }, [fetchSponsor]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!name || !price || !logoFile || !websiteLink) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (price < 200) {
      toast({
        title: "Error",
        description: "Price must be at least $200",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", logoFile);
      formData.append("upload_preset", "golf_fundraiser");

      const uploadResponse = await fetch("https://api.cloudinary.com/v1_1/dazxax791/image/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadData.secure_url) {
        throw new Error("Failed to upload logo");
      }

      const logoUrl = uploadData.secure_url;

      const response = await fetch("/api/sponsor", {
        method: "POST",
        body: JSON.stringify({
          userId: user?.id,
          name,
          price,
          logo: logoUrl,
          websiteLink,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create sponsor");
      }

      toast({
        title: "Success",
        description: "Sponsor created successfully!",
      });
      fetchSponsor();
      setName("");
      setPrice(200);
      setLogoFile(null);
      setLogoPreview("");
      setWebsiteLink("");
    } catch (err) {
      console.error("Error creating sponsor:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to create sponsor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSponsorChange = (field: keyof Sponsor, value: string | number) => {
    if (!editSponsor) return;
    setEditSponsor({ ...editSponsor, [field]: value });
  };

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEditSponsor = async () => {
    if (!editSponsor || !editSponsor.name || !editSponsor.price || !editSponsor.websiteLink) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    if (editSponsor.price < 200) {
      toast({
        title: "Error",
        description: "Price must be at least $200",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let logoUrl = editSponsor.logo;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("upload_preset", "your_cloudinary_upload_preset");

        const uploadResponse = await fetch("https://api.cloudinary.com/v1_1/your_cloud_name/image/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadData.secure_url) {
          throw new Error("Failed to upload logo");
        }
        logoUrl = uploadData.secure_url;
      }

      const response = await fetch("/api/sponsor", {
        method: "PUT",
        body: JSON.stringify({
          userId: user?.id,
          name: editSponsor.name,
          price: editSponsor.price,
          logo: logoUrl,
          websiteLink: editSponsor.websiteLink,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update sponsor");
      }

      toast({
        title: "Success",
        description: "Sponsor updated successfully!",
      });
      fetchSponsor();
      setEditSponsor(null);
      setLogoFile(null);
      setLogoPreview("");
    } catch (err) {
      console.error("Error updating sponsor:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to update sponsor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background">
      {/* Hero Section with Background Image */}
      <section className="relative h-64 sm:h-80">
        <Image src="https://res.cloudinary.com/dazxax791/image/upload/v1741935541/wvjbv64sllc38p7y042e.webp" alt="Stadium View" fill className="object-cover opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 px-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground drop-shadow-lg">Sponsor the Golf Outing</h1>
        </div>
      </section>

      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div className="container mx-auto px-4 py-4 sm:py-8 w-full sm:w-[65%]">
          {loading && <p className="text-muted-foreground text-sm sm:text-base">Loading sponsor data...</p>}

          {sponsor ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Your Sponsorship</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                    <Image src={sponsor.logo} alt={`${sponsor.name} logo`} fill className="object-contain" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-semibold">{sponsor.name}</h3>
                    <p className="text-sm sm:text-base">
                      <strong>Price:</strong> ${sponsor.price.toLocaleString()}
                    </p>
                    <p className="text-sm sm:text-base">
                      <strong>Website:</strong>{" "}
                      <a href={sponsor.websiteLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {sponsor.websiteLink}
                      </a>
                    </p>
                  </div>
                </div>
                <Dialog open={editSponsor !== null} onOpenChange={(open) => setEditSponsor(open ? sponsor : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-sm sm:text-base px-2 py-1 sm:px-4 sm:py-2">
                      Edit Sponsor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Edit Sponsor</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="edit-name" className="text-sm sm:text-base">
                          Sponsor Name
                        </Label>
                        <Input
                          id="edit-name"
                          value={editSponsor?.name || ""}
                          onChange={(e) => handleEditSponsorChange("name", e.target.value)}
                          placeholder="Sponsor Name"
                          className="w-full text-sm sm:text-base mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-price" className="text-sm sm:text-base">
                          Price ($)
                        </Label>
                        <Input
                          id="edit-price"
                          type="number"
                          value={editSponsor?.price || 200}
                          onChange={(e) => handleEditSponsorChange("price", parseInt(e.target.value) || 200)}
                          min={200}
                          className="w-full text-sm sm:text-base mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-logo" className="text-sm sm:text-base">
                          Logo
                        </Label>
                        <Input id="edit-logo" type="file" accept="image/*" onChange={handleEditLogoChange} className="w-full text-sm sm:text-base mt-1" />
                        {(logoPreview || editSponsor?.logo) && (
                          <div className="mt-2">
                            <Image src={logoPreview || editSponsor?.logo || ""} alt="Logo Preview" width={80} height={80} className="object-contain sm:w-[100px] sm:h-[100px]" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="edit-website" className="text-sm sm:text-base">
                          Website Link
                        </Label>
                        <Input
                          id="edit-website"
                          value={editSponsor?.websiteLink || ""}
                          onChange={(e) => handleEditSponsorChange("websiteLink", e.target.value)}
                          placeholder="Website URL"
                          className="w-full text-sm sm:text-base mt-1"
                        />
                      </div>
                      <Button onClick={handleSubmitEditSponsor} className="w-full bg-green-500 hover:bg-green-600 text-sm sm:text-base py-2">
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Become a Sponsor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 grid grid-cols-1 gap-2 sm:gap-4">
                <div className="col-span-1">
                  <Label htmlFor="name" className="text-sm sm:text-base">
                    Sponsor Name
                  </Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Sponsor Name" className="w-full text-sm sm:text-base mt-1" />
                </div>
                <div>
                  <Label htmlFor="price" className="text-sm sm:text-base">
                    Price ($)
                  </Label>
                  <Slider id="price" min={200} max={1000} step={50} value={[price]} onValueChange={(value) => setPrice(value[0])} className="w-full mt-1 sm:mt-2" />
                  <p className="text-center mt-1 sm:mt-2 text-sm sm:text-base">${price.toLocaleString()}</p>
                </div>
                <div>
                  <Label htmlFor="website" className="text-sm sm:text-base">
                    Website Link
                  </Label>
                  <Input id="website" value={websiteLink} onChange={(e) => setWebsiteLink(e.target.value)} placeholder="Website URL" className="w-full text-sm sm:text-base mt-1" />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="logo" className="text-sm sm:text-base">
                    Logo
                  </Label>
                  <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className="w-full hover:cursor-pointer text-sm sm:text-base mt-1" />
                  {logoPreview && (
                    <div className="mt-2">
                      <Image src={logoPreview} alt="Logo Preview" width={80} height={80} className="object-contain sm:w-[100px] sm:h-[100px]" />
                    </div>
                  )}
                </div>
                <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90 col-span-1 text-sm sm:text-base py-2" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Sponsorship"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SignedIn>
    </div>
  );
}
