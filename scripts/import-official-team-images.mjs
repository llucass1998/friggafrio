import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import sharp from 'sharp';
import https from 'https';

const BASE_URL = 'https://www.frigga.com.br';
const INDEX_URL = `${BASE_URL}/index.html`;

const ORIGINAL_DIR = path.resolve('imgs/team/originals');
const OPTIMIZED_DIR = path.resolve('apps/storefront/public/images/team');
const CONFIG_FILE = path.resolve('apps/storefront/src/config/company-team.ts');
const MANIFEST_FILE = path.resolve('docs/company/TEAM-ASSET-MANIFEST.md');

// Ensure dirs
fs.mkdirSync(ORIGINAL_DIR, { recursive: true });
fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function kebabCase(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function downloadImage(url, id, originalFilename) {
  const ext = path.extname(originalFilename).split('?')[0] || '.jpg';
  const originalPath = path.join(ORIGINAL_DIR, `${id}${ext}`);
  const optimizedPath = path.join(OPTIMIZED_DIR, `${id}.webp`);
  const publicPath = `/images/team/${id}.webp`;

  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', httpsAgent });
    const buffer = Buffer.from(res.data);

    // Save original
    fs.writeFileSync(originalPath, buffer);

    // Save optimized
    await sharp(buffer)
      .webp({ quality: 80 })
      .resize({ width: 600, withoutEnlargement: true }) // reasonable size for a profile picture
      .toFile(optimizedPath);

    console.log(`[SUCCESS] Downloaded and optimized image for ${id}`);
    return publicPath;
  } catch (error) {
    console.error(`[ERROR] Failed to process image for ${id} from ${url}:`, error.message);
    return undefined;
  }
}

async function run() {
  console.log('Fetching official site...');
  const res = await axios.get(INDEX_URL, { httpsAgent });
  const $ = cheerio.load(res.data);

  const teamMembers = [];
  let order = 1;

  // 1. Founder (hardcoded extraction or from current file)
  // Let's add Paulo Neulaender manually since his block is distinct in the HTML
  teamMembers.push({
    id: "paulo-neulaender",
    name: "Paulo Neulaender",
    role: "Fundador e Diretor",
    area: "Diretoria",
    biography: "Conhecido no setor como Paulinho, possui mais de 35 anos de experiência técnica em refrigeração e climatização, com grande conhecimento na transição de fluidos refrigerantes.",
    imageSrc: undefined, // Will be filled
    imageAlt: "Foto do Diretor Paulo Neulaender",
    group: "founder",
    active: true,
    order: order++
  });

  // Let's download his image (sobrenos_03.png)
  const founderImgSrc = $('img[alt="Sobre Nós"]').attr('src');
  if (founderImgSrc) {
    const founderImgUrl = new URL(founderImgSrc, BASE_URL).toString();
    const publicPath = await downloadImage(founderImgUrl, 'paulo-neulaender', founderImgSrc);
    teamMembers[0].imageSrc = publicPath;
  }

  // 2. Leadership (.vendedor)
  $('.vendedor').each((i, el) => {
    // skip commented if cheerio parses them, though cheerio ignores comments unless specifically requested
    const imgEl = $(el).find('img');
    const nameEl = $(el).find('h4');

    if (!nameEl.text()) return;

    let rawName = nameEl.text().trim();
    // Sometimes rawName is all caps. Convert to Title Case for better UI
    const name = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const id = kebabCase(name);

    const roleText = $(el).find('p').first().text();
    // Extract role from inside parenthesis if exists, e.g. "Tita Arantes (diretora de compras) , com mais de 15 anos..."
    let role = "Diretoria";
    let bio = roleText.trim();
    const roleMatch = roleText.match(/\((.*?)\)/);
    if (roleMatch) {
      role = roleMatch[1].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    const imgSrc = imgEl.attr('src');

    teamMembers.push({
      id,
      name,
      role,
      area: "Diretoria",
      biography: bio,
      rawImgSrc: imgSrc,
      imageAlt: `Foto de ${name}`,
      group: "leadership",
      active: true,
      order: order++
    });
  });

  // 3. Team (.people)
  $('.people').each((i, el) => {
    const imgEl = $(el).find('img');
    const nameEl = $(el).find('h4');

    if (!nameEl.text().trim()) return;

    let rawName = nameEl.text().trim();
    const name = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const id = kebabCase(name);

    // Role is usually the first p
    const role = $(el).find('p').first().text().trim();

    const imgSrc = imgEl.attr('src');

    teamMembers.push({
      id,
      name,
      role,
      area: "Equipe",
      biography: undefined,
      rawImgSrc: imgSrc,
      imageAlt: `Foto de ${name}`,
      group: "team",
      active: true,
      order: order++
    });
  });

  // Download all other images
  for (const member of teamMembers) {
    if (member.id === 'paulo-neulaender') continue; // already done

    if (member.rawImgSrc) {
      // Fix malformed URLs like "imagens/quem-faz-frigga//2025/..."
      const cleanSrc = member.rawImgSrc.replace(/\/{2,}/g, '/');
      const imgUrl = new URL(cleanSrc, BASE_URL).toString();
      const publicPath = await downloadImage(imgUrl, member.id, cleanSrc);
      member.imageSrc = publicPath;
    }
    delete member.rawImgSrc;
  }

  // Generate ts configuration file
  const tsContent = `export type CompanyTeamMember = {
  id: string
  name: string
  role: string
  area?: string
  biography?: string
  imageSrc?: string
  imageAlt: string
  group: "founder" | "leadership" | "team"
  active: boolean
  order: number
}

export const companyTeam: CompanyTeamMember[] = ${JSON.stringify(teamMembers, null, 2)};
`;

  fs.writeFileSync(CONFIG_FILE, tsContent);
  console.log(`[SUCCESS] Updated ${CONFIG_FILE}`);

  // Generate Manifest
  let manifestContent = `# Manifesto de Assets: Equipe Frigga\n\n`;
  manifestContent += `Total de membros extraídos: ${teamMembers.length}\n\n`;
  manifestContent += `| ID | Nome | Grupo | Imagem Original | Imagem Otimizada |\n`;
  manifestContent += `|---|---|---|---|---|\n`;

  teamMembers.forEach(m => {
    manifestContent += `| ${m.id} | ${m.name} | ${m.group} | ${m.imageSrc ? 'Sim' : 'Não'} | ${m.imageSrc || 'N/A'} |\n`;
  });

  fs.writeFileSync(MANIFEST_FILE, manifestContent);
  console.log(`[SUCCESS] Updated ${MANIFEST_FILE}`);
}

run().catch(console.error);
