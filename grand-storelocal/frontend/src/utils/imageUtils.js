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
    // Grand Store uploads use a large transparent canvas. Cloudinary's trim
    // effect removes that canvas at delivery time, so the real bottle bounds
    // can be centered and scaled consistently in every product card.
    if (
      normalizedSrc.includes("res.cloudinary.com") &&
      normalizedSrc.includes("/grandstore-uploads/") &&
      normalizedSrc.includes("/image/upload/") &&
      !normalizedSrc.includes("/e_trim")
    ) {
      return normalizedSrc.replace(
        "/image/upload/",
        "/image/upload/e_trim:10/",
      );
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
