// app/page.tsx
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const images = [
    {
      title: "Stadium View",
      url: "https://res.cloudinary.com/dazxax791/image/upload/v1741934404/popsilhfutww1ita2wjo.jpg", // Upload to Cloudinary and replace
    },
    {
      title: "Previous Year with Coaches",
      url: "https://res.cloudinary.com/dazxax791/image/upload/f_auto,q_auto/ku9ne1qkkqvdstpfso1d",
    },
    {
      title: "Golf Ball Close-Up",
      url: "https://res.cloudinary.com/dazxax791/image/upload/v1741935419/emybx2qs4km8ofeqeg5n.jpg", // Upload to Cloudinary and replace
    },
    {
      title: "Cookout Group",
      url: "https://res.cloudinary.com/dazxax791/image/upload/f_auto,q_auto/dhinuds7e2r87gsompld",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="h-80 relative">
        <Image src="https://res.cloudinary.com/dazxax791/image/upload/v1742003002/bcwj55qveh68sgtw2u2i.jpg" alt="Golf Course" fill className="object-cover opacity-50" />
        <div className="absolute flex-col inset-0 flex items-center justify-center bg-black bg-opacity-35">
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">Golf Outing Fundraiser</h1>
          <p className="text-muted text-center max-w-md mx-auto mb-6">Join us for our annual golf outing fundraiser! Sign up or sign in to register and manage your team.</p>
          <SignedOut>
            <div className="space-x-4">
              <SignInButton mode="modal">
                <Button size="lg" className="bg-primary hover:bg-accent">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal" redirectUrl="/register">
                <Button size="lg" variant="outline">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex gap-6">
              <Button asChild size="lg" className="bg-primary hover:bg-accent">
                <Link href="/register">Register Now</Link>
              </Button>
              <Button asChild size="lg" className="hover:bg-secondary hover:text-secondary-foreground bg-secondary-foreground text-secondary">
                <Link href="/sponsor">Sponsor a Hole</Link>
              </Button>
            </div>
          </SignedIn>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-primary mb-8 text-center">Event Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {images.map((image) => (
              <div key={image.title} className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                <Image src={image.url} alt={image.title} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
