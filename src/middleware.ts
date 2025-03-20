import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // Define public routes that don't require authentication
  publicRoutes: ["/", "/api/webhook", "/sign-in", "/sign-up", "/not-found", "/sponsor"],
});

export const config = {
  matcher: [
    // Match all routes except static files, _next, and public files
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/admin(.*)",
    // Match all API routes
    "/(api|trpc)(.*)",
    // Explicitly match protected routes
    "/register(.*)",
    "/teams(.*)",
    "/sponsor(.*)",
  ],
};
