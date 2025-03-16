// app/layout.tsx
import { ClerkProvider, SignedIn, UserButton } from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "@/components/ui/toaster";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full flex flex-col">
          <header className="bg-primary text-primary-foreground p-4 shadow-md">
            <nav className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
              <Link href="/">
                <Image
                  src="https://res.cloudinary.com/dazxax791/image/upload/v1741935050/hpzwqbwqxeyzgwmhy6zb.png"
                  alt="Grand Valley Athletic Society Logo"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </Link>
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-sm sm:text-base">
                <SignedIn>
                  <Link href="/" className="hover:text-accent">
                    Home
                  </Link>
                  <Link href="/register" className="hover:text-accent">
                    Register
                  </Link>
                  <Link href="/teams" className="hover:text-accent">
                    Teams
                  </Link>
                  <Link href="/sponsor" className="hover:text-accent">
                    Sponsor
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="bg-primary text-primary-foreground py-2 text-center text-sm sm:text-base">
            <p>© 2025 Grand Valley Athletic Society. All rights reserved.</p>
          </footer>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
