const computedSectionTitle = "150, 100 GSM SECTION";
const titleParts = computedSectionTitle.toUpperCase().replace('GSM', '').replace('SECTION', '').trim().split(/[\s&,]+/);
console.log(titleParts);
