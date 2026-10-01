const fs = require('node:fs');
const path = require('node:path');

// Both pages are generated from one maintained template and read the same config.json.
const source = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const publicPage = source.replace('<title>Propuestas comerciales · Avovite</title>', '<title>Precios y beneficios · Avovite</title>');
fs.writeFileSync(path.join(__dirname, 'precios.html'), publicPage);
