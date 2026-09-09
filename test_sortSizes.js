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

const sizes = ["70", "56", "54*78", "60", "54", "59"];
sizes.sort(sortSizes);
console.log(sizes);
