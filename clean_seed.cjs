const fs = require('fs');
let c = fs.readFileSync('src/lib/seed.ts', 'utf8');

const undoReplace = (name) => {
  const re = new RegExp(`(export const ` + name + `[\\s\\S]*?\\];)`, 'g');
  c = c.replace(re, (match) => {
    return match.replace(/\{ is_system: true, is_modified: false, id: '/g, "{ id: '");
  });
};

undoReplace('SEED_MEALS');
undoReplace('SEED_MEAL_ITEMS');
undoReplace('SEED_WEIGHT_LOGS');

fs.writeFileSync('src/lib/seed.ts', c);
