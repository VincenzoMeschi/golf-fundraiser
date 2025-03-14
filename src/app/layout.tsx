// app/layout.tsx
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full flex flex-col">
          <header className="bg-primary text-primary-foreground p-4 shadow-md">
            <nav className="container mx-auto flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Image
                  src="https://res.cloudinary.com/dazxax791/image/upload/v1741935050/hpzwqbwqxeyzgwmhy6zb.png"
                  alt="Grand Valley Athletic Society Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
                <Link href="/" className="text-xl font-bold">
                  Golf Fundraiser
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <SignedIn>
                  <Link href="/register" className="hover:text-accent">
                    Register
                  </Link>
                  <Link href="/teams" className="hover:text-accent">
                    Teams
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-primary text-primary-foreground py-4 text-center">
            <p>© 2025 Grand Valley Athletic Society. All rights reserved.</p>
          </footer>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
