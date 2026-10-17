require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const EstateProfile = require('../models/EstateProfile');
const Product = require('../models/Product');
const { slugify } = require('../utils/slugify');
const manifest = require('./dogliotti_cloudinary_manifest.json');

const DOGLIOTTI_EMAIL = 'dogliotti@dogliotti1870.com';
const DOGLIOTTI_PASSWORD = 'Dogliotti1870!';

const PRODUCTS_DATA = [
  // --- I Moscati d’Asti ---
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg Screw Cap 2026",
    vintage: "2026",
    range: "I Moscati d’Asti",
    subcategory: "Moscato d'Asti",
    category: "Wine",
    price: "165.00",
    exwEur: 7.35,
    case: 6,
    size: "750ml",
    abv: "5.5%",
    description: "Traditional aromatic sparkling wine from Castagnole delle Lanze. Naturally effervescent, fragrant with intense notes of fresh white peach, orange blossom, and wild mountain sage.",
    tastingNotes: ["White Peach", "Orange Blossom", "Wild Sage", "Acacia Honey", "Lively Frizzante"],
    flavorProfile: ["Aromatic & Sweet", "Fresh & Floral"],
    foodPairing: ["Hazelnut Cake", "Fresh Fruit Tarts", "Aged Gorgonzola", "Panettone"],
    imageKey: "dogliotti-moscato-dasti-docg-screwcap-2026"
  },
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg “Berlet” 2026",
    vintage: "2026",
    range: "I Moscati d’Asti",
    subcategory: "Single Vineyard Moscato",
    category: "Wine",
    price: "195.00",
    exwEur: 8.60,
    case: 6,
    size: "750ml",
    abv: "5.5%",
    description: "Cru expression sourced exclusively from Dogliotti's oldest historic hillside vineyard 'Berlet'. Exuberant aromatics, candied citrus, acacia honey, and a persistent, silky perlage.",
    tastingNotes: ["Candied Citrus", "Acacia Honey", "White Lilies", "Ripe Pear", "Silky Mousse"],
    flavorProfile: ["Rich & Aromatic", "Creamy Mousse"],
    foodPairing: ["Piedmont Hazelnut Biscuits", "Fruit Pavlova", "Foie Gras", "Mild Cheeses"],
    imageKey: "dogliotti-moscato-dasti-docg-berlet-2026"
  },
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg “Selezione di Erik” 2011",
    vintage: "2011",
    range: "Selezione di Erik",
    subcategory: "Aged Moscato Archive",
    category: "Wine",
    price: "1795.00",
    exwEur: 80.00,
    case: 3,
    size: "750ml",
    abv: "5.5%",
    featured: true,
    description: "Rare library vintage. Winemaker Erik Dogliotti's visionary aged interpretation of Moscato d'Asti demonstrating extraordinary tertiary evolution: dried apricot, saffron, petroleum undertones, and vibrant balancing acidity.",
    tastingNotes: ["Dried Apricot", "Saffron", "Beeswax", "Candied Ginger", "Petroleum Minerality"],
    flavorProfile: ["Complex & Mature", "Collectors Rare Archive"],
    foodPairing: ["Aged Stilton", "Truffle Honey", "Fine Cigars", "Meditation Wine"],
    imageKey: "dogliotti-moscato-dasti-docg-erik-2011"
  },
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg “Selezione di Erik” 2015",
    vintage: "2015",
    range: "Selezione di Erik",
    subcategory: "Aged Moscato Archive",
    category: "Wine",
    price: "895.00",
    exwEur: 40.00,
    case: 3,
    size: "750ml",
    abv: "5.5%",
    description: "Collector's archive vintage with magnificent golden hue and tertiary complexity. Offers candied Seville orange peel, golden raisins, ginger, and wild mountain honeycomb.",
    tastingNotes: ["Candied Orange Peel", "Honeycomb", "Dried Fig", "Balsamic Accents"],
    flavorProfile: ["Opulent & Evolving", "Velvety"],
    foodPairing: ["Blue Cheese", "Pecan Tart", "Aged Comté"],
    imageKey: "dogliotti-moscato-dasti-docg-erik-2015"
  },
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg “Selezione di Erik” 2016",
    vintage: "2016",
    range: "Selezione di Erik",
    subcategory: "Aged Moscato Archive",
    category: "Wine",
    price: "675.00",
    exwEur: 30.00,
    case: 3,
    size: "750ml",
    abv: "5.5%",
    description: "Classic cool-climate vintage displaying seamless harmony between sweet aromatic richness and focused minerality. Ripe yellow peach, elderflower, and delicate spice.",
    tastingNotes: ["Yellow Peach", "Elderflower", "White Cardamom", "Crushed Stone"],
    flavorProfile: ["Harmonious & Structured", "Refined Sweetness"],
    foodPairing: ["Lobster with Mango Chutney", "Crème Brûlée", "Artisanal Cheese Board"],
    imageKey: "dogliotti-moscato-dasti-docg-erik-2016"
  },
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg “Selezione di Erik” 2017",
    vintage: "2017",
    range: "Selezione di Erik",
    subcategory: "Aged Moscato Archive",
    category: "Wine",
    price: "565.00",
    exwEur: 25.00,
    case: 4,
    size: "750ml",
    abv: "5.5%",
    description: "Intense, sun-drenched harvest yielding exceptional concentration. Dried Mediterranean herbs, white Turkish fig, apricot compote, and crystalline freshness.",
    tastingNotes: ["Dried Fig", "Apricot Compote", "Mediterranean Thyme", "Sweet Almond"],
    flavorProfile: ["Concentrated", "Complex"],
    foodPairing: ["Dark Chocolate with Sea Salt", "Ricotta Desserts", "Spiced Nuts"],
    imageKey: "dogliotti-moscato-dasti-docg-erik-2017"
  },
  {
    name: "Dogliotti 1870 Moscato d’Asti Docg “Selezione di Erik” 2021",
    vintage: "2021",
    range: "Selezione di Erik",
    subcategory: "Moscato Archive",
    category: "Wine",
    price: "360.00",
    exwEur: 16.00,
    case: 4,
    size: "750ml",
    abv: "5.5%",
    description: "Vibrant and pure with brilliant youthful energy. Fresh muscat grape essence, jasmine florals, lime sorbet, and a delicate, lingering mineral finish.",
    tastingNotes: ["Fresh Muscat Grape", "Jasmine", "Lime Sorbet", "Orange Blossom"],
    flavorProfile: ["Pure & Crisp", "Luminous Fruit"],
    foodPairing: ["Fruit Tarts", "Light Pastries", "Goat Cheese Crostini"],
    imageKey: "dogliotti-moscato-dasti-docg-erik-2021"
  },

  // --- White Wines ---
  {
    name: "Dogliotti 1870 Roero Arneis Docg 2025",
    vintage: "2025",
    range: "White Wines",
    subcategory: "Arneis",
    category: "Wine",
    price: "170.00",
    exwEur: 7.50,
    case: 6,
    size: "750ml",
    abv: "13.0%",
    description: "Prestigious Piedmont white wine from sandy Roero slopes. Distinguished by crisp acidity, pronounced saline minerality, white pear, green almond, and fresh chamomile blossoms.",
    tastingNotes: ["White Pear", "Green Almond", "Chamomile", "Flinty Salinity", "Crisp Citrus"],
    flavorProfile: ["Crisp & Mineral", "Herbaceous"],
    foodPairing: ["Vitello Tonnato", "Grilled Sea Bass", "Seafood Risotto", "Prosciutto"],
    imageKey: "dogliotti-roero-arneis-docg-2025"
  },
  {
    name: "Dogliotti 1870 Piemonte Doc Chardonnay 2025",
    vintage: "2025",
    range: "White Wines",
    subcategory: "Chardonnay",
    category: "Wine",
    price: "165.00",
    exwEur: 7.30,
    case: 6,
    size: "750ml",
    abv: "13.0%",
    description: "Noble international variety thriving on Piedmont limestone-clay slopes. Dry, silky, and elegantly balanced with golden apple, white peach, citrus zest, and delicate floral complexity.",
    tastingNotes: ["Golden Apple", "White Peach", "Lemon Zest", "Silky Texture", "Clean Minerality"],
    flavorProfile: ["Silky & Balanced", "Clean"],
    foodPairing: ["Roast Chicken with Herbs", "Creamy Pasta", "Shellfish", "Soft Cheeses"],
    imageKey: "dogliotti-piemonte-doc-chardonnay-2025"
  },

  // --- The Family’s Wines ---
  {
    name: "Dogliotti 1870 Bianco d’Amelio 2022",
    vintage: "2022",
    range: "The Family’s Wines",
    subcategory: "Heritage White Blend",
    category: "Wine",
    price: "195.00",
    exwEur: 8.60,
    case: 6,
    size: "750ml",
    abv: "13.5%",
    description: "Heartfelt tribute to Grandfather Amelio Dogliotti. An artisan blend of four indigenous and international white varieties that surprises with an expansive aromatic bouquet, textural depth, and lingering elegance.",
    tastingNotes: ["Yellow Plum", "Wild Flowers", "Toasted Brioche", "Ripe Citrus", "Full Palate"],
    flavorProfile: ["Rich & Generous", "Structured White"],
    foodPairing: ["Aged Pecorino", "Truffle Pasta", "Rich Poultry", "Baked Turbot"],
    imageKey: "dogliotti-bianco-damelio-2022"
  },
  {
    name: "Dogliotti 1870 Rosa d’Elsa 2023",
    vintage: "2023",
    range: "The Family’s Wines",
    subcategory: "Heritage Rosé Blend",
    category: "Wine",
    price: "200.00",
    exwEur: 8.90,
    case: 6,
    size: "750ml",
    abv: "13.0%",
    description: "Dedicated to Grandmother Roselsa. Crafted from a harmonious marriage of three red grape varieties and one white grape variety. Refined wild strawberry aromas, floral nuances, and an elegant, savory mineral palate.",
    tastingNotes: ["Wild Strawberry", "Rose Petals", "Pomegranate", "Crushed Stone", "Savory Finish"],
    flavorProfile: ["Elegant & Savory", "Floral"],
    foodPairing: ["Charcuterie", "Salmon Tartare", "Tomato Burrata Salad", "Mediterranean Tapas"],
    imageKey: "dogliotti-rosa-delsa-2023"
  },

  // --- Reds from Tradition ---
  {
    name: "Dogliotti 1870 Dolcetto d’Alba Doc 2025",
    vintage: "2025",
    range: "Reds from Tradition",
    subcategory: "Dolcetto d'Alba",
    category: "Wine",
    price: "160.00",
    exwEur: 7.20,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    description: "Soft, immediate, and historic Piedmont everyday favorite. Deep ruby color with violet reflections. Bursting with ripe marasca cherry, blackberry, and a characteristic bitter almond finish.",
    tastingNotes: ["Marasca Cherry", "Blackberry", "Violet", "Bitter Almond Finish"],
    flavorProfile: ["Juicy & Fresh", "Approachable Tannins"],
    foodPairing: ["Tajarin al Ragù", "Agnolotti del Plin", "Pizza Margherita", "Salami"],
    imageKey: "dogliotti-dolcetto-dalba-doc-2025"
  },
  {
    name: "Dogliotti 1870 Grignolino d’Asti Doc 2025",
    vintage: "2025",
    range: "Reds from Tradition",
    subcategory: "Grignolino d'Asti",
    category: "Wine",
    price: "160.00",
    exwEur: 7.20,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    description: "«The whitest of the Reds». Pale ruby hue with aristocratic austerity. Distinctive aromas of white pepper, redcurrant, and dried rose with vibrant acidity and dry, fine-grained tannins.",
    tastingNotes: ["White Pepper", "Redcurrant", "Wild Raspberry", "Dried Rose", "Firm Tannins"],
    flavorProfile: ["Dry & Peppery", "Aristocratic Old-World"],
    foodPairing: ["Bagna Cauda", "Rabbit Terrine", "Pan-Seared Duck Breast", "Braised Mushrooms"],
    imageKey: "dogliotti-grignolino-dasti-doc-2025"
  },

  // --- From Monferrato ---
  {
    name: "Dogliotti 1870 Barbis – Piemonte Doc Barbera Frizzante 2025",
    vintage: "2025",
    range: "From Monferrato",
    subcategory: "Barbera Frizzante",
    category: "Wine",
    price: "160.00",
    exwEur: 7.20,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    description: "The rebellious, vivacious side of Barbera. Gently sparkling (frizzante), fragrant, and crisp with vibrant red cherry and lively effervescence. Served slightly chilled.",
    tastingNotes: ["Fresh Red Cherry", "Cranberry", "Fine Bubbles", "Vibrant Acidity"],
    flavorProfile: ["Frizzante & Vivacious", "Refreshing Red"],
    foodPairing: ["Cured Meats", "Porchetta", "Fried Appetizers", "Barbecue Ribs"],
    imageKey: "dogliotti-barbis-barbera-frizzante-2025"
  },
  {
    name: "Dogliotti 1870 Barbera d’Asti Docg 2024",
    vintage: "2024",
    range: "From Monferrato",
    subcategory: "Barbera d'Asti",
    category: "Wine",
    price: "170.00",
    exwEur: 7.50,
    case: 6,
    size: "750ml",
    abv: "13.5%",
    description: "The authentic traditional version. Seamless union of century-old heritage and modern fruit clarity. Plump dark plums, blackberry jam, sweet spices, and trademark energizing acidity.",
    tastingNotes: ["Dark Plum", "Blackberry Jam", "Sweet Spices", "Refreshing Acidity"],
    flavorProfile: ["Fruity & Energetic", "Medium-Full Body"],
    foodPairing: ["Bollito Misto", "Pasta al Forno", "Braised Beef Cheeks", "Medium Cheeses"],
    imageKey: "dogliotti-barbera-dasti-docg-2024"
  },
  {
    name: "Dogliotti 1870 Barbera d’Asti Docg Superiore 2023",
    vintage: "2023",
    range: "From Monferrato",
    subcategory: "Barbera Superiore",
    category: "Wine",
    price: "240.00",
    exwEur: 10.50,
    case: 6,
    size: "750ml",
    abv: "14.5%",
    description: "Matured in French oak casks. Superb character, complexity, and longevity. Rich black cherry compote, dark cocoa, vanilla spice, and velvety, enveloping mouthfeel.",
    tastingNotes: ["Black Cherry Compote", "Cocoa Bean", "Vanilla Oak", "Warm Spice", "Velvety Finish"],
    flavorProfile: ["Rich & Velvety", "Oak-Aged Power"],
    foodPairing: ["Roast Lamb", "Wild Boar Stew", "Truffled Risotto", "Aged Parmigiano"],
    imageKey: "dogliotti-barbera-dasti-superiore-docg-2023"
  },
  {
    name: "Dogliotti 1870 Nizza Docg 2021",
    vintage: "2021",
    range: "From Monferrato",
    subcategory: "Nizza Cru Barbera",
    category: "Wine",
    price: "420.00",
    exwEur: 18.50,
    case: 6,
    size: "750ml",
    abv: "15.0%",
    featured: true,
    description: "Supreme prestige appellation for Barbera. Sourced from premier south-facing amphitheaters of Monferrato. Profound depth, noble structure, dark fruit balsamic concentration, and seamless tannins.",
    tastingNotes: ["Blackcurrant Liqueur", "Cedar", "Tobacco Leaf", "Dark Truffle", "Silky Power"],
    flavorProfile: ["Monumental & Opulent", "Collector's Cru"],
    foodPairing: ["Brasato al Barolo", "Venison Roast", "Aged Castelmagno Cheese", "Dry-Aged Ribeye"],
    imageKey: "dogliotti-nizza-docg-2021"
  },

  // --- From Langhe ---
  {
    name: "Dogliotti 1870 Nebbiolo d’Alba Doc 2024",
    vintage: "2024",
    range: "From Langhe",
    subcategory: "Nebbiolo d'Alba",
    category: "Wine",
    price: "205.00",
    exwEur: 9.10,
    case: 6,
    size: "750ml",
    abv: "14.0%",
    description: "Perfect balance between the noble austerity of Nebbiolo and approachable elegance. Perfumed bouquet of dried violets, wild raspberry, orange peel, and fine-grained mineral tannins.",
    tastingNotes: ["Dried Violet", "Wild Raspberry", "Orange Peel", "Tar Hints", "Fine Tannins"],
    flavorProfile: ["Elegant & Structured", "Floral Nebbiolo"],
    foodPairing: ["Porcini Risotto", "Veal Cutlets", "Duck Breast", "Fontina Cheese"],
    imageKey: "dogliotti-nebbiolo-dalba-doc-2024"
  },
  {
    name: "Dogliotti 1870 Barbaresco Docg 2021",
    vintage: "2021",
    range: "From Langhe",
    subcategory: "Barbaresco",
    category: "Wine",
    price: "395.00",
    exwEur: 17.50,
    case: 6,
    size: "750ml",
    abv: "14.5%",
    featured: true,
    description: "The Queen of Piedmont. Matured in large Slavonian oak casks. Complex, noble, and built for graceful aging. Dried rose, wild cranberry, leather, liquorice, and silky, persistent tannins.",
    tastingNotes: ["Dried Rose Petal", "Wild Cranberry", "Fine Leather", "Star Anise", "Noble Tannins"],
    flavorProfile: ["Refined & Noble", "Silky Longevity"],
    foodPairing: ["White Truffle Tajarin", "Roast Pheasant", "Braised Ossobuco", "Aged Gouda"],
    imageKey: "dogliotti-barbaresco-docg-2021"
  },
  {
    name: "Dogliotti 1870 Barolo Docg 2022",
    vintage: "2022",
    range: "From Langhe",
    subcategory: "Barolo",
    category: "Wine",
    price: "410.00",
    exwEur: 18.00,
    case: 6,
    size: "750ml",
    abv: "14.5%",
    featured: true,
    description: "The King of Wines and Wine of Kings. Monumental structure, ethereal bouquet of autumn leaves, white Alba truffle, dried cherries, pipe tobacco, and legendary longevity.",
    tastingNotes: ["Alba Truffle", "Tar & Roses", "Dried Marasca Cherry", "Tobacco", "Monumental Structure"],
    flavorProfile: ["Powerful & Ethereal", "Legendary Cru"],
    foodPairing: ["Brasato al Barolo", "Wild Game Stew", "Castelmagno Cheese", "Dry-Aged Bistecca"],
    imageKey: "dogliotti-barolo-docg-2022"
  },

  // --- Metodo Martinotti & Classico ---
  {
    name: "Dogliotti 1870 Asti Spumante Docg NV",
    vintage: "NV",
    range: "Metodo Martinotti",
    subcategory: "Asti Spumante",
    category: "Wine",
    price: "170.00",
    exwEur: 7.60,
    case: 6,
    size: "750ml",
    abv: "7.0%",
    description: "Sweet, intensely aromatic, and celebratory sparkling wine made from 100% white Moscato grapes. Fine persistent perlage, aromas of white wisteria, candied citrus, and honey.",
    tastingNotes: ["White Wisteria", "Candied Lemon", "Acacia Honey", "Persistent Perlage"],
    flavorProfile: ["Sweet & Aromatic", "Celebratory"],
    foodPairing: ["Torta di Nocciole", "Festive Pastries", "Zabaione", "Fresh Berries"],
    imageKey: "dogliotti-asti-spumante-docg"
  },
  {
    name: "Dogliotti 1870 Spumante Brut Metodo Martinotti NV",
    vintage: "NV",
    range: "Metodo Martinotti",
    subcategory: "Spumante Brut",
    category: "Wine",
    price: "160.00",
    exwEur: 7.00,
    case: 6,
    size: "750ml",
    abv: "11.5%",
    description: "Crisp and refreshing dry sparkling wine produced using the Martinotti tank method to preserve fresh floral aromas, green apple, crisp lime, and energetic effervescence.",
    tastingNotes: ["Green Apple", "Lemon Blossom", "White Peach", "Crisp Minerality"],
    flavorProfile: ["Crisp & Dry", "Aperitif Sparkler"],
    foodPairing: ["Aperitivo Bites", "Oysters", "Vegetable Tempura", "Light Seafood"],
    imageKey: "dogliotti-spumante-brut"
  },
  {
    name: "Dogliotti 1870 Alta Langa Docg 2022",
    vintage: "2022",
    range: "Metodo Classico",
    subcategory: "Alta Langa Metodo Classico",
    category: "Wine",
    price: "410.00",
    exwEur: 18.00,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    featured: true,
    description: "Prestigious Metodo Classico vintage sparkler crafted from hand-harvested Pinot Nero & Chardonnay, matured 42 months sur lies. Nuances of crusty bread, toasted brioche, white flowers, and citrus precision.",
    tastingNotes: ["Crusty Bread", "Toasted Brioche", "White Blossom", "Lemon Zest", "Mineral Salinity"],
    flavorProfile: ["Complex & Creamy", "Champenoise Elegance"],
    foodPairing: ["Caviar Blinis", "Raw Oysters", "Butter Poached Lobster", "Aged Parmigiano"],
    imageKey: "dogliotti-alta-langa-docg"
  },
  {
    name: "Dogliotti 1870 Alta Langa Rosè Docg 2022",
    vintage: "2022",
    range: "Metodo Classico",
    subcategory: "Alta Langa Rosé Metodo Classico",
    category: "Wine",
    price: "410.00",
    exwEur: 18.00,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    featured: true,
    description: "100% Nebbiolo Metodo Classico aged 42 months on the lees. Rare salmon copper color with captivating aromas of wild raspberries, redcurrant, pink grapefruit, and toasted hazelnut pastry.",
    tastingNotes: ["Wild Raspberry", "Redcurrant", "Pink Grapefruit", "Toasted Hazelnut", "Vibrant Finish"],
    flavorProfile: ["Gastronomic Rosé", "Refined & Creamy"],
    foodPairing: ["Salmon Carpaccio", "Tuna Sashimi", "Roast Quail", "Truffled Risotto"],
    imageKey: "dogliotti-alta-langa-rose-docg"
  },
  {
    name: "Dogliotti 1870 Alta Langa Riserva Docg 2020",
    vintage: "2020",
    range: "Metodo Classico",
    subcategory: "Alta Langa Riserva Metodo Classico",
    category: "Wine",
    price: "720.00",
    exwEur: 32.00,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    featured: true,
    description: "Prestige vintage reserve aged for 60 months sur lies in historic cellars. Profound complexity, toasted Piedmont hazelnuts, baked quince, candied citron, and ultra-fine silky mousse.",
    tastingNotes: ["Toasted Piedmont Hazelnut", "Baked Quince", "Candied Citron", "Brioche", "Silky Mousse"],
    flavorProfile: ["Profound & Luxurious", "Ultra-Aged Metodo Classico"],
    foodPairing: ["White Truffle Dishes", "Roast Veal with Morel Mushrooms", "Langoustines", "Vintage Comté"],
    imageKey: "dogliotti-alta-langa-riserva-docg-2020"
  },
  {
    name: "Dogliotti 1870 Alta Langa Riserva Docg 2020 (With Gift Box)",
    vintage: "2020",
    range: "Metodo Classico",
    subcategory: "Alta Langa Riserva Metodo Classico",
    category: "Wine",
    price: "810.00",
    exwEur: 36.00,
    case: 6,
    size: "750ml",
    abv: "12.5%",
    featured: true,
    description: "Presented in an exclusive Dogliotti 1870 luxury single gift box. Matured 60 months on the lees for collectors and milestone celebrations.",
    tastingNotes: ["Toasted Hazelnut", "Candied Citron", "Toasted Brioche", "Fine Persistent Bead"],
    flavorProfile: ["Gift & Collector's Edition", "Luxurious"],
    foodPairing: ["Celebration Toasts", "Gourmet Tasting Menus", "Fine Caviar"],
    imageKey: "dogliotti-alta-langa-riserva-single-box"
  },

  // --- Vermouth 18/70 ---
  {
    name: "Dogliotti 1870 Vermouth 18/70 Bianco NV",
    vintage: "NV",
    range: "Vermouth 18/70",
    subcategory: "Artisan Vermouth di Torino",
    category: "Wine",
    price: "330.00",
    exwEur: 14.50,
    case: 6,
    size: "750ml",
    abv: "18.0%",
    description: "Handcrafted Italian Vermouth di Torino with a Moscato d’Asti Docg wine base and 51 Alpine herbs and botanicals. Zero added sugar—naturally sweetened by the golden Moscato grape.",
    tastingNotes: ["Alpine Botanicals", "Gentian", "Sweet Orange Peel", "Cardamom", "Wild Thyme"],
    flavorProfile: ["Aromatic & Bitter-Sweet", "Natural Botanical"],
    foodPairing: ["Served on the Rocks with Lemon Peel", "White Negroni", "Artisan Tonic", "Charcuterie"],
    imageKey: "dogliotti-vermouth-18-70-bianco"
  },
  {
    name: "Dogliotti 1870 Vermouth 18/70 Rosso NV",
    vintage: "NV",
    range: "Vermouth 18/70",
    subcategory: "Artisan Vermouth di Torino",
    category: "Wine",
    price: "330.00",
    exwEur: 14.50,
    case: 6,
    size: "750ml",
    abv: "18.0%",
    description: "Crafted on a Barbera d’Asti Docg red wine base infused with 46 botanical herbs, wormwood, rhubarb, and citrus rind. Pure natural amber-ruby hue with zero artificial coloring.",
    tastingNotes: ["Artemisia Wormwood", "Bitter Orange", "Rhubarb Root", "Cinnamon", "Rich Herbal Warmth"],
    flavorProfile: ["Complex & Herbaceous", "Classic Italian Aperitivo"],
    foodPairing: ["Classic Negroni", "Manhattan", "Over Ice with Orange Twist", "Dark Chocolate Truffles"],
    imageKey: "dogliotti-vermouth-18-70-rosso"
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // 1. CREATE OR UPDATE USER ACCOUNT
    console.log(`Checking Vendor User account: ${DOGLIOTTI_EMAIL}...`);
    let user = await User.findOne({ email: DOGLIOTTI_EMAIL });
    const passwordHash = await bcrypt.hash(DOGLIOTTI_PASSWORD, 10);

    if (!user) {
      user = await User.create({
        name: 'Erik Dogliotti',
        email: DOGLIOTTI_EMAIL,
        password: passwordHash,
        role: 'vendor_active',
        isEmailVerified: true,
        isAgeVerified: true,
        country: 'Italy'
      });
      console.log(`✅ Created Vendor User account: ${user.email} (Role: ${user.role})`);
    } else {
      user.name = 'Erik Dogliotti';
      user.password = passwordHash;
      user.role = 'vendor_active';
      user.isEmailVerified = true;
      user.isAgeVerified = true;
      user.country = 'Italy';
      await user.save();
      console.log(`✅ Updated existing Vendor User account: ${user.email}`);
    }

    // 2. CREATE OR UPDATE VENDOR PROFILE
    console.log(`Checking Vendor profile for userId: ${user._id}...`);
    let vendor = await Vendor.findOne({ userId: user._id });
    const vendorData = {
      userId: user._id,
      vendorType: 'international',
      onboardingStep: 10,
      status: 'approved',
      paymentStatus: 'paid',
      registrationFee: 0,
      verificationScore: {
        businessVerified: true,
        identityVerified: true,
        licenceVerified: true,
        taxVerified: true,
        bankVerified: true
      },
      businessInfo: {
        legalName: 'Dogliotti 1870 S.S.',
        tradingName: 'Dogliotti 1870',
        registrationNumber: 'IT-AT-1870-DOGL',
        businessType: 'Family Winery, Viticulturist & Estate Bottler',
        address: 'Castagnole delle Lanze, Asti, Langhe & Monferrato, Piedmont, Italy',
        bannerUrl: manifest.estate.dogliotti_langhe_monferrato_hero,
        logoUrl: manifest.estate.dogliotti_logo_transparent
      },
      storyInfo: {
        brandStory: 'Piedmont Fine Wines Since 1870 — Tra Langhe e Monferrato. Five generations of family winemaking passion in UNESCO World Heritage hills, crafting benchmark Moscato d’Asti, Alta Langa Metodo Classico, Barbera d’Asti, Barolo, Barbaresco, and artisan botanical Vermouth.',
        winemakerBio: 'Erik Dogliotti, alongside cousins Ivan and Matteo, represents the fifth generation revitalizing Dogliotti 1870. Blending artisanal Piedmontese heritage with state-of-the-art vinification to deliver authentic emotion and supreme terroir fidelity in every bottle.'
      },
      shippingProfile: {
        pickupAddress: {
          addressLine1: 'Dogliotti 1870 Estate Winery',
          city: 'Castagnole delle Lanze',
          state: 'Asti, Piedmont',
          postalCode: '14054',
          country: 'Italy'
        }
      },
      productCategories: ['Wine'],
      sellingCapabilities: 'both',
      exportProfile: {
        approvalStatus: 'approved',
        isExportApproved: 'approved',
        customsExportCode: 'IT-CUSTOMS-14054-EXP',
        exportExperienceYears: 25,
        monthlyCapacityCases: 10000,
        supportedIncoterms: ['FOB', 'EXW', 'CIF'],
        targetMarkets: ['South Africa', 'United Kingdom', 'United States', 'Germany', 'Japan', 'Global'],
        leadTimeDays: 14,
        containerLoadingSpecs: {
          casesPerPallet: 105,
          bottlesPerCase: 6,
          palletsPer20ft: 11,
          palletsPer40ft: 24
        },
        documents: []
      }
    };

    if (!vendor) {
      vendor = await Vendor.create(vendorData);
      console.log(`✅ Created Vendor profile for Dogliotti 1870.`);
    } else {
      Object.assign(vendor, vendorData);
      vendor.exportProfile = vendorData.exportProfile;
      vendor.sellingCapabilities = vendorData.sellingCapabilities;
      vendor.markModified('exportProfile');
      await vendor.save();
      console.log(`✅ Updated Vendor profile for Dogliotti 1870.`);
    }

    // 3. CREATE OR UPDATE ESTATE PROFILE
    console.log(`Checking EstateProfile for slug: dogliotti-1870...`);
    let estate = await EstateProfile.findOne({ slug: 'dogliotti-1870' });
    const estateData = {
      vendorId: user._id,
      slug: 'dogliotti-1870',
      estateName: 'Dogliotti 1870',
      country: 'Italy',
      region: 'Castagnole delle Lanze (Langhe & Monferrato, Piedmont)',
      tagline: 'Piedmont’s Fine Wines Since 1870 — Tra Langhe e Monferrato',
      isPublished: true,
      seoTitle: 'Dogliotti 1870 | Historic Piedmont Estate, Barolo, Alta Langa & Moscato d’Asti',
      metaDescription: 'Discover Dogliotti 1870 from Castagnole delle Lanze, Piedmont, Italy. Fifth-generation family craft in UNESCO Langhe & Monferrato. Barolo, Barbaresco, Alta Langa, Moscato & Vermouth.',
      heroImageUrl: manifest.estate.dogliotti_langhe_monferrato_hero,
      logoUrl: manifest.estate.dogliotti_logo_transparent,
      galleryUrls: [
        manifest.estate.dogliotti_vineyard_panorama,
        manifest.estate.dogliotti_cask_barrel_hall,
        manifest.estate.dogliotti_historic_tasting_cellar,
        manifest.estate.dogliotti_rolling_hills,
        manifest.estate.dogliotti_brick_vault_cellar,
        manifest.estate.dogliotti_golden_sunset,
        manifest.estate.dogliotti_winery_courtyard
      ],
      story: {
        foundedYear: 1870,
        founders: 'Dogliotti Family (Fifth Generation: Erik, Ivan & Matteo Dogliotti)',
        winemaker: 'Erik Dogliotti',
        winemakerBio: 'Erik Dogliotti leads enology and cellar operations at Dogliotti 1870 alongside cousins Ivan and Matteo, continuing five generations rooted in Castagnole delle Lanze. Driven by indigenous Piedmont varieties, Erik crafts world-class Moscato, Alta Langa Metodo Classico, and monumental Barolo and Barbaresco.',
        history: 'A passion for wine has defined Dogliotti 1870 since its founding in 1870 in Castagnole delle Lanze (Asti). Set against the UNESCO World Heritage hills of Langhe, Roero, and Monferrato, the winery is revitalized by the fifth generation—Erik, Ivan, and Matteo Dogliotti—combining ancestral winemaking wisdom with cutting-edge cellar mastery.',
        philosophy: 'Honoring indigenous Piedmont varieties: Moscato, Barbera, and Nebbiolo above all. Preserving authenticity, terroir definition, and uncompromised cellar longevity across every bottle.',
        images: [
          manifest.estate.erik_dogliotti,
          manifest.estate.ivan_dogliotti,
          manifest.estate.matteo_dogliotti,
          manifest.estate.dogliotti_cask_barrel_hall
        ]
      },
      vineyard: {
        altitude: '250m – 450m',
        soil: 'Calcareous marl, white clay, sand and limestone terraces of Langhe and Monferrato UNESCO hills',
        climate: 'Continental Piedmont climate with alpine breezes, generous sunshine, and autumn mists (nebbia)',
        grapeVarieties: [
          'Moscato Bianco', 'Barbera', 'Nebbiolo', 'Arneis', 
          'Chardonnay', 'Pinot Nero', 'Dolcetto', 'Grignolino'
        ],
        viticulture: 'UNESCO World Heritage Biosphere, Sustainable Viticulture, Low Intervention, Hand Harvested',
        sustainability: 'Manual canopy management, organic compost fertilization, zero synthetic herbicides, solar cellar climate regulation',
        imageUrl: manifest.estate.dogliotti_vineyard_panorama
      },
      hospitality: {
        title: 'Historic Cellar & Piedmont Tasting Experiences',
        subtitle: 'Tradition, Atmosphere and Hospitality in Castagnole delle Lanze',
        hasTastings: true,
        tastingsImageUrl: manifest.estate.dogliotti_historic_tasting_cellar,
        tastings: [
          {
            name: 'Tra Langhe e Monferrato Discovery Flight',
            description: 'Guided sommelier tasting through indigenous Piedmont gems: Roero Arneis Docg, Dolcetto d\'Alba, Barbera d\'Asti Superiore, and fresh Moscato d\'Asti.',
            price: 250,
            duration: '60 minutes',
            capacity: 16,
            imageUrl: manifest.estate.dogliotti_historic_tasting_cellar,
            isAvailable: true
          },
          {
            name: 'Alta Langa Metodo Classico Masterclass',
            description: 'In-depth exploration of Piedmont bottle-fermented sparkling craft: Alta Langa Docg (42 months sur lies), Alta Langa Rosé (100% Nebbiolo), and Alta Langa Riserva (60 months sur lies).',
            price: 450,
            duration: '75 minutes',
            capacity: 12,
            imageUrl: manifest.estate.dogliotti_brick_vault_cellar,
            isAvailable: true
          },
          {
            name: 'Noble Terroirs: Barolo, Barbaresco & Nizza Cru Flight',
            description: 'Prestige flight featuring the monumental kings of Piedmont: Barolo Docg, Barbaresco Docg, and old-vine Nizza Docg paired with aged artisanal cheeses and Alba truffles.',
            price: 650,
            duration: '90 minutes',
            capacity: 10,
            imageUrl: manifest.estate.dogliotti_cask_barrel_hall,
            isAvailable: true
          },
          {
            name: 'Vermouth 18/70 Botanical Workshop & Heritage Pairing',
            description: 'Discover the ancient Piedmont art of Vermouth di Torino. Tasting of Vermouth Bianco (51 botanicals) and Vermouth Rosso (46 botanicals) with artisan pairings.',
            price: 300,
            duration: '60 minutes',
            capacity: 14,
            imageUrl: manifest.estate.dogliotti_winery_courtyard,
            isAvailable: true
          }
        ]
      },
      contact: {
        email: 'info@dogliotti1870.com',
        phone: '+39 0141 878147',
        website: 'https://dogliotti1870.com',
        address: 'Castagnole delle Lanze (Asti), Piedmont, Italy'
      }
    };

    if (!estate) {
      estate = await EstateProfile.create(estateData);
      console.log(`✅ Created EstateProfile for Dogliotti 1870.`);
    } else {
      Object.assign(estate, estateData);
      await estate.save();
      console.log(`✅ Updated EstateProfile for Dogliotti 1870.`);
    }

    // 4. SEED / UPDATE PRODUCTS
    console.log(`\nSeeding ${PRODUCTS_DATA.length} products for Dogliotti 1870...`);
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < PRODUCTS_DATA.length; i++) {
      const p = PRODUCTS_DATA[i];
      const prodSlug = slugify(p.name);
      const customId = `prod_dogl_${p.subcategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i + 1}`;
      const imageUrl = manifest.products[p.imageKey] || `/assets/products/dogliotti-1870/${p.imageKey}.png`;

      const productDoc = {
        id: customId,
        name: p.name,
        slug: prodSlug,
        brand: 'Dogliotti 1870',
        category: 'Wine',
        type: 'Wine',
        country: 'Italy',
        region: 'Piedmont',
        origin: 'Castagnole delle Lanze, Piedmont, Italy',
        size: p.size,
        bottleSize: p.size,
        subcategory: p.subcategory,
        description: p.description,
        price: p.price,
        retailPrice: parseFloat(p.price),
        salePrice: parseFloat(p.price),
        image: imageUrl,
        imageUrl: imageUrl,
        originalImage: imageUrl,
        gallery: [imageUrl],
        featured: !!p.featured,
        options: [p.size],
        tags: ['Dogliotti 1870', 'Italy', 'Piedmont', 'Langhe & Monferrato', p.subcategory, p.range, 'Wine', '2026 Price List'],
        tastingNotes: p.tastingNotes,
        flavorProfile: p.flavorProfile,
        foodPairing: p.foodPairing,
        identity: {
          type: 'Wine',
          style: p.subcategory,
          production: 'Dogliotti 1870 S.S., Castagnole delle Lanze, Piedmont, Italy',
          origin: 'Castagnole delle Lanze, Langhe & Monferrato, Piedmont, Italy',
          bottleSize: p.size,
          abv: p.abv,
          vintage: p.vintage,
          exwEur: p.exwEur
        },
        stock: 120,
        shipping: {
          box_type: 'Standard Luxury Bottle Box',
          weight_kg: 1.5,
          length_cm: 10.0,
          width_cm: 10.0,
          height_cm: 32.0,
          is_fragile: true,
          parcel_value: parseFloat(p.price),
          hs_code: '2204.21',
          aramexServiceType: 'ONP'
        },
        costing: {
          supplierPrice: p.exwEur,
          baseSellingPrice: parseFloat(p.price),
          minimumSellingPrice: parseFloat(p.price) * 0.85,
          rrp: parseFloat(p.price),
          platformMarginPct: 35,
          targetMarginPct: 35,
          marginStatus: 'healthy',
          exwPickingEur: p.exwEur,
          exw1PalletEur: p.exwEur,
          exw3PalletsEur: p.exwEur
        },
        vendorId: user._id,
        estateId: estate._id,
        approvalStatus: 'approved',
        status: 'published',
        catalogManaged: true,
        exportReady: true,
        tradePrice: Math.round(parseFloat(p.price) * 0.65),
        channelSettings: {
          retail: {
            enabled: true,
            allowSingleBottle: true,
            bottlePrice: parseFloat(p.price),
            casePrice: parseFloat(p.price) * p.case * 0.95,
            caseSize: p.case
          },
          trade: {
            enabled: true,
            exportReady: true,
            exportApprovalStatus: 'approved',
            minimumOrderQuantityBottles: p.case * 10,
            bottlesPerCase: p.case,
            casesPerPallet: 105,
            containerLoading: {
              twentyFootContainerCases: 11 * 105,
              fortyFootContainerCases: 24 * 105
            }
          }
        },
        isFeatured: !!p.featured,
        isApproved: true,
        isVerified: true,
        verificationBadge: 'Verified Producer'
      };

      const existing = await Product.findOne({ $or: [{ slug: prodSlug }, { id: customId }] });
      if (existing) {
        Object.assign(existing, productDoc);
        await existing.save();
        updatedCount++;
      } else {
        await Product.create(productDoc);
        createdCount++;
      }
    }

    console.log(`✅ Products complete: ${createdCount} created, ${updatedCount} updated.`);
    console.log(`\n🎉 SEED SUCCESSFUL!`);
    console.log(`Vendor Login: ${DOGLIOTTI_EMAIL} / ${DOGLIOTTI_PASSWORD}`);
    console.log(`Estate URL: /estate/dogliotti-1870`);
    console.log(`Wine Farm URL: /winefarm`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
