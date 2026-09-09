function testGsm(itemGsm, title) {
  const cleanGsm = String(itemGsm || '').toUpperCase().replace('GSM', '').trim();
  let computedSectionTitle = title;
  
  const titlePartsStr = computedSectionTitle.toUpperCase().replace('GSM', '').replace('SECTION', '').replace(/\s+/g, '');
  const cleanGsmNoSpace = cleanGsm.replace(/\s+/g, '');
  
  if (!titlePartsStr.includes(cleanGsmNoSpace)) {
    computedSectionTitle = `${cleanGsm} GSM SECTION`;
  }
  return computedSectionTitle;
}

console.log(testGsm("140GYT", "140 GYT, 130 GSM SECTION"));
console.log(testGsm("130", "140 GYT, 130 GSM SECTION"));
console.log(testGsm("150", "150, 100 GSM SECTION"));
console.log(testGsm("100", "150, 100 GSM SECTION"));
console.log(testGsm("280", "280 GSM SECTION"));
console.log(testGsm("290", "280 GSM SECTION")); // should change
