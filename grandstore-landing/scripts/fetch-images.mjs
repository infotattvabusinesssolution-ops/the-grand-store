import https from 'https';
import fs from 'fs';

function searchPexels(query) {
  return new Promise((resolve) => {
    https.get('https://www.pexels.com/search/' + encodeURIComponent(query) + '/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const matches = data.match(/https:\/\/images\.pexels\.com\/photos\/[0-9]+\/pexels-photo-[0-9]+\.jpeg\?[^"'\s>]+/g) || [];
        const unique = [...new Set(matches.map(m => m.split('?')[0] + '?auto=compress&cs=tinysrgb&w=1200'))];
        resolve(unique);
      });
    }).on('error', () => resolve([]));
  });
}

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
          const s = fs.createWriteStream(dest);
          res2.pipe(s);
          s.on('finish', () => resolve(true));
        });
      } else {
        const s = fs.createWriteStream(dest);
        res.pipe(s);
        s.on('finish', () => resolve(true));
      }
    }).on('error', () => resolve(false));
  });
}

async function run() {
  const storefronts = await searchPexels('wine shop exterior boutique');
  console.log('Found storefronts:', storefronts.length);
  for (let i = 0; i < Math.min(3, storefronts.length); i++) {
    await download(storefronts[i], `public/assets/real-storefront-${i+1}.jpg`);
    console.log(`Saved real-storefront-${i+1}.jpg`);
  }

  const patios = await searchPexels('outdoor wine bar night terrace');
  console.log('Found patios:', patios.length);
  for (let i = 0; i < Math.min(3, patios.length); i++) {
    await download(patios[i], `public/assets/real-patio-${i+1}.jpg`);
    console.log(`Saved real-patio-${i+1}.jpg`);
  }
}

run();
