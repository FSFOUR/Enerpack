import React, { useMemo, useState } from 'react';
import { StockTransaction } from '../types';
import { TrendingUp, BarChart3, Calendar, ArrowLeft } from 'lucide-react';

interface ForecastPageProps {
  transactions: StockTransaction[];
  onBack: () => void;
}

const ForecastPage: React.FC<ForecastPageProps> = ({ transactions, onBack }) => {
  const [timeRange, setTimeRange] = useState<'ALL' | '30_DAYS' | '90_DAYS'>('ALL');

  // filter and aggregate data
  const { chartData, totalOut } = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date();
    
    if (timeRange === '30_DAYS') cutoffDate.setDate(now.getDate() - 30);
    if (timeRange === '90_DAYS') cutoffDate.setDate(now.getDate() - 90);
    if (timeRange === 'ALL') cutoffDate.setFullYear(2000); // Way back

    // 1. Filter Transactions (Only OUT and within date range)
    const relevantTransactions = transactions.filter(t => {
      if (t.type !== 'OUT') return false;
      const tDate = new Date(t.date);
      return tDate >= cutoffDate;
    });

    // 2. Aggregate by Size
    const aggregation: Record<string, number> = {};
    let grandTotal = 0;

    relevantTransactions.forEach(t => {
      // Normalize size string (trim, uppercase) to grouping
      const key = `${t.size} (${t.gsm})`;
      const qty = Number(t.quantity) || 0;
      
      if (!aggregation[key]) aggregation[key] = 0;
      aggregation[key] += qty;
      grandTotal += qty;
    });

    // 3. Convert to Array and Sort
    const sortedData = Object.entries(aggregation)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { chartData: sortedData, totalOut: grandTotal };
  }, [transactions, timeRange]);

  // Max value for scaling the chart
  const maxValue = chartData.length > 0 ? chartData[0].value : 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center shadow-sm bg-indigo-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Back to Inventory</span>
          </button>
          <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2 border-l border-indigo-200 pl-4 ml-2">
            <TrendingUp className="w-6 h-6" />
            MOVEMENT FORECAST
          </h2>
        </div>

        {/* Filters */}
        <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
          <button 
            onClick={() => setTimeRange('30_DAYS')}
            className={`px-3 py-1 text-xs font-bold rounded ${timeRange === '30_DAYS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Last 30 Days
          </button>
          <button 
            onClick={() => setTimeRange('90_DAYS')}
            className={`px-3 py-1 text-xs font-bold rounded ${timeRange === '90_DAYS' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Last 3 Months
          </button>
          <button 
            onClick={() => setTimeRange('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded ${timeRange === 'ALL' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                    <BarChart3 className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Total Movement (Qty)</p>
                    <p className="text-2xl font-black text-gray-800">{totalOut.toLocaleString()}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <TrendingUp className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Top Mover</p>
                    <p className="text-xl font-black text-gray-800 truncate max-w-[200px]" title={chartData[0]?.name}>
                        {chartData[0]?.name || '-'}
                    </p>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                    <Calendar className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 font-medium">Analysis Period</p>
                    <p className="text-xl font-black text-gray-800">
                        {timeRange === 'ALL' ? 'All History' : timeRange === '30_DAYS' ? 'Last 30 Days' : 'Last 90 Days'}
                    </p>
                </div>
            </div>
        </div>

        {/* Visual Graph Section */}
        <div className="bg-white border rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Top 10 Fast Moving Sizes
            </h3>
            
            {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-dashed border-2">
                    No transaction data available for this period
                </div>
            ) : (
                <div className="space-y-4">
                    {chartData.slice(0, 10).map((item, index) => {
                        const percent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                        return (
                            <div key={item.name} className="relative">
                                <div className="flex justify-between text-sm font-semibold mb-1 text-gray-700">
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-full bg-gray-100 text-xs flex items-center justify-center text-gray-500 border">
                                            {index + 1}
                                        </span>
                                        {item.name}
                                    </span>
                                    <span>{item.value}</span>
                                </div>
                                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${percent}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Detailed Table */}
        <div className="bg-white border rounded-xl shadow-lg overflow-hidden">
             <div className="p-4 bg-gray-50 border-b">
                 <h3 className="font-bold text-gray-700">Detailed Movement Report</h3>
             </div>
             <table className="w-full text-sm text-left">
                 <thead className="bg-gray-100 text-gray-600 font-semibold border-b">
                     <tr>
                         <th className="px-6 py-3 whitespace-nowrap">Rank</th>
                         <th className="px-6 py-3 whitespace-nowrap">Item Size (GSM)</th>
                         <th className="px-6 py-3 text-right whitespace-nowrap">Total Out Qty</th>
                         <th className="px-6 py-3 text-right whitespace-nowrap">Usage Share</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y">
                     {chartData.map((item, index) => (
                         <tr key={item.name} className="hover:bg-indigo-50">
                             <td className="px-6 py-3 text-gray-500 font-mono w-20 whitespace-nowrap">#{index + 1}</td>
                             <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{item.name}</td>
                             <td className="px-6 py-3 text-right font-bold text-indigo-700 whitespace-nowrap">{item.value}</td>
                             <td className="px-6 py-3 text-right text-gray-500 whitespace-nowrap">
                                 {totalOut > 0 ? ((item.value / totalOut) * 100).toFixed(1) : 0}%
                             </td>
                         </tr>
                     ))}
                     {chartData.length === 0 && (
                         <tr><td colSpan={4} className="p-6 text-center text-gray-400">No data found</td></tr>
                     )}
                 </tbody>
             </table>
        </div>

      </div>
    </div>
  );
};

export default ForecastPage;