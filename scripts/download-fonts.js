import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontsDir = path.join(__dirname, '..', 'public', 'fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// These URLs point directly to the WOFF2 files from Google Fonts for latin subset.
const fontsToDownload = [
  {
    name: 'Inter-Variable.woff2',
    url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.woff2'
  },
  {
    name: 'JetBrainsMono-Variable.woff2',
    url: 'https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwOqnB22x0TqQ.woff2'
  }
];

async function downloadFont(font) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, font.name);
    const file = fs.createWriteStream(filePath);
    
    https.get(font.url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
        console.log(`Downloaded: ${font.name}`);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function run() {
  for (const font of fontsToDownload) {
    try {
      await downloadFont(font);
    } catch (e) {
      console.error(`Failed to download ${font.name}:`, e);
    }
  }
}

run();
