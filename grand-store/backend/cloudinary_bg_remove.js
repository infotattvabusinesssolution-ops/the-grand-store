require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const inputDir = path.join(__dirname, 'pdf_images');
const outputDir = path.join(__dirname, 'processed_images');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function processImage(filepath, filename) {
  try {
    console.log(`Uploading ${filename} to Cloudinary for background removal...`);
    const result = await cloudinary.uploader.upload(filepath, {
      background_removal: "cloudinary_ai",
      folder: "grandstore_wines"
    });
    
    console.log(`Uploaded! Cloudinary Public ID: ${result.public_id}`);
    
    // Cloudinary background removal is asynchronous.
    // We can either wait for a webhook, or just try to download the resulting image URL
    // after a short delay or fetch the transformed URL.
    // The background removal effect is applied and saved automatically, but it might take a few seconds.
    // To ensure we get the transparent image, we can just request the original URL 
    // because Cloudinary AI Background Removal replaces the original asset.
    
    const maxRetries = 10;
    const delay = 5000;
    
    let downloaded = false;
    for (let i = 0; i < maxRetries; i++) {
        await new Promise(res => setTimeout(res, delay));
        console.log(`Checking if background removal is complete for ${filename} (Attempt ${i + 1})...`);
        
        try {
            // Fetch asset details to see if info.background_removal is complete
            const assetInfo = await cloudinary.api.resource(result.public_id);
            if (assetInfo.info && assetInfo.info.background_removal && assetInfo.info.background_removal.cloudinary_ai) {
                const status = assetInfo.info.background_removal.cloudinary_ai.status;
                if (status === 'complete') {
                    console.log(`Background removal complete for ${filename}! Downloading...`);
                    
                    // Add .png extension because it's transparent now
                    const outPath = path.join(outputDir, filename.replace(/\.(jpg|jpeg)$/, '.png'));
                    const url = result.secure_url.replace(/\.(jpg|jpeg)$/i, '.png'); // Request PNG from Cloudinary
                    
                    await new Promise((resolve, reject) => {
                        https.get(url, (res) => {
                            if (res.statusCode === 200) {
                                const fileStream = fs.createWriteStream(outPath);
                                res.pipe(fileStream);
                                fileStream.on('finish', () => {
                                    fileStream.close();
                                    resolve();
                                });
                            } else {
                                reject(new Error(`Failed to download: ${res.statusCode}`));
                            }
                        }).on('error', reject);
                    });
                    
                    console.log(`Successfully saved ${outPath}`);
                    downloaded = true;
                    break;
                } else if (status === 'failed') {
                    console.log(`Background removal failed for ${filename}.`);
                    break;
                }
            } else {
                 console.log(`Still processing ${filename}...`);
            }
        } catch (err) {
             console.log(`Error checking status for ${filename}: ${err.message}`);
        }
    }
    
    if (!downloaded) {
        console.log(`Could not download processed image for ${filename}. Time out or failed.`);
    }

  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  }
}

async function run() {
  const files = fs.readdirSync(inputDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  // Only process files that look like the right-side bottles.
  // The right side bottles in the PDF screenshots seem to be tall and narrower.
  // But we can just process all of them, or filter by width < height
  // Or we can just process the ones that the user specifically requested.
  // We'll process all of them and manually select the 10 we need.
  
  for (const file of files) {
      await processImage(path.join(inputDir, file), file);
  }
}

run();
