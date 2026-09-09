const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const calcRegex = /const dashboardHighVelocityData = useMemo\(\(\) => \{[\s\S]*?\}, \[stockOutLogs\]\);/;

const newCalc = `  const { velocity280Single, velocity280Double, velocity200Double } = useMemo(() => {
    const map280Single = new Map();
    const map280Double = new Map();
    const map200Double = new Map();

    stockOutLogs.forEach(log => {
      const gsm = String(log.gsm || '').trim();
      const size = String(log.size || '').trim();
      const out = log.out || 0;
      const key = log.itemCode || \`\${size}x\${gsm}\`;

      if (gsm === '280') {
        if (!size.includes('*')) {
          map280Single.set(key, (map280Single.get(key) || 0) + out);
        } else {
          map280Double.set(key, (map280Double.get(key) || 0) + out);
        }
      } else if (gsm === '200') {
        if (size.includes('*')) {
          map200Double.set(key, (map200Double.get(key) || 0) + out);
        }
      }
    });

    const processMap = (m) => {
      const sorted = Array.from(m.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      const max = sorted.length > 0 ? sorted[0].value : 100;
      return sorted.map(item => ({ ...item, max }));
    };

    return {
      velocity280Single: processMap(map280Single),
      velocity280Double: processMap(map280Double),
      velocity200Double: processMap(map200Double),
    };
  }, [stockOutLogs]);`;

if (calcRegex.test(content)) {
  content = content.replace(calcRegex, newCalc);
  console.log("Calculations updated");
} else {
  console.log("Calculations regex failed");
}

const uiRegex = /\{\/\* Bottom Section \*\/\}[\s\S]*?(?=\{\/\*|\n\s*\}\)\}\n\n\s*\{activeTab === 'Calculator')/;

const renderList = (data, emptyText) => `
                <div className="space-y-6">
                  {${data}.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest">${emptyText}</div>
                  ) : (
                    ${data}.map((item) => (
                      <div key={item.name}>
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">{item.name}</span>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{item.value} Units</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: \`\${(item.value / item.max) * 100}%\` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-blue-600"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>`;

const newUI = `{/* Bottom Section - High Velocity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 280 Single */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-blue-500" size={16} />
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Top 5 - 280 Single</h3>
                  </div>
${renderList('velocity280Single', 'No 280 Single Data')}
                </div>

                {/* 280 Double */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-blue-500" size={16} />
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Top 5 - 280 Double</h3>
                  </div>
${renderList('velocity280Double', 'No 280 Double Data')}
                </div>

                {/* 200 Double */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-400">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="text-blue-500" size={16} />
                    <h3 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Top 5 - 200 Double</h3>
                  </div>
${renderList('velocity200Double', 'No 200 Double Data')}
                </div>

              </div>
            </motion.div>
`;

if (uiRegex.test(content)) {
  content = content.replace(uiRegex, newUI);
  console.log("UI updated");
} else {
  console.log("UI regex failed");
}

fs.writeFileSync('src/App.tsx', content);

