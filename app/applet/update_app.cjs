const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state hooks if not present
const stateTarget = 'const [searchForecastQuery, setSearchForecastQuery] = useState(\'\');';
const stateAddition = `const [searchForecastQuery, setSearchForecastQuery] = useState('');
  const [velocityMonth, setVelocityMonth] = useState('All');
  const [velocityYear, setVelocityYear] = useState('All');`;

if (content.includes(stateTarget) && !content.includes('velocityMonth')) {
  content = content.replace(stateTarget, stateAddition);
  console.log("State hooks added");
}

// 2. Update calculation
const calcTarget = `    const { velocity280Single, velocity280Double, velocity200Double } = useMemo(() => {
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

const calcNew = `    const { velocity280Single, velocity280Double, velocity200Double } = useMemo(() => {
    const map280Single = new Map();
    const map280Double = new Map();
    const map200Double = new Map();

    stockOutLogs.forEach(log => {
      if (velocityMonth !== 'All' && log.month && log.month.toLowerCase() !== velocityMonth.toLowerCase()) {
        return;
      }
      if (velocityYear !== 'All' && log.date && !log.date.startsWith(velocityYear)) {
        return;
      }

      const gsm = String(log.gsm || '').trim();
      const size = String(log.size || '').trim();
      const out = log.out || 0;
      if (!size) return;

      if (gsm === '280') {
        if (!size.includes('*')) {
          map280Single.set(size, (map280Single.get(size) || 0) + out);
        } else {
          map280Double.set(size, (map280Double.get(size) || 0) + out);
        }
      } else if (gsm === '200') {
        if (size.includes('*')) {
          map200Double.set(size, (map200Double.get(size) || 0) + out);
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
  }, [stockOutLogs, velocityMonth, velocityYear]);`;

if (content.includes(calcTarget)) {
  content = content.replace(calcTarget, calcNew);
  console.log("Calculation updated");
} else {
  console.log("Calc target not found");
}

// 3. Update UI section
const uiTarget = `{/* Bottom Section - High Velocity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;

const uiNew = `{/* Bottom Section - High Velocity */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-500" size={18} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">High Velocity Inventory (Top Moving Sizes)</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Month:</span>
                      <select 
                        value={velocityMonth} 
                        onChange={(e) => setVelocityMonth(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="All">All Months</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year:</span>
                      <select 
                        value={velocityYear} 
                        onChange={(e) => setVelocityYear(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="All">All Years</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`;

if (content.includes(uiTarget) && !content.includes('High Velocity Inventory (Top Moving Sizes)')) {
  content = content.replace(uiTarget, uiNew);
  console.log("UI updated");
} else {
  console.log("UI target not found or already updated");
}

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx written successfully");
