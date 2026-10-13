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

const BRUNO_EMAIL = 'bruno@brunoandreu.com';
const BRUNO_PASSWORD = 'BrunoAndreu2026!';

// 35 Products accurately extracted from the 2026 Bruno Andreu Price List (PDF 1) & Catalog (PDF 2)
const PRODUCTS_DATA = [
  // --- 1. VARIETAL RANGE (IGP Pays d'Oc, 750ml, Languedoc, France) ---
  {
    name: 'Bruno Andreu Sauvignon Blanc 2025',
    subcategory: 'Sauvignon Blanc',
    price: '165.00',
    exwEur: 2.97,
    size: '750ml',
    abv: '12.5%',
    description: 'Crisp and expressive French Sauvignon Blanc from Languedoc. Vibrant aromas of lemongrass, green apple, and white flowers with energetic citrus acidity and refreshing mineral finish.',
    tastingNotes: ['Lemongrass', 'Green Apple', 'White Flowers', 'Zesty Citrus', 'Crisp Minerality'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Seafood', 'Goat Cheese', 'Mediterranean Salads'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Chardonnay 2025',
    subcategory: 'Chardonnay',
    price: '175.00',
    exwEur: 3.07,
    size: '750ml',
    abv: '13.0%',
    description: 'Fresh and aromatic Languedoc Chardonnay. Offers notes of white peach, citrus blossom, and golden pear with a balanced, silky texture and a clean, luminous finish.',
    tastingNotes: ['White Peach', 'Citrus Blossom', 'Golden Pear', 'Silky Texture', 'Clean Finish'],
    flavorProfile: ['Light & Floral', 'Fresh'],
    foodPairing: ['Poultry', 'Shellfish', 'Creamy Pasta'],
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Viognier 2025',
    subcategory: 'Viognier',
    price: '185.00',
    exwEur: 3.17,
    size: '750ml',
    abv: '13.0%',
    description: 'Exotic and perfumed Mediterranean Viognier displaying ripe apricot, honeysuckle, and candied white peach with a rounded mouthfeel and aromatic grace.',
    tastingNotes: ['Ripe Apricot', 'Honeysuckle', 'White Peach', 'Orange Blossom', 'Aromatic Grace'],
    flavorProfile: ['Fruity & Spicy', 'Rich & Creamy'],
    foodPairing: ['Asian Cuisine', 'Roast Pork', 'Mild Curries'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Grenache Rosé 2025',
    subcategory: 'Rosé',
    price: '155.00',
    exwEur: 2.85,
    size: '750ml',
    abv: '12.5%',
    description: 'Delicate pale pink Languedoc rosé with vibrant summer berry aromatics, crisp watermelon, and a dry, invigorating Mediterranean palate.',
    tastingNotes: ['Wild Strawberry', 'Watermelon', 'Red Currant', 'Pink Grapefruit', 'Dry Finish'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Tapas', 'Grilled Fish', 'Charcuterie'],
    image: 'https://images.unsplash.com/photo-1558001373-4b9344234031?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Merlot 2025',
    subcategory: 'Merlot',
    price: '155.00',
    exwEur: 2.85,
    size: '750ml',
    abv: '13.5%',
    description: 'Generous and approachable red displaying ripe black plum, dark cherry, and gentle Provencal thyme with soft, supple tannins for immediate enjoyment.',
    tastingNotes: ['Black Plum', 'Dark Cherry', 'Garrigue Herbs', 'Soft Cocoa', 'Supple Tannins'],
    flavorProfile: ['Fruity & Spicy', 'Soft'],
    foodPairing: ['Beef & Steak', 'Roast Lamb', 'Aged Cheese'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Syrah 2025',
    subcategory: 'Syrah',
    price: '155.00',
    exwEur: 2.85,
    size: '750ml',
    abv: '13.5%',
    description: 'Classic southern French Syrah bursting with crushed blackberries, cracked black pepper, violet florals, and a velvety lingering finish.',
    tastingNotes: ['Crushed Blackberry', 'Black Pepper', 'Violet', 'Smoked Plum', 'Velvet Finish'],
    flavorProfile: ['Rich & Full-Bodied', 'Fruity & Spicy'],
    foodPairing: ['Barbecue', 'Game', 'Charcuterie'],
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Cabernet Sauvignon 2025',
    subcategory: 'Cabernet Sauvignon',
    price: '155.00',
    exwEur: 2.85,
    size: '750ml',
    abv: '13.5%',
    description: 'Structured Languedoc Cabernet Sauvignon showcasing dark cassis, cedarwood, bell pepper notes, and ripe, firm tannins built for volume and margin stability.',
    tastingNotes: ['Dark Cassis', 'Cedarwood', 'Blackcurrant', 'Earthy Spice', 'Firm Tannins'],
    flavorProfile: ['Rich & Full-Bodied', 'Savory'],
    foodPairing: ['Grilled Ribeye', 'Hard Cheeses', 'Venison'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Pinot Noir 2025',
    subcategory: 'Pinot Noir',
    price: '170.00',
    exwEur: 2.99,
    size: '750ml',
    abv: '13.0%',
    description: 'Fresh and elegant French Pinot Noir expressing bright red cherries, forest floor notes, and delicate clove spice with a graceful silky finish.',
    tastingNotes: ['Red Cherry', 'Wild Strawberry', 'Forest Floor', 'Clove', 'Silky Tannins'],
    flavorProfile: ['Light & Floral', 'Fruity & Spicy'],
    foodPairing: ['Duck Breast', 'Roast Salmon', 'Mushroom Risotto'],
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Chardonnay Oaky',
    subcategory: 'Chardonnay',
    price: '245.00',
    exwEur: 4.35,
    size: '750ml',
    abv: '13.5%',
    description: 'Rich barrel-influenced Chardonnay with toasted French brioche, vanilla bean, roasted hazelnuts, and a sumptuous creamy palate balanced by citrus freshness.',
    tastingNotes: ['Toasted Brioche', 'Vanilla Bean', 'Roasted Hazelnut', 'Golden Apple', 'Creamy Finish'],
    flavorProfile: ['Rich & Creamy', 'Oak Matured'],
    foodPairing: ['Lobster', 'Roast Chicken', 'Gruyère Cheese'],
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Cab-Sauvignon Oaky',
    subcategory: 'Cabernet Sauvignon',
    price: '235.00',
    exwEur: 4.15,
    size: '750ml',
    abv: '14.0%',
    description: 'Barrel-aged Cabernet Sauvignon offering opulent black cherry, dark cocoa, toasted oak staves, and plush structured tannins with impressive depth.',
    tastingNotes: ['Black Cherry', 'Dark Cocoa', 'Toasted Oak', 'Roasted Coffee', 'Plush Tannins'],
    flavorProfile: ['Rich & Full-Bodied', 'Oak Matured'],
    foodPairing: ['Prime Rib', 'Braised Short Ribs', 'Mature Gouda'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },

  // --- 2. AUTHENTIC RANGE (AOP Languedoc & Coastal Terroirs) ---
  {
    name: 'Bruno Andreu Gris de Gris Rosé 2025',
    subcategory: 'Rosé',
    price: '215.00',
    exwEur: 3.80,
    size: '750ml',
    abv: '12.5%',
    description: 'Classic sand-grown Gris de Gris rosé from coastal Mediterranean shores. Pale coral tint, delicate white peach, saline minerality, and sea-breeze freshness.',
    tastingNotes: ['White Peach', 'Crushed Cranberry', 'Sea Salt', 'Citrus Peel', 'Mineral Finish'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Oysters', 'Grilled Calamari', 'Summer Salads'],
    image: 'https://images.unsplash.com/photo-1558001373-4b9344234031?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu AOP Picpoul de Pinet 2025',
    subcategory: 'Picpoul de Pinet',
    price: '260.00',
    exwEur: 4.60,
    size: '750ml',
    abv: '13.0%',
    description: 'Renowned Mediterranean appellation wine from Thau lagoon limestone terroir. Zesty lemon zest, green melon, crushed seashells, and electrifying maritime acidity.',
    tastingNotes: ['Zesty Lemon', 'Green Melon', 'Crushed Seashells', 'Aniseed', 'Vibrant Acidity'],
    flavorProfile: ['Crisp & Fresh', 'Savory'],
    foodPairing: ['Fresh Oysters', 'Mussels Marinière', 'Grilled Sea Bass'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu AOP Languedoc GSM 2023/24',
    subcategory: 'Red Blend',
    price: '195.00',
    exwEur: 3.50,
    size: '750ml',
    abv: '14.0%',
    description: 'Benchmark Languedoc blend of Grenache, Syrah, and Mourvèdre. Expresses wild garrigue herbs, ripe bramble fruit, crushed peppercorn, and supple Mediterranean warmth.',
    tastingNotes: ['Wild Garrigue', 'Ripe Bramble', 'Crushed Pepper', 'Dark Plum', 'Supple Warmth'],
    flavorProfile: ['Rich & Full-Bodied', 'Fruity & Spicy'],
    foodPairing: ['Cassoulet', 'Grilled Lamb Chops', 'Provençal Stew'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu AOP Languedoc GRM 2024/25',
    subcategory: 'Red Blend',
    price: '205.00',
    exwEur: 3.60,
    size: '750ml',
    abv: '14.0%',
    description: 'Harmonious Mediterranean cuvée of Grenache and Mourvèdre with aromatic nuance. Concentrated red berries, wild thyme, and a lingering velvety finish.',
    tastingNotes: ['Red Cherry', 'Wild Thyme', 'Sweet Spice', 'Blackberry', 'Velvety Palate'],
    flavorProfile: ['Fruity & Spicy', 'Rich & Full-Bodied'],
    foodPairing: ['Roast Duck', 'Herb-Crusted Pork', 'Artisanal Salami'],
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
  },

  // --- 3. ICONIC RANGE (The Elixir Line — Flagship Masterpieces) ---
  {
    name: 'Bruno Andreu Elixir Rosé 2025',
    subcategory: 'Rosé',
    price: '355.00',
    exwEur: 6.30,
    size: '750ml',
    abv: '13.0%',
    featured: true,
    description: 'Iconic luxury Mediterranean Rosé presented in bespoke heavy glass (also available in Magnum). Wild alpine strawberries, rose petals, white nectarine, and silky gastronomic depth.',
    tastingNotes: ['Alpine Strawberry', 'Rose Petal', 'White Nectarine', 'Silky Texture', 'Gastronomic Depth'],
    flavorProfile: ['Light & Floral', 'Rich & Creamy'],
    foodPairing: ['Lobster Thermidor', 'Truffled Risotto', 'Fine Dining Tapas'],
    image: 'https://images.unsplash.com/photo-1558001373-4b9344234031?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Elixir Rouge 2023/24',
    subcategory: 'Red Blend',
    price: '355.00',
    exwEur: 6.30,
    size: '750ml',
    abv: '14.5%',
    featured: true,
    description: 'Masterpiece Mediterranean red cuvée crafted from elite selected parcels. Ripe cassis, dark truffle, toasted spices, and regal polished tannins with extended aging potential.',
    tastingNotes: ['Ripe Cassis', 'Dark Truffle', 'Toasted Spice', 'Black Cherry', 'Polished Tannins'],
    flavorProfile: ['Rich & Full-Bodied', 'Oak Matured'],
    foodPairing: ['Filet Mignon', 'Slow-Cooked Oxtail', 'Aged Comté'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Elixir Blanc 2024/25',
    subcategory: 'White Blend',
    price: '365.00',
    exwEur: 6.50,
    size: '750ml',
    abv: '13.5%',
    featured: true,
    description: 'Prestigious white cuvée marrying complexity, mineral tension, and Mediterranean opulence. Notes of candied citrus, white flowers, toasted brioche, and crystalline finish.',
    tastingNotes: ['Candied Citrus', 'White Acacia', 'Toasted Brioche', 'Quince', 'Crystalline Finish'],
    flavorProfile: ['Rich & Creamy', 'Fresh'],
    foodPairing: ['Pan-Seared Scallops', 'Turbot with Hollandaise', 'Roast Veal'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },

  // --- 4. LUXURY RANGE (Single Varietals & High-Altitude Terroirs) ---
  {
    name: 'Bruno Andreu Petite Syrah 2021',
    subcategory: 'Syrah',
    price: '355.00',
    exwEur: 6.30,
    size: '750ml',
    abv: '14.5%',
    description: 'Rare southern French single-plot Petite Syrah. Inky purple hue, explosive black fruit, cocoa nibs, cracked pepper, and magnificent tannic backbone.',
    tastingNotes: ['Inky Blueberry', 'Cocoa Nibs', 'Black Pepper', 'Dense Cassis', 'Commanding Tannins'],
    flavorProfile: ['Rich & Full-Bodied', 'Savory'],
    foodPairing: ['Smoked Brisket', 'Wild Boar Stew', 'Gorgonzola'],
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Petit Verdot 2022',
    subcategory: 'Petit Verdot',
    price: '365.00',
    exwEur: 6.50,
    size: '750ml',
    abv: '14.0%',
    description: 'Pure 100% Petit Verdot grown under intense Mediterranean sunshine. Crushed violets, graphite minerality, black plum, and remarkable freshness.',
    tastingNotes: ['Crushed Violet', 'Graphite', 'Black Plum', 'Ink', 'Intense Freshness'],
    flavorProfile: ['Rich & Full-Bodied', 'Fruity & Spicy'],
    foodPairing: ['Roast Venison', 'Dry-Aged Sirloin', 'Blue Cheese'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Grenache 2020',
    subcategory: 'Grenache',
    price: '365.00',
    exwEur: 6.50,
    size: '750ml',
    abv: '14.5%',
    description: 'Single-vineyard old-vine Grenache Noir. Concentrated kirsch cherry, dried wild lavender, blood orange zest, and a sumptuous velvety mouthfeel.',
    tastingNotes: ['Kirsch Cherry', 'Dried Lavender', 'Blood Orange', 'Warm Spice', 'Velvety Finish'],
    flavorProfile: ['Fruity & Spicy', 'Rich & Full-Bodied'],
    foodPairing: ['Slow-Roasted Lamb', 'Duck Confit', 'Manchego'],
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Gewürztraminer 2023',
    subcategory: 'Gewürztraminer',
    price: '340.00',
    exwEur: 6.00,
    size: '750ml',
    abv: '13.0%',
    description: 'An exceptional Mediterranean expression of Gewürztraminer. Enchanting aromas of lychee, Turkish delight, cardamom, and rose water with a succulent dry finish.',
    tastingNotes: ['Lychee', 'Turkish Delight', 'Cardamom', 'Rose Water', 'Exotic Perfume'],
    flavorProfile: ['Light & Floral', 'Sweet'],
    foodPairing: ['Thai Curries', 'Moroccan Tagine', 'Munster Cheese'],
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Pézenas BA 2019',
    subcategory: 'Red Blend',
    price: '435.00',
    exwEur: 7.70,
    size: '750ml',
    abv: '14.5%',
    description: 'Prestige AOP Languedoc-Pézenas cru from basaltic volcanic slopes. Dark brooding cassis, garrigue minerals, tobacco leaf, and fine French oak integration.',
    tastingNotes: ['Basaltic Mineral', 'Brooding Cassis', 'Tobacco Leaf', 'Black Truffle', 'Refined French Oak'],
    flavorProfile: ['Rich & Full-Bodied', 'Oak Matured'],
    foodPairing: ['Tournedos Rossini', 'Roast Pigeon', 'Aged Roquefort'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Tautavel BA 2020',
    subcategory: 'Red Blend',
    price: '445.00',
    exwEur: 7.90,
    size: '750ml',
    abv: '14.5%',
    description: 'Côtes du Roussillon Villages Tautavel terroir. Sourced from ancient rocky limestone amphitheaters; delivers wild blackberry, crushed flint, and dramatic muscular power.',
    tastingNotes: ['Wild Blackberry', 'Crushed Flint', 'Dark Rosemary', 'Smoked Fig', 'Muscular Finish'],
    flavorProfile: ['Rich & Full-Bodied', 'Savory'],
    foodPairing: ['Grilled T-Bone', 'Wild Boar Sausage', 'Truffled Cheeses'],
    image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Caramany BA 2021',
    subcategory: 'Red Blend',
    price: '485.00',
    exwEur: 8.60,
    size: '750ml',
    abv: '14.5%',
    description: 'High-altitude Côtes du Roussillon Villages Caramany from granite and gneiss soils. Exceptional pure black fruit, intense freshness, and refined aristocratic tannins.',
    tastingNotes: ['Crushed Granite', 'Black Forest Fruits', 'Licorice Root', 'Vibrant Freshness', 'Aristocratic Tannins'],
    flavorProfile: ['Rich & Full-Bodied', 'Savory'],
    foodPairing: ['Roast Saddle of Lamb', 'Venison Steak', 'Mature Cheddar'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Latour de France 2021',
    subcategory: 'Red Blend',
    price: '375.00',
    exwEur: 6.70,
    size: '750ml',
    abv: '14.0%',
    description: 'Iconic village cru from grey schist slopes in the Agly Valley. Brooding dark cherries, wild mountain thyme, graphite tension, and lingering smoky complexity.',
    tastingNotes: ['Dark Cherry', 'Schist Minerality', 'Mountain Thyme', 'Smoky Graphite', 'Complex Finish'],
    flavorProfile: ['Rich & Full-Bodied', 'Fruity & Spicy'],
    foodPairing: ['Herb-Crusted Rack of Lamb', 'Braised Beef Cheeks', 'Stilton'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },

  // --- 5. EDITION LIMITÉE (Prestige Craft & Rare Allocations) ---
  {
    name: 'Bruno Andreu Orange Wine 2024',
    subcategory: 'Orange Wine',
    price: '260.00',
    exwEur: 4.60,
    size: '750ml',
    abv: '12.5%',
    description: 'Skin-contact artisanal white wine fermented on skins for 3 weeks. Amber glow, candied Seville orange peel, dried apricot, subtle black tea tannins, and dry saline refreshment.',
    tastingNotes: ['Candied Orange Peel', 'Dried Apricot', 'Black Tea Tannins', 'White Pepper', 'Saline Freshness'],
    flavorProfile: ['Crisp & Fresh', 'Savory'],
    foodPairing: ['Middle Eastern Mezze', 'Roast Pork Belly', 'Washed Rind Cheeses'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Méthode Traditionnelle Blanc de Blanc Brut',
    subcategory: 'Sparkling Wine',
    price: '480.00',
    exwEur: 8.50,
    size: '750ml',
    abv: '12.0%',
    featured: true,
    description: 'Classic French traditional bottle-fermented sparkling wine aged on fine lees. Delicate effervescent bead, golden delicious apple, warm brioche, and bright celebratory crispness.',
    tastingNotes: ['Fine Persistent Bead', 'Golden Apple', 'Warm Brioche', 'Lemon Zest', 'Crisp Elegance'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Caviar', 'Fresh Oysters', 'Celebration Toasts'],
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Grande Cuvée 2021 100% Mourvèdre',
    subcategory: 'Mourvèdre',
    price: '5500.00',
    exwEur: 99.00,
    size: '750ml',
    abv: '15.0%',
    featured: true,
    description: 'The pinnacle of Maison Bruno Andreu (€99.00 EXW). Sourced from a centenarian single-plot 100% Mourvèdre, aged in new French oak barrels. Sovereign concentration, truffles, black leather, and decadal cellar longevity.',
    tastingNotes: ['Centenarian Mourvèdre', 'Black Truffle', 'Cacao', 'Aged Leather', 'Monolithic Longevity'],
    flavorProfile: ['Rich & Full-Bodied', 'Oak Matured'],
    foodPairing: ['Wagyu Beef', 'Roast Venison with Morels', 'Private Collector Vaults'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },

  // --- 6. INNOVATION ALCOHOL FREE (0.0% Dealcoholized VDF - Page 3) ---
  {
    name: 'Bruno Andreu VDF Premium Dealcoholized Chardonnay',
    subcategory: 'Non-Alcoholic Wine',
    price: '280.00',
    exwEur: 4.96,
    size: '750ml',
    abv: '0.0%',
    featured: true,
    description: 'State-of-the-art French dealcoholized Chardonnay retaining 100% varietal essence without alcohol. Crisp green apple, white flowers, citrus zest, and clean refreshing body.',
    tastingNotes: ['Green Apple', 'White Flowers', 'Citrus Zest', 'Clean Freshness', '0.0% Alcohol'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Salads', 'Seafood', 'Wellness Dining'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu VDF Premium Dealcoholized Syrah Rosé',
    subcategory: 'Non-Alcoholic Wine',
    price: '250.00',
    exwEur: 4.45,
    size: '750ml',
    abv: '0.0%',
    featured: true,
    description: 'Vibrant French dealcoholized rosé crafted from Languedoc Syrah. Red berry aromatics, crisp cranberry, and a dry, thirst-quenching finish tailored for modern conscious consumption.',
    tastingNotes: ['Red Berries', 'Crisp Cranberry', 'Pink Floral', 'Invigorating Finish', '0.0% Alcohol'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Mediterranean Tapas', 'Sushi', 'Daytime Celebrations'],
    image: 'https://images.unsplash.com/photo-1558001373-4b9344234031?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu VDF Premium Dealcoholized Merlot',
    subcategory: 'Non-Alcoholic Wine',
    price: '240.00',
    exwEur: 4.26,
    size: '750ml',
    abv: '0.0%',
    description: 'Sophisticated zero-alcohol French red wine crafted from ripe Merlot grapes. Notes of juicy black cherries, sweet plum, and gentle tannins with zero alcohol content.',
    tastingNotes: ['Black Cherry', 'Sweet Plum', 'Soft Tannins', 'Clean Red Finish', '0.0% Alcohol'],
    flavorProfile: ['Fruity & Spicy', 'Soft'],
    foodPairing: ['Grilled Vegetables', 'Pasta', 'Cheese Platters'],
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu VDF Sparkling Dealcoholized Chardonnay',
    subcategory: 'Non-Alcoholic Wine',
    price: '360.00',
    exwEur: 6.44,
    size: '750ml',
    abv: '0.0%',
    featured: true,
    description: 'Celebratory French dealcoholized sparkling Chardonnay cuvée. Persistent fine bubbles, crisp orchard apples, delicate white blossoms, and refreshing festive luxury.',
    tastingNotes: ['Persistent Fizz', 'Orchard Apple', 'White Blossom', 'Crisp Refreshment', '0.0% Alcohol'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Canapés', 'Brunch Toasts', 'Celebration Feasts'],
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Sparkling Dealcoholized Colombard',
    subcategory: 'Non-Alcoholic Wine',
    price: '340.00',
    exwEur: 6.02,
    size: '750ml',
    abv: '0.0%',
    description: 'Lively zero-alcohol sparkling French Colombard with vibrant tropical lime, crunchy green pear, and refreshing energetic effervescence.',
    tastingNotes: ['Tropical Lime', 'Green Pear', 'Lively Effervescence', 'Pure Fruit Freshness', '0.0% Alcohol'],
    flavorProfile: ['Crisp & Fresh', 'Light & Floral'],
    foodPairing: ['Seafood Platters', 'Fruit Salads', 'Aperitifs'],
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
  },
  {
    name: 'Bruno Andreu Non-Fermented Sparkling Muscat',
    subcategory: 'Non-Alcoholic Wine',
    price: '315.00',
    exwEur: 5.60,
    size: '750ml',
    abv: '0.0%',
    description: 'All-natural non-fermented sparkling Muscat grape cuvée. Fragrant orange blossom, sweet white peach, honeyed nectar, and delicious fine carbonation for all ages.',
    tastingNotes: ['Orange Blossom', 'White Peach', 'Honeyed Nectar', 'Fragrant Muscat', '0.0% Alcohol'],
    flavorProfile: ['Light & Floral', 'Sweet'],
    foodPairing: ['Desserts', 'Fruit Tarts', 'Family Celebrations'],
    image: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
  },

  // --- 7. ROSÉ WINE IN CAN (Dinky Pétanque 250ml Slim Can - Page 3) ---
  {
    name: 'Bruno Andreu Dinky Pétanque Lightly Sparkling Rosé 250ml Can',
    subcategory: 'Rosé',
    price: '85.00',
    exwEur: 2.10,
    size: '250ml',
    abv: '11.5%',
    featured: true,
    description: 'Trendy French lifestyle innovation targeting modern outdoor occasions. Lightly sparkling Rosé wine (11.5% vol) packed in a 250ml slim recyclable can. Notes of red berries and refreshing summer fizz.',
    tastingNotes: ['Red Berry Burst', 'Light Sparkle', 'Summer Watermelon', 'Crisp Portable Refreshment'],
    flavorProfile: ['Crisp & Fresh', 'Fruity & Spicy'],
    foodPairing: ['Picnics', 'Music Festivals', 'Casual Tapas'],
    image: 'https://images.unsplash.com/photo-1558001373-4b9344234031?q=80&w=1000&auto=format&fit=crop'
  }
];

async function seedBrunoAndreu() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. CREATE OR UPDATE USER ACCOUNT
    console.log(`Checking user account for ${BRUNO_EMAIL}...`);
    let user = await User.findOne({ email: BRUNO_EMAIL.toLowerCase() });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(BRUNO_PASSWORD, salt);

    if (!user) {
      user = await User.create({
        name: 'Bruno Andreu',
        email: BRUNO_EMAIL.toLowerCase(),
        password: passwordHash,
        role: 'vendor_active',
        isEmailVerified: true,
        isAgeVerified: true,
        phone: '+33 4 67 00 00 00',
        customerTier: 'vendor'
      });
      console.log(`✅ Created Vendor User account: ${user.email} (Role: ${user.role})`);
    } else {
      user.name = 'Bruno Andreu';
      user.password = passwordHash;
      user.role = 'vendor_active';
      user.isEmailVerified = true;
      user.isAgeVerified = true;
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
        legalName: 'Maison Bruno Andreu SAS',
        tradingName: 'Bruno Andreu',
        registrationNumber: 'FR-34290-BA-2026',
        businessType: 'Wine Producer, Vigneron & Negociant-Eleveur',
        address: 'Route des Vignes, 34290 Montblanc, Languedoc, France',
        bannerUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop',
        logoUrl: '/assets/vendors/bruno-andreu-logo.png'
      },
      storyInfo: {
        brandStory: 'Creator of Iconic Wines — Emotion in Every Glass. Over 8 generations of winemaking heritage in Languedoc, France, crafting bespoke programs, premium Mediterranean terroirs, and dealcoholized innovations.',
        winemakerBio: 'Bruno Andreu — studied water engineering in 1995 before following love to Montpellier in 1996 and embracing wine with his wife from an 8-generation vigneron family. Founded Maison Bruno Andreu in 2018, now distributing 600,000 bottles annually in +30 countries.'
      },
      shippingProfile: {
        pickupAddress: {
          addressLine1: 'Maison Bruno Andreu Cellars',
          city: 'Montblanc',
          state: 'Hérault, Languedoc',
          postalCode: '34290',
          country: 'France'
        }
      },
      productCategories: ['Wine']
    };

    if (!vendor) {
      vendor = await Vendor.create(vendorData);
      console.log(`✅ Created Vendor profile for Bruno Andreu.`);
    } else {
      Object.assign(vendor, vendorData);
      await vendor.save();
      console.log(`✅ Updated Vendor profile for Bruno Andreu.`);
    }

    // 3. CREATE OR UPDATE ESTATE PROFILE
    console.log(`Checking EstateProfile for slug: bruno-andreu...`);
    let estate = await EstateProfile.findOne({ slug: 'bruno-andreu' });
    const estateData = {
      vendorId: user._id,
      slug: 'bruno-andreu',
      estateName: 'Maison Bruno Andreu',
      country: 'France',
      region: 'Languedoc-Roussillon (Montblanc)',
      tagline: 'Creator of Iconic Wines — Emotion in Every Glass',
      isPublished: true,
      seoTitle: 'Maison Bruno Andreu | Iconic French Languedoc Wines & Estate Allocations',
      metaDescription: 'Discover Maison Bruno Andreu from Languedoc, France. Emotion in every glass across Varietal, Authentic, Iconic, Luxury, and Innovation Alcohol-Free collections.',
      heroImageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop',
      logoUrl: '/assets/brands/bruno-andreu-logo.png',
      galleryUrls: [
        'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1558001373-4b9344234031?q=80&w=1000&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?q=80&w=1000&auto=format&fit=crop'
      ],
      story: {
        foundedYear: 2018,
        founders: 'Bruno Andreu',
        winemaker: 'Bruno Andreu',
        winemakerBio: 'Studying to become a water engineer in 1995, Bruno followed his heart to Montpellier in 1996, falling in love with wine and his wife, whose family represents eight generations of winemakers. After a decade travelling the world exploring the wine trade and global terroirs, Bruno established Maison Bruno Andreu in 2018, now exporting 600,000 bottles annually across more than 30 countries.',
        history: 'From water engineer to creator of iconic French wines: Bruno Andreu\'s journey started in 1995 when love led him to Montpellier and an eight-generation winemaking family. After 10 years exploring international wine markets, Bruno launched his own independent label in 2018 in Montblanc (Languedoc, France). Today, Bruno Andreu exports over 600,000 bottles annually across more than 30 countries, operating with agility, bespoke winemaking programs, and pioneering dealcoholized innovations.',
        philosophy: 'Emotion in every glass. Combining high French terroir expression, agile bespoke programs, clean approachable turnover styles, and pioneering dealcoholized innovations.',
        images: [
          'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop'
        ]
      },
      vineyard: {
        altitude: '50m – 350m',
        soil: 'Clay-limestone terraces, schist, quartz pebbles, and Mediterranean alluvial gravel across Languedoc terroirs',
        climate: 'Mediterranean (200,000 hectares, multiple microclimates, exceptional sunshine, coastal breezes)',
        grapeVarieties: [
          'Sauvignon Blanc', 'Chardonnay', 'Viognier', 'Grenache', 'Merlot', 
          'Syrah', 'Cabernet Sauvignon', 'Pinot Noir', 'Picpoul', 'Mourvèdre', 
          'Petit Verdot', 'Gewürztraminer', 'Colombard', 'Muscat'
        ],
        viticulture: 'High Environmental Value (HVE), Sustainable Viticulture, Pays d\'Oc IGP & AOP Languedoc',
        sustainability: 'Eco-responsible vineyard practices, water preservation, low-intervention vinification, recyclable lightweight bottles',
        imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop'
      },
      hospitality: {
        title: 'Cellar Door & Tasting Experiences',
        subtitle: 'Welcome to the Cellar — Discover our winemaking craft in Montblanc, Languedoc',
        hasTastings: true,
        tastingsImageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop',
        tastings: [
          {
            name: 'Creator Discovery Tasting',
            description: 'Guided tasting through the Varietal, Authentic, and Iconic collections with cellar sommelier',
            price: 250,
            duration: '60 minutes',
            capacity: 15,
            imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=1000&auto=format&fit=crop',
            isAvailable: true
          },
          {
            name: 'Bespoke Masterclass & Cellar Walkthrough',
            description: 'Hands-on exploration of custom blend formulation, barrel tastings, and luxury single-plot cuvées',
            price: 500,
            duration: '90 minutes',
            capacity: 10,
            imageUrl: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1000&auto=format&fit=crop',
            isAvailable: true
          },
          {
            name: 'Zero-Alcohol Innovation Flight',
            description: 'Sensory flight of 0.0% dealcoholized Chardonnays, Syrahs, and sparkling wines',
            price: 200,
            duration: '45 minutes',
            capacity: 12,
            imageUrl: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=1000&auto=format&fit=crop',
            isAvailable: true
          }
        ]
      },
      contact: {
        email: BRUNO_EMAIL,
        phone: '+33 4 67 00 00 00',
        website: 'https://www.brunoandreu.com',
        address: 'Route des Vignes, 34290 Montblanc, Languedoc, France',
        instagram: 'https://instagram.com/brunoandreu_wines',
        facebook: 'https://facebook.com/brunoandreuwines'
      },
      awards: [
        'Global Export Leader: 95% Distribution Across +30 Countries with +120 International Partners',
        'Pioneer in Dealcoholized Innovation: Award-Winning 0.0% VDF Premium Range',
        'Top Selection: Exceptional Mediterranean Terroir & Pays d\'Oc Excellence'
      ]
    };

    if (!estate) {
      estate = await EstateProfile.create(estateData);
      console.log(`✅ Created Estate Profile: Maison Bruno Andreu (slug: ${estate.slug})`);
    } else {
      Object.assign(estate, estateData);
      await estate.save();
      console.log(`✅ Updated Estate Profile: Maison Bruno Andreu (slug: ${estate.slug})`);
    }

    // 4. SEED RETAIL PRODUCTS
    console.log(`Seeding ${PRODUCTS_DATA.length} Bruno Andreu retail products...`);
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < PRODUCTS_DATA.length; i++) {
      const pData = PRODUCTS_DATA[i];
      const prodSlug = slugify(pData.name);
      const customId = `prod_ba_${pData.subcategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${i + 1}`;

      const productPayload = {
        name: pData.name,
        slug: prodSlug,
        type: 'Wine',
        category: 'Wine',
        country: 'France',
        brand: 'Bruno Andreu',
        size: pData.size,
        subcategory: pData.subcategory,
        description: pData.description,
        price: pData.price,
        image: pData.image,
        featured: !!pData.featured,
        options: [pData.size],
        tags: ['Bruno Andreu', 'France', 'Languedoc', pData.subcategory, 'Pays d\'Oc', 'Wine'],
        tastingNotes: pData.tastingNotes,
        flavorProfile: pData.flavorProfile,
        foodPairing: pData.foodPairing,
        identity: {
          type: 'Wine',
          style: pData.subcategory,
          production: 'Maison Bruno Andreu, Montblanc, Languedoc, France',
          origin: 'Languedoc-Roussillon, France',
          bottleSize: pData.size,
          abv: pData.abv
        },
        stock: 60,
        shipping: {
          box_type: pData.size === '250ml' ? 'Standard Box' : 'Standard Luxury Bottle Box',
          weight_kg: pData.size === '250ml' ? 0.35 : 1.5,
          length_cm: pData.size === '250ml' ? 6.0 : 10.0,
          width_cm: pData.size === '250ml' ? 6.0 : 10.0,
          height_cm: pData.size === '250ml' ? 14.0 : 32.0,
          is_fragile: pData.size !== '250ml',
          parcel_value: parseFloat(pData.price),
          hs_code: '2204.21',
          aramexServiceType: 'ONP'
        },
        costing: {
          supplierPrice: pData.exwEur,
          baseSellingPrice: parseFloat(pData.price),
          minimumSellingPrice: parseFloat(pData.price) * 0.85,
          rrp: parseFloat(pData.price),
          platformMarginPct: 35,
          targetMarginPct: 35,
          marginStatus: 'healthy'
        },
        vendorId: user._id,
        approvalStatus: 'approved',
        catalogManaged: true
      };

      let existing = await Product.findOne({
        $or: [
          { slug: prodSlug },
          { name: pData.name }
        ]
      });

      if (!existing) {
        await Product.create({
          id: customId,
          ...productPayload
        });
        createdCount++;
      } else {
        Object.assign(existing, productPayload);
        await existing.save();
        updatedCount++;
      }
    }

    console.log(`\n🎉 SEEDING COMPLETED SUCCESSFULLY!`);
    console.log(`===============================================`);
    console.log(`👤 VENDOR ACCOUNT:`);
    console.log(`   Email:    ${BRUNO_EMAIL}`);
    console.log(`   Password: ${BRUNO_PASSWORD}`);
    console.log(`   Role:     ${user.role}`);
    console.log(`   User ID:  ${user._id}`);
    console.log(`===============================================`);
    console.log(`🏰 ESTATE PROFILE:`);
    console.log(`   Name:     ${estate.estateName}`);
    console.log(`   Slug:     ${estate.slug}`);
    console.log(`   Region:   ${estate.region}, ${estate.country}`);
    console.log(`===============================================`);
    console.log(`🍷 RETAIL PRODUCTS:`);
    console.log(`   Total Cataloged: ${PRODUCTS_DATA.length} products`);
    console.log(`   New Inserted:    ${createdCount}`);
    console.log(`   Updated:         ${updatedCount}`);
    console.log(`===============================================`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Bruno Andreu:', error);
    process.exit(1);
  }
}

seedBrunoAndreu();
