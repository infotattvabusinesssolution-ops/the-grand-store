/**
 * Utility functions for Cigar products
 */

export const isCigarProduct = (product) => {
  if (!product) return false;
  const category = String(product.category || "").trim().toLowerCase();
  const type = String(product.type || "").trim().toLowerCase();
  return category === "cigars" || category === "cigar" || type === "cigar" || type === "cigars";
};

export const getCigarQuotationMailto = (product) => {
  if (!product) return "mailto:Billing@grandstore.co.za";
  const name = product.fullName || product.name || "Cigar";
  const brand = product.brand || "Not stated";
  const origin = product.origin || product.country || product.identity?.origin || product.cigarSpecs?.origin || "Not stated";
  const subcategory = product.subcategory || product.style || product.cigarSpecs?.shape || "Hand-Rolled Cigar";
  const size = product.size || (product.cigarSpecs?.length ? `${product.cigarSpecs?.length || ''} ${product.cigarSpecs?.gauge ? 'x ' + product.cigarSpecs.gauge + ' gauge' : ''}`.trim() : "Standard");
  const sku = product.sku || product.id || product._id || "N/A";

  const subject = `Price Quotation Request: ${name} (${brand})`;

  const body = `Dear The Grand Store Admin,

I am writing to request an official price quotation for the following cigar:

• Cigar Name: ${name}
• Brand: ${brand}
• Origin / Location: ${origin}
• Category: Cigars
• Subcategory / Style: ${subcategory}
• Size / Specification: ${size}
• SKU / Product Code: ${sku}

Please provide the official pricing, available packaging / box quantities, and delivery options to my location.

My Contact & Delivery Details:
• Name: 
• Phone / WhatsApp: 
• Delivery Location (City, Country): 
• Quantity / Boxes Desired: 
• Special Instructions: 

Thank you,
The Grand Store Connoisseur`;

  return `mailto:Billing@grandstore.co.za?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
