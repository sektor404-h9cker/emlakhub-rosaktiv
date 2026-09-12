/** @type {import('next').MetadataRoute.Robots} */
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/academy", "/support", "/how-it-works", "/login", "/register"],
      },
    ],
    sitemap: "https://emlakhub.net/sitemap.xml",
    host: "https://emlakhub.net",
  };
}
