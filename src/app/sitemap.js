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
      url: "https://emlakhub.net/login",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: "https://emlakhub.net/register",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
