const inventoryData = [
          { size: "54", gsm: "280", stock: 1279, isLow: false, minQuantity: 500 },
          { size: "56", gsm: "280", stock: 243, isLow: true, minQuantity: 500 },
          { size: "58", gsm: "280", stock: 1604, isLow: false, minQuantity: 500 },
          { size: "59", gsm: "280", stock: 442, isLow: true, minQuantity: 500 },
          { size: "60", gsm: "280", stock: 1351, isLow: false, minQuantity: 500 },
          { size: "63", gsm: "280", stock: 568, isLow: false, minQuantity: 500 },
          { size: "65", gsm: "280", stock: 1453, isLow: false, minQuantity: 500 },
          { size: "68", gsm: "280", stock: 984, isLow: false, minQuantity: 500 },
          { size: "70", gsm: "280", stock: 714, isLow: false, minQuantity: 500 },
          { size: "73", gsm: "280", stock: 941, isLow: false },
          { size: "76", gsm: "280", stock: 926, isLow: false },
          { size: "78", gsm: "280", stock: 0, isLow: true },
          { size: "80", gsm: "280", stock: 2029, isLow: false },
          { size: "83", gsm: "280", stock: 1337, isLow: false },
          { size: "90", gsm: "280", stock: 3384, isLow: false },
          { size: "93", gsm: "280", stock: 1262, isLow: false },
          { size: "96", gsm: "280", stock: 1315, isLow: false },
          { size: "98", gsm: "280", stock: 1330, isLow: false },
          { size: "100", gsm: "280", stock: 1999, isLow: false },
          { size: "104", gsm: "280", stock: 955, isLow: false },
          { size: "108", gsm: "280", stock: 1568, isLow: false },
          { size: "47*64", gsm: "280", stock: 59, isLow: true },
          { size: "54*73.5", gsm: "280", stock: 55, isLow: true },
          { size: "54*86", gsm: "280", stock: 157, isLow: true },
          { size: "55*80", gsm: "280", stock: 0, isLow: true },
          { size: "55*82", gsm: "280", stock: 0, isLow: true },
          { size: "56*68.5", gsm: "280", stock: 33, isLow: true },
          { size: "56*75", gsm: "280", stock: 39, isLow: true },
];

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

inventoryData.sort((a,b) => sortSizes(a.size, b.size));
console.log(inventoryData.map(i => i.size));
