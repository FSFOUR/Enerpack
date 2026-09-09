const fs = require('fs');

const sortSizes = (a, b) => {
  const parseSize = (s) => {
    if (s.includes('*')) {
      return s.split('*').map(v => parseFloat(v) || 0);
    }
    return [parseFloat(s) || 0, 0];
  };
  const [a1, a2] = parseSize(a);
  const [b1, b2] = parseSize(b);
  if (a1 !== b1) return a1 - b1;
  return a2 - b2;
};

let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const inventoryData[^=]*= (\[[\s\S]*?\]);\n\n/m;
const match = content.match(regex);
if (match) {
  let inventoryData;
  try {
    inventoryData = eval(match[1]);
    
    // Sort items
    inventoryData.forEach(section => {
      section.subSections.forEach(sub => {
        sub.items.sort((a, b) => sortSizes(a.size, b.size));
      });
    });

    const newStr = JSON.stringify(inventoryData, null, 2)
      .replace(/"size": /g, "size: ")
      .replace(/"gsm": /g, "gsm: ")
      .replace(/"stock": /g, "stock: ")
      .replace(/"isLow": /g, "isLow: ")
      .replace(/"minQuantity": /g, "minQuantity: ")
      .replace(/"title": /g, "title: ")
      .replace(/"subSections": /g, "subSections: ")
      .replace(/"items": /g, "items: ");

    content = content.replace(match[1], newStr);
    fs.writeFileSync('src/App.tsx', content);
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
} else {
  console.log("Not found");
}
