import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({ 
  title, 
  description, 
  name = 'The Grand Store', 
  type = 'website', 
  image, 
  url, 
  schema 
}) {
  const siteUrl = import.meta.env.VITE_FRONTEND_URL || 'https://grandstoreglobal.com';
  const currentUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;
  const canonicalUrl = currentUrl.split('?')[0];

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title ? `${title} | ${name}` : name}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ? `${title} | ${name}` : name} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {image && <meta property="og:image" content={image.startsWith('http') ? image : `${siteUrl}${image}`} />}

      {/* Twitter tags */}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title ? `${title} | ${name}` : name} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image.startsWith('http') ? image : `${siteUrl}${image}`} />}

      {/* JSON-LD Schema structured data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
