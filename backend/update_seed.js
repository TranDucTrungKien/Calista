const fs = require('fs');
const path = require('path');

// 1. Get all files in frontend/src/assets/products
const productsDir = 'd:\\Calista\\frontend\\src\\assets\\products';
const files = fs.readdirSync(productsDir);
const pngFiles = files.filter(f => f.endsWith('.png'));

// 2. Read seed.js to extract all products
let seedFileContent = fs.readFileSync('d:\\Calista\\backend\\src\\seed.js', 'utf8');

// Define dummy helpers to run eval
function a(filename) { return [filename]; }
function a2(filename) { return [filename]; }

const categoriesIndex = seedFileContent.indexOf('const CATEGORIES = [');
const reviewsIndex = seedFileContent.indexOf('const SAMPLE_REVIEWS = [');

const categoriesEvalStr = seedFileContent.substring(
  categoriesIndex,
  reviewsIndex
);

let CATEGORIES = [];
eval(categoriesEvalStr.replace('const CATEGORIES =', 'CATEGORIES ='));

// Helper function to normalize Vietnamese text but KEEP accents
function cleanText(str) {
  return str.toLowerCase()
            .replace(/[.,–&-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
}

function removeAccents(str) {
  return str.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .replace(/Đ/g, "D")
            .toLowerCase();
}

// Custom synonym/translation mapping
const SYNONYMS = {
  'oliu': ['olive'],
  'olive': ['oliu'],
  'matcha': ['trà', 'xanh', 'matcha'],
  'toner': ['essence', 'toner'],
  'nha đam': ['lô hội', 'nha đam'],
  'lô hội': ['nha đam', 'lô hội'],
  'bơ': ['bơ hạt mỡ', 'bơ'],
  'trà xanh': ['matcha', 'trà xanh'],
  'việt quất': ['cam việt quất', 'việt quất'],
  'ntt': ['nước', 'tẩy', 'trang'],
  'oxi': ['oxy'],
  'oxy': ['oxi']
};

function calculateScore(sourceText, targetFilename) {
  const sourceClean = cleanText(sourceText);
  const targetClean = cleanText(path.basename(targetFilename, '.png'));

  const sourceWords = sourceClean.split(' ').filter(Boolean);
  const targetWords = targetClean.split(' ').filter(Boolean);

  const sourceWordsNoAcc = sourceWords.map(removeAccents);
  const targetWordsNoAcc = targetWords.map(removeAccents);

  let score = 0;

  // 1. Check exact word matches (with accents)
  for (const sWord of sourceWords) {
    if (targetWords.includes(sWord)) {
      score += 10; // High score for exact accent match
    } else {
      // Check expanded synonyms with accents
      for (const [key, syns] of Object.entries(SYNONYMS)) {
        if (sWord === key && syns.some(syn => targetWords.includes(syn))) {
          score += 8;
        }
      }
    }
  }

  // 2. Check matches without accents (fallback)
  for (const sWordNoAcc of sourceWordsNoAcc) {
    if (targetWordsNoAcc.includes(sWordNoAcc)) {
      score += 3; // Lower score for match without accent
    } else {
      // Check expanded synonyms without accents
      for (const [key, syns] of Object.entries(SYNONYMS)) {
        if (sWordNoAcc === removeAccents(key) && syns.some(syn => targetWordsNoAcc.includes(removeAccents(syn)))) {
          score += 2.5;
        }
      }
    }
  }

  // 3. Perfect name inclusion bonus
  if (targetClean.includes(sourceClean) || sourceClean.includes(targetClean)) {
    score += 15;
  }
  if (removeAccents(targetClean).includes(removeAccents(sourceClean)) || removeAccents(sourceClean).includes(removeAccents(targetClean))) {
    score += 8;
  }

  // 4. Length penalty to avoid matching longer unrelated files
  score -= Math.abs(targetWords.length - sourceWords.length) * 0.5;

  return score;
}

function findBestMatch(productName, originalImage) {
  // Manual overrides for known tricky cases
  if (productName === 'Serum vitamin C sáng da') {
    return 'Serum Calista Vitamin C mờ thâm 50ml.png';
  }

  const origName = originalImage && originalImage[0] ? path.basename(originalImage[0], '.png').replace(' 2', '') : '';
  
  let bestFile = null;
  let maxScore = -999;

  // If there's an original image, try to match it first
  if (origName) {
    for (const file of pngFiles) {
      const score = calculateScore(origName, file);
      if (score > maxScore) {
        maxScore = score;
        bestFile = file;
      }
    }
    // If we got a decent match from original image, return it
    if (maxScore > 10) {
      return bestFile;
    }
  }

  // Fallback to product name
  bestFile = null;
  maxScore = -999;
  for (const file of pngFiles) {
    const score = calculateScore(productName, file);
    if (score > maxScore) {
      maxScore = score;
      bestFile = file;
    }
  }

  return bestFile;
}

console.log("Starting update of seed.js...");

// Keep track of counts
let totalUpdates = 0;

for (const cat of CATEGORIES) {
  for (const p of cat.products) {
    const matchedFile = findBestMatch(p.name, p.images);
    if (!matchedFile) {
      console.error(`ERROR: No match found for product: ${p.name}`);
      continue;
    }

    // Now let's find this product in the seed.js string and replace its images line.
    // We search for `name: 'productName'` and then find the subsequent `images: ...` line.
    // Let's escape any special regex characters in the product name
    const escapedName = p.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    
    // We construct a regex to match the product block
    // Specifically: name: 'productName' followed by fields and then images: a(...) or images: a2(...)
    const productRegex = new RegExp(`(name:\\s*['"]${escapedName}['"][\\s\\S]*?images:\\s*)(a2?\\([^)]+\\))`, 'i');
    
    if (productRegex.test(seedFileContent)) {
      seedFileContent = seedFileContent.replace(productRegex, `$1a('${matchedFile}')`);
      totalUpdates++;
      console.log(`Updated: "${p.name}" -> a('${matchedFile}')`);
    } else {
      console.error(`WARNING: Could not find product block in seed.js for: "${p.name}"`);
    }
  }
}

// 3. Write back the updated content to seed.js
fs.writeFileSync('d:\\Calista\\backend\\src\\seed.js', seedFileContent, 'utf8');
console.log(`\nSuccessfully updated ${totalUpdates} product image paths in seed.js!`);
