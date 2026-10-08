/** @type {import('next').MetadataRoute.Robots} */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/academy",
          "/support",
          "/how-it-works",
          "/login",
          "/profile",
          "/map",
          "/portfolio",
          "/watchlist",
          "/compare",
          "/alerts",
          "/documents",
          "/api",
        ],
      },
    ],
    sitemap: "https://emlakhub.net/sitemap.xml",
    host: "https://emlakhub.net",
  };
}
