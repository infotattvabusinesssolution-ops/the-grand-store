const http = require('http');

http.get('http://localhost:5015/api/products', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const prods = Array.isArray(json) ? json : json.data || json.products || [];
      console.log(`API total products returned: ${prods.length}`);

      const getProductCategory = (p) => {
        const cat = p.category || p.type || "Wine & spirits";
        const sub = (p.subcategory || "").toLowerCase();
        const name = (p.name || "").toLowerCase();
        if (
          sub === "baijiu" ||
          sub.includes("baijiu") ||
          name.includes("baijiu") ||
          (cat.toLowerCase() === "spirits" && name.includes("moutai"))
        ) {
          return "Baijiu";
        }
        if (cat.toLowerCase() === "baijiu & sake") {
          if (sub.includes("sake") || name.includes("sake")) return "Sake";
          return "Baijiu";
        }
        if (cat.toLowerCase() === "whiskey" || cat.toLowerCase() === "whisky") {
          return "Whisky";
        }
        return cat;
      };

      const baijius = prods.filter(p => getProductCategory(p) === 'Baijiu');
      const sakes = prods.filter(p => getProductCategory(p) === 'Sake');
      const whiskies = prods.filter(p => getProductCategory(p) === 'Whisky');

      console.log(`\n================ BAIJIU (${baijius.length} products) ================`);
      baijius.forEach((p, i) => {
        console.log(`${i+1}. [${p.name}] -> ${p.image}`);
      });

      console.log(`\n================ SAKE (${sakes.length} products) ================`);
      sakes.forEach((p, i) => {
        console.log(`${i+1}. [${p.name}] -> ${p.image}`);
      });

      console.log(`\n================ WHISKY SAMPLES (Total: ${whiskies.length} products) ================`);
      whiskies.slice(0, 5).forEach((p, i) => {
        console.log(`${i+1}. [${p.name}] -> ${p.image}`);
      });
    } catch (e) {
      console.error('JSON parse error:', e.message);
    }
  });
}).on('error', err => {
  console.error('HTTP request failed:', err.message);
});
