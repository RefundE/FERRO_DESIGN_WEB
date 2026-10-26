/**
 * FERRO DESIGN™ — Canonical Site Generator
 * Generates index.html, projects.html, about.html, sitemap.xml, and all project-*.html files
 * using the tested generators from admin/admin.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname);
const ADMIN_JS_PATH = path.join(ROOT_DIR, 'admin', 'admin.js');
const CONTENT_PATH = path.join(ROOT_DIR, 'data', 'site-content.json');

function buildSite(customContent = null) {
  if (!fs.existsSync(ADMIN_JS_PATH)) {
    throw new Error(`admin.js not found at ${ADMIN_JS_PATH}`);
  }

  const adminCode = fs.readFileSync(ADMIN_JS_PATH, 'utf8');

  // Provide browser globals required by admin.js during parse
  global.window = { AdminState: {}, addEventListener: () => {} };
  global.document = { querySelectorAll: () => [], getElementById: () => null, addEventListener: () => {} };
  global.localStorage = { getItem: () => '', setItem: () => {} };

  // Evaluate and extract generator functions
  const evalScript = new Function(
    adminCode +
    '\nreturn { generateIndexHTML, generateProjectsCatalogHTML, generateAboutHTML, generateSitemapXML, generateProjectPageHTML, prepareCleanSiteContent };'
  );
  const gens = evalScript();

  let siteContent = customContent;
  if (!siteContent) {
    if (!fs.existsSync(CONTENT_PATH)) {
      throw new Error(`site-content.json not found at ${CONTENT_PATH}`);
    }
    siteContent = JSON.parse(fs.readFileSync(CONTENT_PATH, 'utf8'));
  }

  const generatedFiles = [];

  // 1. Generate index.html
  const indexHtml = gens.generateIndexHTML(siteContent);
  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), indexHtml, 'utf8');
  generatedFiles.push('index.html');

  // 2. Generate projects.html
  const projectsHtml = gens.generateProjectsCatalogHTML(siteContent);
  fs.writeFileSync(path.join(ROOT_DIR, 'projects.html'), projectsHtml, 'utf8');
  generatedFiles.push('projects.html');

  // 3. Generate about.html
  const aboutHtml = gens.generateAboutHTML(siteContent);
  fs.writeFileSync(path.join(ROOT_DIR, 'about.html'), aboutHtml, 'utf8');
  generatedFiles.push('about.html');

  // 4. Generate sitemap.xml
  const sitemapXml = gens.generateSitemapXML(siteContent);
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapXml, 'utf8');
  generatedFiles.push('sitemap.xml');

  // 5. Generate project pages
  const projectsMap = {};
  (siteContent.projects || []).forEach(p => {
    projectsMap[p.filename] = p;
  });
  const order = siteContent.allProjectsOrder || (siteContent.projects || []).map(p => p.filename);

  for (let i = 0; i < order.length; i++) {
    const curProj = projectsMap[order[i]];
    const nextProj = projectsMap[order[(i + 1) % order.length]];
    if (curProj && nextProj) {
      const contacts = (siteContent.home && siteContent.home.contacts) || {};
      const projHtml = gens.generateProjectPageHTML(curProj, nextProj, contacts);
      fs.writeFileSync(path.join(ROOT_DIR, curProj.filename), projHtml, 'utf8');
      generatedFiles.push(curProj.filename);
    }
  }

  return generatedFiles;
}

if (require.main === module) {
  try {
    const startTime = Date.now();
    const files = buildSite();
    const duration = Date.now() - startTime;
    console.log(`[BUILD SUCCESS] Generated ${files.length} pages in ${duration}ms:`);
    files.forEach(f => console.log(`  ✓ ${f}`));
  } catch (err) {
    console.error('[BUILD ERROR]', err);
    process.exit(1);
  }
}

module.exports = { buildSite };
