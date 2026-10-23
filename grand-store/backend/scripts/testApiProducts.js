const http = require('http');

http.get('http://localhost:5015/api/products?category=Baijiu&category=Sake&category=Whisky&limit=100', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const prods = json.products || json.data || (Array.isArray(json) ? json : []);
      console.log('Total products returned:', prods.length);
      const categories = {};
      prods.forEach(p => {
        const cat = p.category || 'unknown';
        categories[cat] = (categories[cat] || 0) + 1;
      });
      console.log('Categories:', categories);
      console.log('\nAll Baijiu & Sake products:');
      prods.filter(p => p.category === 'Baijiu' || p.category === 'Sake' || (p.subcategory && (p.subcategory.includes('Baijiu') || p.subcategory.includes('Sake')))).forEach((p, i) => {
        console.log(`${i+1}. [${p.name}] (${p.category}) -> ${p.image}`);
      });
      console.log('\nFirst 10 Whisky products:');
      prods.filter(p => p.category === 'Whisky' || p.category === 'Whiskey').slice(0, 10).forEach((p, i) => {
        console.log(`${i+1}. [${p.name}] (${p.category}) -> ${p.image}`);
      });
    } catch (e) {
      console.error(e);
      console.log('Raw:', data.slice(0, 300));
    }
  });
}).on('error', err => console.error(err));
