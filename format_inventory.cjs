const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// The JSON stringify made each property on a new line, we can just leave it, it's valid TS.
// But let's check if the file compiles.
