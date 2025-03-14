/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "", // Leave empty for default HTTPS port (443)
        pathname: "/dazxax791/image/upload/**", // Match your Cloudinary account path
      },
    ],
  },
};

export default nextConfig;
