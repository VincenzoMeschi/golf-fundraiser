"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Shadcn Accordion components
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CircleAlert } from "lucide-react";

export default function Home() {
  const images = [
    {
      title: "Stadium View",
      url: "https://res.cloudinary.com/dazxax791/image/upload/v1741934404/popsilhfutww1ita2wjo.jpg",
    },
    {
      title: "Previous Year with Coaches",
      url: "https://res.cloudinary.com/dazxax791/image/upload/f_auto,q_auto/ku9ne1qkkqvdstpfso1d",
    },
    {
      title: "Golf Ball Close-Up",
      url: "https://res.cloudinary.com/dazxax791/image/upload/v1741935419/emybx2qs4km8ofeqeg5n.jpg",
    },
    {
      title: "Cookout Group",
      url: "https://res.cloudinary.com/dazxax791/image/upload/f_auto,q_auto/dhinuds7e2r87gsompld",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="h-64 sm:h-80 relative">
        <Image priority src="https://res.cloudinary.com/dazxax791/image/upload/v1742003002/bcwj55qveh68sgtw2u2i.jpg" alt="Golf Course" fill className="object-cover opacity-50" />
        <div className="absolute flex-col inset-0 flex items-center justify-center bg-black bg-opacity-35 text-center px-4">
          <h1 className="text-2xl sm:text-4xl font-bold text-primary-foreground mb-2 sm:mb-4">Golf Outing Fundraiser</h1>
          <p className="text-sm sm:text-base text-muted text-center max-w-xs sm:max-w-md mx-auto mb-4 sm:mb-6">
            Join us for our annual golf outing fundraiser! Sign up or sign in to register and manage your team.
          </p>
          <SignedOut>
            <div className="space-x-2 sm:space-x-4">
              <SignUpButton mode="modal" redirectUrl="/register">
                <Button className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 bg-primary hover:bg-accent">Sign Up</Button>
              </SignUpButton>
              <SignInButton mode="modal">
                <Button variant="outline" className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="flex flex-row gap-2 sm:gap-6">
              <Button className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 bg-primary hover:bg-accent">
                <Link href="/register">Register Now</Link>
              </Button>
              <Button className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 hover:bg-secondary hover:text-secondary-foreground bg-secondary-foreground text-secondary">
                <Link href="/sponsor">Sponsor a Hole</Link>
              </Button>
            </div>
          </SignedIn>
        </div>
      </section>

      {/* About Section */}
      <section className="py-8 sm:py-12 w-full sm:w-[65%] mx-auto">
        <div className="container mx-auto px-4">
          <Alert className="mb-4 bg-secondary">
            <CircleAlert className="h-4 w-4" />
            <AlertTitle className="font">READ ME: Geting Started</AlertTitle>
            <AlertDescription className="pt-2">
              Here’s what you need to know:
              <ul className="list-disc pl-5 pt-2 space-y-2">
                {" "}
                <li>
                  <span className="font-bold">If you know your four golfing partners:</span> You can create a <span className="italic">private team</span> just for your group. When setting up a
                  private team, you can <span className="italic">whitelist</span> your team by adding the names or emails of your friends, so only they can join. <br /> &nbsp;&nbsp;&nbsp;&nbsp;
                  <span className="font-bold">Important:</span> You should only make a team private if you’re reserving all four spots.{" "}
                </li>{" "}
                <li>
                  <span className="font-bold">If you’re signing up with fewer than four people (like a duo or trio):</span> You can either create a <span className="italic">public team</span> that
                  others can join, or join an existing public team to fill out the group. This way, everyone gets to enjoy the day on the course!{" "}
                </li>{" "}
                <li>
                  <span className="font-bold">Need help?</span> If you run into any trouble or have questions, don’t hesitate to give Vinny a call at 630-967-4286—he’s happy to help you get set up.{" "}
                </li>{" "}
              </ul>{" "}
              <br /> Let’s get ready for a great golf outing!
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-3xl font-bold text-primary text-center">44th Annual GVSU Football Alumni Golf Outing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <p className="text-sm sm:text-base text-muted-foreground">Alumni Events</p>
                <Separator className="my-2" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">Date and Time</h3>
                <p className="text-sm sm:text-base">
                  <strong>Date:</strong> Saturday, June 21, 2025
                </p>
                <p className="text-sm sm:text-base">
                  <strong>Time:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm sm:text-base">
                  <li>NOON: Registration and open practice range</li>
                  <li>1:30 p.m.: Shotgun Start</li>
                  <li>6:00 p.m.: Post-Golf Awards, meal, beverages, raffle, awards</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">Description</h3>
                <p className="text-sm sm:text-base">
                  Join football alumni and friends at the 44th Annual Football Alumni Golf Outing for a day on the green followed by a meal, drinks, and post-golf awards. The best dressed team at the
                  outing will win a complimentary foursome in the 2025 outing!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                <SignedOut>
                  <div className="space-x-2 sm:space-x-4">
                    <SignUpButton mode="modal" redirectUrl="/register">
                      <Button className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 bg-primary hover:bg-accent">Sign Up</Button>
                    </SignUpButton>
                    <SignInButton mode="modal">
                      <Button variant="outline" className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3">
                        Sign In
                      </Button>
                    </SignInButton>
                  </div>
                </SignedOut>
                <SignedIn>
                  <div className="flex flex-row gap-2 sm:gap-6">
                    <Button className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 bg-primary hover:bg-accent">
                      <Link href="/register">Register Now</Link>
                    </Button>
                    <Button className="text-sm sm:text-base px-4 py-2 sm:px-6 sm:py-3 hover:bg-secondary hover:text-secondary-foreground bg-secondary-foreground text-secondary">
                      <Link href="/sponsor">Sponsor a Hole</Link>
                    </Button>
                  </div>
                </SignedIn>
              </div>

              <Separator className="my-2" />

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">Details</h3>
                <p className="text-sm sm:text-base">
                  <strong>Attire:</strong> Golf/Casual/Laker Gear
                </p>
                <p className="text-sm sm:text-base">
                  <strong>Cost:</strong> $150 per person - includes 18 holes and cart, range balls, brats, hot dogs, beverages, post-golf meal, and awards!
                </p>
                <p className="text-sm sm:text-base">
                  <strong>Hole Sponsor:</strong> $200 hole sponsorship(s) available
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-semibold">Location/Map</h3>
                <p className="text-sm sm:text-base">The Meadows Golf Course / 4645 W Campus Dr. Allendale, MI 49401</p>
              </div>

              <div className="text-center">
                <p className="text-sm sm:text-base text-muted-foreground">All proceeds benefit the GVSU Football Program.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-8 sm:py-12 w-full sm:w-[65%] mx-auto">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl sm:text-3xl font-bold text-primary text-center">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm sm:text-base">How do I register for the golf outing?</AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    To register, sign in or sign up on the homepage, then navigate to the &quot;Register&quot; page. Select the number of spots you want to purchase, fill in the required details
                    (name, phone, email), and proceed to payment. Each spot costs $150.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm sm:text-base">How do I manage my team?</AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    After purchasing spots, go to the &quot;Teams&quot; page to create or join a team. You can add or remove spots from your team, and team creators can edit team details or manage a
                    whitelist if the team is private.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-sm sm:text-base">How can I sponsor a hole?</AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    Visit the &quot;Sponsor&quot; page after signing in, enter your sponsor details (name, price, logo, website), and submit. Hole sponsorships are available for $200 each, supporting
                    the GVSU Football Program.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-sm sm:text-base">What happens after I complete payment?</AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    After payment, your spots will be reserved, and you’ll be redirected to the &quot;Register&quot; page to view your purchased spots. You can then manage your team or edit details as
                    needed.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-sm sm:text-base">Need additional help or support?</AccordionTrigger>
                  <AccordionContent className="text-sm sm:text-base">
                    For all event related inquireies, contact{" "}
                    <a className="underline" href="mailto:schmidtk@gvsu.edu">
                      schmidtk@gvsu.edu
                    </a>{" "}
                    and with any technical support regarding the website, contact{" "}
                    <a className="underline" href="mailto:vinnymeschi@gmail.com">
                      vinnymeschi@gmail.com
                    </a>{" "}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto sm:w-[65%] px-4">
          <h2 className="text-xl sm:text-3xl font-bold text-primary mb-4 sm:mb-8 text-center">Event Highlights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
