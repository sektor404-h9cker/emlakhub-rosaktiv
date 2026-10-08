/** @type {import('next').MetadataRoute.Sitemap} */
export default function sitemap() {
  const lastModified = new Date();
  return [
    {
      url: "https://emlakhub.net/",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://emlakhub.net/register",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: "https://emlakhub.net/legal/partners",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: "https://emlakhub.net/legal/terms",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
