/**
 * JSON-LD — Organization + WebSite + Person (founder)
 * Без keyword-stuffing: только факты о продукте и основателе.
 */

export default function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://emlakhub.net/#organization",
        name: "Digital Emlak Hub",
        legalName: "Digital Emlak Hub",
        url: "https://emlakhub.net",
        logo: {
          "@type": "ImageObject",
          url: "https://emlakhub.net/landing/porsche-hero.jpg",
        },
        description:
          "Closed B2B analytics terminal for professional investors in government auctions in Azerbaijan. RosAktiv Hub for Russia is in development.",
        foundingDate: "2026",
        areaServed: [
          { "@type": "Country", name: "Azerbaijan" },
          { "@type": "Country", name: "Russia" },
        ],
        founder: { "@id": "https://emlakhub.net/#founder" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "jamalwork29@gmail.com",
          availableLanguage: ["Azerbaijani", "Russian", "English"],
        },
      },
      {
        "@type": "Person",
        "@id": "https://emlakhub.net/#founder",
        name: "Camal Huseynov",
        alternateName: ["Jamal Huseynov", "Camal Hüseynov"],
        jobTitle: "Founder",
        worksFor: { "@id": "https://emlakhub.net/#organization" },
        url: "https://emlakhub.net",
        email: "jamalwork29@gmail.com",
        nationality: "AZ",
        description:
          "Founder of Digital Emlak Hub — B2B analytics terminal for government auction lots.",
      },
      {
        "@type": "WebSite",
        "@id": "https://emlakhub.net/#website",
        url: "https://emlakhub.net",
        name: "Digital Emlak Hub",
        description:
          "B2B terminal for government auctions: risk analysis, repair estimates and net margin before the bid.",
        publisher: { "@id": "https://emlakhub.net/#organization" },
        inLanguage: ["az", "ru"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://emlakhub.net/#app",
        name: "Digital Emlak Hub",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://emlakhub.net",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "AZN",
          description: "Access by invitation / subscription",
        },
        creator: { "@id": "https://emlakhub.net/#founder" },
        publisher: { "@id": "https://emlakhub.net/#organization" },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
