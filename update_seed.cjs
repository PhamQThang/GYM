const fs = require('fs');
let c = fs.readFileSync('src/lib/seed.ts', 'utf8');
c = c.replace(/\{ id: '/g, "{ is_system: true, is_modified: false, id: '");
fs.writeFileSync('src/lib/seed.ts', c);
