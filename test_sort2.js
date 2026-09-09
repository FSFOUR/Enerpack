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

const items = ["54", "56", "58", "59", "60", "63", "65", "68", "70", "100", "104", "108", "47*64", "54*73.5", "54*86", "55*80", "56*75"];
items.sort(sortSizes);
console.log(items);
