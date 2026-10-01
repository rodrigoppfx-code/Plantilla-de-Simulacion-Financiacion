const fs = require('node:fs');
const path = require('node:path');

// Both pages are generated from one maintained template and read the same config.json.
const indexPath = path.join(__dirname, 'index.html');
let source = fs.readFileSync(indexPath, 'utf8');
// Maintain the approved table once; both views differ only in their data binding.
const table = source.match(/<!-- benefits-table:source -->([\s\S]*?)<!-- benefits-table:source:end -->/);
if (!table) throw new Error('Missing benefits table source');
source = source.replace(/<!-- benefits-table:prices -->[\s\S]*?<!-- benefits-table:prices:end -->/, () =>
  '<!-- benefits-table:prices -->' + table[1].replaceAll('p.heads', 'pr.benefits.heads').replaceAll('p.rows', 'pr.benefits.rows') + '<!-- benefits-table:prices:end -->');
fs.writeFileSync(indexPath, source);
const publicPage = source.replace('<title>Propuestas comerciales · Avovite</title>', '<title>Precios y beneficios · Avovite</title>');
fs.writeFileSync(path.join(__dirname, 'precios.html'), publicPage);
