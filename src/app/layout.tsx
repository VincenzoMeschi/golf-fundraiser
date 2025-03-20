import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/app/Navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Golf Outing App",
  description: "Manage your golf teams and spots",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full">
        <body className="h-full flex flex-col">
          <Navbar />
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
