export const preparedVendorImages = {
  "/uploads/images-1787292711461.png": "/assets/products/vendor/whisky-tona-full.png",
};

export const resolveImageUrl = (src) => {
  if (!src) return "";
  const normalizedSrc = String(src).replace(/\\/g, "/");

  const prepared = Object.entries(preparedVendorImages).find(([uploadPath]) =>
    normalizedSrc.includes(uploadPath),
  )?.[1];
  if (prepared) return prepared;

  if (
    normalizedSrc.startsWith("http://") ||
    normalizedSrc.startsWith("https://")
  ) {
    // Grand Store Cloudinary uploads optimization:
    if (
      normalizedSrc.includes("res.cloudinary.com") &&
      normalizedSrc.includes("/grandstore-uploads/") &&
      normalizedSrc.includes("/image/upload/")
    ) {
      // Products: trim transparent whitespace and optimize format/quality
      if (normalizedSrc.includes("/grandstore-uploads/products/")) {
        if (!normalizedSrc.includes("/e_trim") && !normalizedSrc.includes("/f_auto")) {
          return normalizedSrc.replace(
            "/image/upload/",
            "/image/upload/f_auto,q_auto,e_trim:10/",
          );
        }
      } else {
        // Scenery, hero, estate, lifestyle: optimize format & quality only (DO NOT trim landscape edges!)
        if (!normalizedSrc.includes("/f_auto")) {
          return normalizedSrc.replace(
            "/image/upload/",
            "/image/upload/f_auto,q_auto/",
          );
        }
      }
    }

    return normalizedSrc;
  }

  // Handle local uploads or paths without API prefix
  if (normalizedSrc.includes("uploads/")) {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5015";
    const cleanPath = normalizedSrc.substring(
      normalizedSrc.indexOf("uploads/"),
    );
    return `${apiUrl.replace(/\/$/, "")}/${cleanPath}`;
  }
  
  // If it's a domain missing http like giulianivini.com
  if (normalizedSrc.includes(".") && !normalizedSrc.startsWith("/")) {
    return `https://${normalizedSrc}`;
  }

  return normalizedSrc;
};
