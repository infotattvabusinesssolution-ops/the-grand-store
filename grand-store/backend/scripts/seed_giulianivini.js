const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const EstateProfile = require('../models/EstateProfile');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const vendor = await User.findOne({ 
      $or: [
        { name: { $regex: /giulianivini/i } },
        { email: { $regex: /giulianivini/i } },
        { storeName: { $regex: /giulianivini/i } }
      ]
    });

    if (!vendor) {
      console.log('Vendor giulianivini not found in DB.');
      process.exit(1);
    }

    console.log('Found vendor:', vendor.name, vendor.email);

    const profileData = {
      vendorId: vendor._id,
      slug: 'giulianivini',
      isPublished: true,
      seoTitle: 'Giuliani - Amore per la terra, passione per i vini',
      metaDescription: 'Amore per la terra, passione per i vini. Giuliani Vini offers authentic Italian wine experiences.',
      
      // Hero & Media
      heroImageUrl: 'https://giulianivini.com/wp-content/uploads/2022/06/home-news.jpg',
      galleryUrls: [
        'https://giulianivini.com/wp-content/uploads/2022/06/overlay.jpg',
        'https://giulianivini.com/wp-content/uploads/2022/06/home-primitivo-gioia-del-colle-giuliani.jpg',
        'https://giulianivini.com/wp-content/uploads/2022/06/home-campi-giuliani.jpg',
        'https://giulianivini.com/wp-content/uploads/2022/06/benvenuti-in-giuliani.jpg'
      ],

      // Core Info
      estateName: 'Giuliani Vini',
      region: 'Gioia del Colle (BA), Puglia',
      country: 'Italy',
      tagline: 'Amore per la terra, passione per i vini',

      // Our Story
      story: {
        foundedYear: 1980,
        founders: 'Donato Giuliani',
        history: 'Giuliani Vini is deeply rooted in the heart of Puglia. Our estate has a deep love for the land and a passion for wines. We craft our wines respecting the traditions and the terroir, ensuring every bottle tells a story of our heritage.',
        winemaker: 'Vito Donato Giuliani',
        winemakerBio: 'Vito Donato Giuliani brings decades of passion and expertise to the art of winemaking in Puglia, combining traditional methods with modern innovation to express the true potential of Primitivo and Aleatico.',
        philosophy: 'Amore per la terra, passione per i vini. (Love for the land, passion for wines)',
        images: [
          'https://giulianivini.com/wp-content/uploads/2022/06/home-donato-giuliani.jpg',
          'https://giulianivini.com/wp-content/uploads/2022/06/home-ricciolo-giuliani.jpg',
          'https://giulianivini.com/wp-content/uploads/2022/06/baronaggio-giuliani.jpg'
        ],
      },

      // Vineyard Details
      vineyard: {
        altitude: '360m above sea level',
        soil: 'Red soil with limestone and clay',
        climate: 'Mediterranean with high temperature variations',
        grapeVarieties: ['Primitivo', 'Aleatico', 'Fiano'],
        viticulture: 'Organic & Sustainable Practices',
        sustainability: 'Committed to preserving the local biodiversity and natural environment.',
        imageUrl: 'https://giulianivini.com/wp-content/uploads/2022/06/wine-business-club-giuliani.jpg',
      },

      // Hospitality
      hospitality: {
        title: 'Visit Giuliani Vini',
        subtitle: 'Experience authentic Puglia in our historic cellar',
        hasTastings: true,
        tastingsImageUrl: 'https://giulianivini.com/wp-content/uploads/2022/10/anteprima-820x580.jpg',
        tastings: [
          {
            name: 'Classic Puglia Wine Tasting',
            description: 'A guided tasting of our signature Primitivo and Aleatico wines, accompanied by local Apulian snacks.',
            price: 250,
            duration: '90 minutes',
            capacity: 20,
            imageUrl: 'https://giulianivini.com/wp-content/uploads/2022/06/home-primitivo-giuliani.jpg',
            isAvailable: true
          }
        ],
        hasRestaurant: true,
        restaurant: {
          name: 'La Taverna di Giuliani',
          description: 'Farm-to-table authentic Apulian cuisine with panoramic vineyard views.',
          openingHours: 'Wed–Sun 12:00–15:00, 19:30-22:30',
          phoneNumber: '+39 080 348 1111',
          imageUrl: 'https://giulianivini.com/wp-content/uploads/2022/06/home-campi-giuliani.jpg'
        },
        hasAccommodation: true,
        accommodation: {
          description: 'Stay in our rustic vineyard cottages surrounded by historic Primitivo vines.',
          roomTypes: ['Vineyard Cottage', 'Premium Suite'],
          priceFrom: 120,
          bookingEmail: 'stay@giulianivini.com',
          imageUrl: 'https://giulianivini.com/wp-content/uploads/2022/06/benvenuti-in-giuliani.jpg'
        },
        experiences: [
          {
            name: 'Vineyard Tour & Harvest Experience',
            description: 'Walk through our vineyards with the winemaker and learn about our organic farming practices.',
            price: 450,
            duration: '120 minutes',
            capacity: 10,
            imageUrl: 'https://giulianivini.com/wp-content/uploads/2022/06/baronaggio-giuliani.jpg',
            isAvailable: true
          }
        ],
      },

      // Contact
      contact: {
        email: 'info@giulianivini.com',
        phone: '+39 080 348 1111',
        website: 'https://giulianivini.com/',
        address: 'Contrada Marchesana, 70023 Gioia del Colle (BA), Italy',
        mapLink: 'https://goo.gl/maps/giulianivini',
        instagram: 'https://instagram.com/giulianivini',
        facebook: 'https://facebook.com/giulianivini',
      },

      // Awards
      awards: [
        'Gambero Rosso - Tre Bicchieri',
        'Vinitaly Gold Medal for Primitivo Gioia del Colle',
        'Decanter World Wine Awards'
      ],
    };

    const updatedProfile = await EstateProfile.findOneAndUpdate(
      { vendorId: vendor._id },
      { $set: profileData },
      { upsert: true, new: true, returnDocument: 'after' }
    );

    console.log('EstateProfile fully seeded successfully:', updatedProfile.slug);
  } catch (error) {
    console.error('Error seeding EstateProfile:', error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seed();
