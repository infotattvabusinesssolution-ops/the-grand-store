const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, 'update_sake_products.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /'C:\/Users\/HP\/\.gemini\/antigravity-ide\/brain\/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8\/gekkeikan_traditional_black_1792656447592\.jpg'/g,
  "'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/gekkeikan-traditional-junmai-sake-720ml.png'"
);
content = content.replace(
  /'C:\/Users\/HP\/\.gemini\/antigravity-ide\/brain\/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8\/gold_gekkeikan_black_1792656529096\.jpg'/g,
  "'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png'"
);
content = content.replace(
  /'C:\/Users\/HP\/\.gemini\/antigravity-ide\/brain\/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8\/super_kinokuni_black_1792656575825\.jpg'/g,
  "'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/super-kinokuni-junmai-sake-720ml.png'"
);
content = content.replace(
  /'C:\/Users\/HP\/\.gemini\/antigravity-ide\/brain\/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8\/dassai_45_black_1792656485903\.jpg'/g,
  "'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dassai-45-junmai-daiginjo-sake-720ml.png'"
);
content = content.replace(
  /'C:\/Users\/HP\/\.gemini\/antigravity-ide\/brain\/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8\/dassai_23_black_1792656649676\.jpg'/g,
  "'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dassai-23-junmai-daiginjo-super-premium-sake-720ml.png'"
);
content = content.replace(/filename: '(.*)\.jpg'/g, "filename: '$1.png'");

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated update_sake_products.js');
