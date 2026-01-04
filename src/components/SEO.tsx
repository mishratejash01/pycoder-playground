import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string; 
}

export const SEO = ({ title, description, url = 'https://codevo.co.in', image = '/og-image.png' }: SEOProps) => {
  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title} | Codevo</title>
      <meta name="description" content={description} />
      
      {/* Social Media (Open Graph) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Structured Data for Organization (Helps with Sitelinks) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Codevo",
          "url": "https://codevo.co.in",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://codevo.co.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};
