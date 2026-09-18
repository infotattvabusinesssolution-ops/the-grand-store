const cleanText = (value) => String(value ?? "")
  .normalize("NFC")
  .replace(/&amp;/gi, "&")
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&quot;/gi, '"')
  .replace(/&nbsp;/gi, " ")
  .replace(/\u00a0/g, " ")
  .replace(/[ \t]+/g, " ")
  .trim();

const keyOf = (value) => cleanText(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export const normalizeCategory = (value) => {
  const aliases = { scotch: "Whisky", whiskey: "Whisky", whisky: "Whisky", wine: "Wine" };
  return aliases[keyOf(value)] || cleanText(value);
};

const countryAliases = {
  "american whiskey": "USA",
  "american whisky": "USA",
  "united states": "USA",
  "united states of america": "USA",
  usa: "USA",
  "irish whiskey": "Ireland",
  "irish whisky": "Ireland",
  "israeli whisky": "Israel",
  "japanese whisky": "Japan",
  "scotch whisky": "Scotland",
  "scotland scotch": "Scotland",
  "south african whisky": "South Africa",
  "taiwanese whisky": "Taiwan",
  "welsh whisky": "Wales",
  "belgian beer": "Belgium",
  "dutch beer": "Netherlands",
  "german beer": "Germany",
  "south african beer": "South Africa",
};

const countryNames = {
  armenia: "Armenia",
  argentina: "Argentina",
  australia: "Australia",
  austria: "Austria",
  belgium: "Belgium",
  canada: "Canada",
  chile: "Chile",
  china: "China",
  france: "France",
  georgia: "Georgia",
  germany: "Germany",
  greece: "Greece",
  ireland: "Ireland",
  israel: "Israel",
  italy: "Italy",
  jamaica: "Jamaica",
  japan: "Japan",
  mexico: "Mexico",
  netherlands: "Netherlands",
  "new zealand": "New Zealand",
  nicaragua: "Nicaragua",
  portugal: "Portugal",
  scotland: "Scotland",
  "south africa": "South Africa",
  spain: "Spain",
  taiwan: "Taiwan",
  uk: "United Kingdom",
  "united kingdom": "United Kingdom",
  usa: "USA",
  wales: "Wales",
};

export const normalizeCountry = (value, category = "") => {
  const original = cleanText(value);
  const keyed = keyOf(original);
  if (countryAliases[keyed]) return countryAliases[keyed];
  if (countryNames[keyed]) return countryNames[keyed];

  const suffixes = [
    normalizeCategory(category),
    "Whisky", "Whiskey", "Scotch", "Beer", "Brandy", "Champagne",
    "Cognac", "Gin", "Liqueur", "Rum", "Spirits", "Tequila", "Vodka", "Wine",
  ].filter(Boolean);
  let normalized = original;
  suffixes.forEach((suffix) => {
    const escaped = suffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    normalized = normalized.replace(new RegExp(`\\s+${escaped}$`, "i"), "").trim();
  });
  return countryNames[keyOf(normalized)] || normalized;
};

const brandAliases = {
  avion: "Avión",
  bisquit: "Bisquit & Dubouché",
  dusse: "D'Ussé",
  espolon: "Espolòn",
  "flor de cana": "Flor de Cana",
  "jose cuervo": "José Cuervo",
  "laurent perrier": "Laurent-Perrier",
  "remy martin": "Rémy Martin",
  "triple 3": "Triple Three",
  "volcan de mi tierra": "Volcán de Mi Tierra",
};

export const normalizeBrand = (value) => brandAliases[keyOf(value)] || cleanText(value);

export const normalizeProductName = (value) => cleanText(value)
  .replace(/ñ/g, "n")
  .replace(/Ñ/g, "N")
  .replace(/&\s*(2|two)\s+glasses\b/gi, (_, count) => `with ${count.toLowerCase() === "two" ? "Two" : count} Glasses`)
  .replace(/\b(\d{1,2})\s*(?:yrs?|year(?:s)?(?:\s+old)?)\b/gi, "$1 Year Old")
  .replace(/\bOld\s+Old\b/gi, "Old")
  .replace(/\bAged\s+(\d{1,2})\s+Year Old\b/gi, "Aged $1 Years")
  .replace(/\bAnejo\b/gi, "Añejo")
  .replace(/\bCuvee\b/gi, "Cuvée")
  .replace(/\bMillesime\b/gi, "Millésime")
  .replace(/\bFlor De Cana\b/gi, "Flor de Cana")
  .replace(/\bDusse\b/g, "D'Ussé")
  .replace(/\bRemy Martin\b/g, "Rémy Martin")
  .replace(/\bAvion\b/g, "Avión")
  .replace(/\bEspolon\b/g, "Espolòn")
  .replace(/\bJose Cuervo\b/g, "José Cuervo")
  .replace(/\bVolcan De Mi Tierra\b/g, "Volcán de Mi Tierra")
  .replace(/\bTriple 3\b/g, "Triple Three")
  .replace(/ñ/g, "n")
  .replace(/Ñ/g, "N");

const subcategoryAliases = {
  anejo: "Añejo",
  "extra anejo": "Extra Añejo",
  "blanc de blanc": "Blanc de Blancs",
  "brut rose": "Brut Rosé",
  "demi sec": "Demi-Sec",
  "single barrel bourbon": "Bourbon",
  "blended irish whiskey": "Blended Irish Whiskey",
  "blended irish whisky": "Blended Irish Whiskey",
  "blended malt": "Blended Malt Whisky",
  "blended whisky": "Blended Whisky",
  "rose wine": "Rosé",
  "sparkling rose": "Sparkling Rosé",
  prosecco: "Prosecco",
  cava: "Cava",
  "general sparkling wine": "General Sparkling Wine",
  "cabernet sauvignon": "Cabernet Sauvignon",
  "chenin blanc": "Chenin Blanc",
  "sauvignon blanc": "Sauvignon Blanc",
  "pinot noir": "Pinot Noir",
  shiraz: "Shiraz / Syrah",
  syrah: "Shiraz / Syrah",
  "shiraz syrah": "Shiraz / Syrah",
  "rhone blend": "Rhone Blend",
  "white blend": "White Blend",
  "late harvest wine": "Late Harvest Wine",
  "ice wine": "Ice Wine",
  "non alcoholic rose wine": "Non-Alcoholic Rosé Wine",
  "non alcoholic white wine alternative": "Non-Alcoholic White Wine Alternative",
  "non alcoholic red wine alternative": "Non-Alcoholic Red Wine Alternative",
  "non alcoholic sparkling white wine alternative": "Non-Alcoholic Sparkling White Wine Alternative",
  plain: "Plain Vodka",
};

const inferSubcategory = (product, category) => {
  const search = keyOf([product.name, product.description, ...(product.tags || [])].join(" "));
  if (category === "Whisky") {
    if (search.includes("single malt scotch")) return "Single Malt Scotch";
    if (search.includes("blended malt scotch")) return "Blended Malt Scotch";
    if (search.includes("blended scotch")) return "Blended Scotch";
    if (search.includes("bourbon")) return "Bourbon";
    if (search.includes("rye whiskey") || search.includes("rye whisky")) return "Rye Whisky";
    if (search.includes("single pot still")) return "Single Pot Still";
    if (search.includes("single malt")) return "Single Malt";
    if (search.includes("blended")) return "Blended Whisky";
  }
  if (category === "Cognac") {
    if (/\bxxo\b/.test(search)) return "XXO";
    if (/\bvsop\b/.test(search)) return "VSOP";
    if (/\bxo\b/.test(search)) return "XO";
    if (/\bvs\b/.test(search)) return "VS";
  }
  if (category === "Tequila") {
    if (search.includes("extra anejo")) return "Extra Añejo";
    if (search.includes("anejo")) return "Añejo";
    if (search.includes("reposado")) return "Reposado";
    if (search.includes("blanco") || search.includes("plata")) return "Blanco";
    if (search.includes("mezcal")) return "Mezcal";
  }
  if (category === "Wine") {
    if (search.includes("non alcoholic sparkling red wine")) return "Non-Alcoholic Sparkling Red Wine";
    if (search.includes("non alcoholic sparkling white")) return "Non-Alcoholic Sparkling White Wine Alternative";
    if (search.includes("non alcoholic rose")) return "Non-Alcoholic Rosé Wine";
    if (search.includes("non alcoholic white")) return "Non-Alcoholic White Wine Alternative";
    if (search.includes("non alcoholic red")) return "Non-Alcoholic Red Wine Alternative";
    if (search.includes("prosecco")) return "Prosecco";
    if (search.includes("cava")) return "Cava";
    if (search.includes("sparkling")) return "General Sparkling Wine";
    if (search.includes("cabernet sauvignon")) return "Cabernet Sauvignon";
    if (search.includes("chenin blanc")) return "Chenin Blanc";
    if (search.includes("sauvignon blanc")) return "Sauvignon Blanc";
    if (search.includes("pinot noir")) return "Pinot Noir";
    if (search.includes("shiraz") || search.includes("syrah")) return "Shiraz / Syrah";
    if (search.includes("malbec")) return "Malbec";
    if (search.includes("tempranillo")) return "Tempranillo";
    if (search.includes("zinfandel")) return "Zinfandel";
    if (search.includes("chardonnay")) return "Chardonnay";
    if (search.includes("riesling")) return "Riesling";
    if (search.includes("rhone blend")) return "Rhone Blend";
    if (search.includes("white blend")) return "White Blend";
    if (search.includes("grenache")) return "Grenache";
    if (search.includes("rose")) return "Rosé";
    if (search.includes("vermouth")) return "Vermouth";
    if (search.includes("madeira")) return "Madeira";
    if (search.includes("sherry")) return "Sherry";
    if (search.includes("port")) return "Port";
    if (search.includes("late harvest")) return "Late Harvest Wine";
    if (search.includes("ice wine")) return "Ice Wine";
    if (search.includes("sauternes")) return "Sauternes";
    if (search.includes("moscato")) return "Moscato";
  }
  if (category === "Champagne") {
    if (search.includes("blanc de blanc")) return "Blanc de Blancs";
    if (search.includes("demi sec")) return "Demi-Sec";
    if (search.includes("extra brut")) return "Extra Brut";
    if (search.includes("brut rose")) return "Brut Rosé";
    if (search.includes("rose")) return "Rosé";
    if (search.includes("brut")) return "Brut";
  }
  if (category === "Beer") {
    if (search.includes("cider")) return "Cider";
    if (search.includes("lager")) return "Lager";
    if (search.includes("stout")) return "Stout";
    if (search.includes("wheat")) return "Wheat Beer";
    if (search.includes("ale")) return "Ale";
    if (search.includes("ready to drink") || search.includes("rtd")) return "Ready to Drink";
  }
  if (category === "Rum" && /\b\d{1,2} (?:year|yr)/.test(search)) return "Aged Rum";
  if (category === "Gin" && search.includes("flavour")) return "Flavoured Gin";
  if (category === "Gin" && search.includes("dry gin")) return "Dry Gin";
  if (category === "Vodka") return "Plain Vodka";
  if (["Whisky", "Cognac", "Tequila", "Champagne", "Rum", "Gin", "Beer", "Brandy", "Liqueur", "Wine"].includes(category)) {
    return `Other ${category}`;
  }
  return "";
};

export const normalizeSubcategory = (value, category = "", product = {}) => {
  const cleanCategory = normalizeCategory(category);
  const categoryKey = keyOf(cleanCategory);
  const parts = cleanText(value)
    .split(/\s*(?:>|›|→|\||\/)\s*/)
    .map(cleanText)
    .filter(Boolean);
  const cleaned = [...parts].reverse().find((part) => keyOf(part) !== categoryKey) || "";
  return subcategoryAliases[keyOf(cleaned)] || cleaned || inferSubcategory(product, cleanCategory);
};

export const normalizeBottleSize = (size, name = "") => {
  const source = cleanText(size) || cleanText(name).match(/\b\d+(?:\.\d+)?\s*(?:ml|cl|l)\b/i)?.[0] || "";
  const match = source.match(/(\d+(?:\.\d+)?)\s*(ml|cl|l)/i);
  if (!match) return source;
  const unit = match[2].toLowerCase();
  return `${match[1]}${unit === "l" ? "L" : unit}`;
};

const findAge = (product, category, subcategory) => {
  if (/blanton/i.test(`${product.brand} ${product.name}`)) return "6+ Years";
  const search = keyOf(`${product.name || ""} ${product.description || ""} ${subcategory}`);
  if (category === "Cognac") {
    if (/\bxxo\b/.test(search)) return "Minimum 14 Years";
    if (/\bxo\b/.test(search)) return "Minimum 10 Years";
    if (/\bvsop\b/.test(search)) return "Minimum 4 Years";
    if (/\bvs\b/.test(search)) return "Minimum 2 Years";
  }
  const match = `${product.name || ""} ${product.description || ""}`.match(/\b(?:aged\s+)?(\d{1,2})\s*(?:year(?:s)?(?:\s+old)?|yrs?)\b/i);
  return match ? `${match[1]} Years` : "";
};

const findAbv = (product) => {
  if (/blanton gold/i.test(product.name || "")) return "51.5%";
  if (/blanton.*(?:original|single barrel)/i.test(product.name || "") || /blanton/i.test(product.brand || "")) return "46.5%";
  if (keyOf(product.brand).includes("remy martin") && /\bvsop\b/i.test(`${product.name || ""} ${product.description || ""}`)) return "40%";
  const match = `${product.name || ""} ${product.description || ""}`.match(/\b(\d{1,2}(?:\.\d+)?)\s*%\s*(?:abv)?\b/i);
  return match ? `${match[1]}%` : "";
};

const findProduction = (search) => [
  ["single barrel", "Single Barrel"],
  ["small batch", "Small Batch"],
  ["double cask", "Double Cask"],
  ["triple cask", "Triple Cask"],
  ["sherry cask", "Sherry Cask"],
  ["cask strength", "Cask Strength"],
  ["bottled in bond", "Bottled in Bond"],
  ["limited edition", "Limited Edition"],
  ["traditional method", "Traditional Method"],
  ["tank method", "Tank Method"],
  ["cap classique", "Méthode Cap Classique"],
  ["late harvest", "Late Harvest"],
  ["vintage", "Vintage"],
].find(([needle]) => search.includes(needle))?.[1] || "";

export const getProductIdentity = (product = {}) => {
  const category = normalizeCategory(product.category || product.type);
  const country = normalizeCountry(product.country || product.origin, category);
  const brand = normalizeBrand(product.brand);
  const subcategory = normalizeSubcategory(product.subcategory, category, product);
  const search = keyOf([product.name, product.description, subcategory, ...(product.tags || [])].join(" "));
  let type = category;
  if (category === "Whisky") {
    if (search.includes("bourbon")) type = "Bourbon";
    else if (country === "Scotland") type = "Scotch Whisky";
    else if (country === "Ireland") type = "Irish Whiskey";
  } else if (category === "Spirits" && (search.includes("baijiu") || search.includes("moutai"))) {
    type = "Baijiu";
  }

  const wineRegion = category === "Wine" ? [
    ["stellenbosch", "Stellenbosch"], ["franschhoek", "Franschhoek"],
    ["constantia", "Constantia"], ["bordeaux", "Bordeaux"],
    ["burgundy", "Burgundy"], ["rhone", "Rhône"], ["mosel", "Mosel"],
    ["marlborough", "Marlborough"], ["mendoza", "Mendoza"],
    ["rioja", "Rioja"], ["tuscany", "Tuscany"], ["veneto", "Veneto"],
    ["douro", "Douro"],
  ].find(([needle]) => search.includes(needle))?.[1] : "";
  const region = /blanton/i.test(brand) ? "Kentucky" : [
    ["speyside", "Speyside"], ["islay", "Islay"], ["campbeltown", "Campbeltown"],
    ["highland", "Highlands"], ["lowland", "Lowlands"], ["island", "Islands"],
  ].find(([needle]) => search.includes(needle))?.[1] ||
    (category === "Cognac" && country === "France" ? "Cognac" : "") ||
    (category === "Champagne" && country === "France" ? "Champagne" : "") ||
    wineRegion;
  let production = findProduction(search);
  if (!production && category === "Cognac" && (search.includes("fine champagne") || (keyOf(brand).includes("remy martin") && subcategory === "VSOP"))) {
    production = "Fine Champagne Blend";
  }
  const inferred = {
    type,
    style: type === "Bourbon" && (/blanton/i.test(brand) || search.includes("straight bourbon"))
      ? "Straight Bourbon"
      : (subcategory && keyOf(subcategory) !== keyOf(type) && !keyOf(subcategory).startsWith("other ") ? subcategory : ""),
    production,
    origin: [region, country].filter(Boolean).join(", "),
    age: findAge(product, category, subcategory),
    bottleSize: normalizeBottleSize(product.size, product.name),
    abv: findAbv(product),
  };

  const storedIdentity = { ...product.identity };
  storedIdentity.style = normalizeSubcategory(storedIdentity.style, category, product);
  if (keyOf(storedIdentity.style).startsWith("other ")) storedIdentity.style = "";
  return Object.fromEntries(Object.entries(inferred).map(([key, value]) => [
    key,
    cleanText(storedIdentity[key]) || value,
  ]));
};

export const normalizeProductForDisplay = (product = {}) => {
  const category = normalizeCategory(product.category || product.type);
  const country = normalizeCountry(product.country || product.origin, category);
  const regionalizeWhiskey = (value) => {
    const text = cleanText(value);
    return ["USA", "Ireland"].includes(country)
      ? text.replace(/\bWhisky\b/gi, "Whiskey")
      : text;
  };
  const normalized = {
    ...product,
    name: regionalizeWhiskey(normalizeProductName(product.name)),
    type: category,
    category,
    country,
    brand: normalizeBrand(product.brand || product.storeName),
    subcategory: regionalizeWhiskey(normalizeSubcategory(product.subcategory, category, product)),
    description: regionalizeWhiskey(product.description),
    tags: Array.isArray(product.tags) ? product.tags.map(regionalizeWhiskey) : product.tags,
    size: normalizeBottleSize(product.size, product.name),
  };
  return { ...normalized, identity: getProductIdentity(normalized) };
};
