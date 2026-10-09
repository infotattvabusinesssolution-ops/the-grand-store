import { normalizeCategory, normalizeCountry } from "./productTaxonomy";

const demonyms = {
  Armenia: "Armenian",
  Belgium: "Belgian",
  China: "Chinese",
  France: "French",
  Germany: "German",
  Ireland: "Irish",
  Israel: "Israeli",
  Jamaica: "Jamaican",
  Japan: "Japanese",
  Mexico: "Mexican",
  Netherlands: "Dutch",
  Nicaragua: "Nicaraguan",
  Scotland: "Scottish",
  "South Africa": "South African",
  Taiwan: "Taiwanese",
  USA: "American",
  Wales: "Welsh",
};

export const getCountryDisplayName = (country, category) => {
  const cleanCategory = normalizeCategory(category);
  const cleanCountry = normalizeCountry(country, cleanCategory);
  if (!cleanCountry) return "";
  if (!cleanCategory) return cleanCountry;

  if (cleanCategory === "Whisky") {
    if (cleanCountry === "USA") return "American Whiskey";
    if (cleanCountry === "Ireland") return "Irish Whiskey";
    if (cleanCountry === "Scotland") return "Scotch Whisky";
  }

  return `${demonyms[cleanCountry] || cleanCountry} ${cleanCategory}`;
};
