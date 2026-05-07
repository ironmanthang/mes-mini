import { 
  Calculator, Calendar, Filter, Search, DollarSign, 
  PackageCheck, TrendingDown, AlertCircle, CheckCircle2, TrendingUp, Info
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";
import { 
  Bar, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ComposedChart
} from "recharts";

interface CostWorkOrder {
  workOrderId: number;
  code: string;
  productId: number;
  productName: string;
  productCode: string;
  completedAt: string;
  passedQty: number;
  failedQty: number;
  unitProductionCost: number; 
  totalBatchCost: number;     
}

const mockCostData: CostWorkOrder[] = [
  { workOrderId: 101, code: "WO-2026-089", productId: 1, productName: "Smart Watch V1", productCode: "PROD-SW-01", completedAt: "2026-05-01T14:30:00Z", passedQty: 500, failedQty: 0, unitProductionCost: 1250000, totalBatchCost: 625000000 },
  { workOrderId: 102, code: "WO-2026-090", productId: 2, productName: "Bluetooth Earbuds", productCode: "PROD-EB-02", completedAt: "2026-05-02T10:15:00Z", passedQty: 950, failedQty: 50, unitProductionCost: 450000, totalBatchCost: 427500000 },
  { workOrderId: 103, code: "WO-2026-091", productId: 1, productName: "Smart Watch V1", productCode: "PROD-SW-01", completedAt: "2026-05-03T16:45:00Z", passedQty: 400, failedQty: 100, unitProductionCost: 1562500, totalBatchCost: 625000000 },
  { workOrderId: 104, code: "WO-2026-092", productId: 3, productName: "Wireless Charger", productCode: "PROD-WC-03", completedAt: "2026-05-04T09:00:00Z", passedQty: 0, failedQty: 200, unitProductionCost: 0, totalBatchCost: 85000000 },
  { workOrderId: 105, code: "WO-2026-093", productId: 2, productName: "Bluetooth Earbuds", productCode: "PROD-EB-02", completedAt: "2026-05-05T11:20:00Z", passedQty: 1000, failedQty: 5, unitProductionCost: 420000, totalBatchCost: 420000000 },
  { workOrderId: 106, code: "WO-2026-094", productId: 1, productName: "Smart Watch V1", productCode: "PROD-SW-01", completedAt: "2026-05-06T15:00:00Z", passedQty: 600, failedQty: 12, unitProductionCost: 1200000, totalBatchCost: 720000000 },
];

const formatVND = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export const ProductCosts = (): JSX.Element => {
  // --- STATE ---
  const [startDate, setStartDate] = useState("2026-05-01");
  const [endDate, setEndDate] = useState("2026-05-07");
  const [selectedProductId, setSelectedProductId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Lấy danh sách sản phẩm unique cho Dropdown filter
  const uniqueProducts = useMemo(() => {
    const map = new Map();
    mockCostData.forEach(item => {
      if (!map.has(item.productId)) map.set(item.productId, item.productName);
    });
    return Array.from(map.entries());
  }, []);

  const filteredData = useMemo(() => {
    return mockCostData.filter(wo => {
      const matchSearch = wo.code.toLowerCase().includes(searchQuery.toLowerCase()) || wo.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchProduct = selectedProductId === "ALL" || wo.productId.toString() === selectedProductId;
      return matchSearch && matchProduct;
    });
  }, [searchQuery, selectedProductId, startDate, endDate]);

  const kpiStats = useMemo(() => {
    let totalCost = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    filteredData.forEach(wo => {
      totalCost += wo.totalBatchCost;
      totalPassed += wo.passedQty;
      totalFailed += wo.failedQty;
    });

    const averageCost = totalPassed > 0 ? totalCost / totalPassed : 0;
    const defectRate = (totalPassed + totalFailed) > 0 ? (totalFailed / (totalPassed + totalFailed)) * 100 : 0;

    return { totalCost, totalPassed, averageCost, defectRate };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const dailyMap = new Map<string, { date: string, volume: number, avgCost: number, totalCost: number }>();
    
    filteredData.forEach(wo => {
      const date = wo.completedAt.split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, volume: 0, avgCost: 0, totalCost: 0 });
      }
      const dayData = dailyMap.get(date)!;
      dayData.volume += wo.passedQty;
      dayData.totalCost += (wo.passedQty * wo.unitProductionCost); // Chỉ tính giá trị hàng đạt
    });

    return Array.from(dailyMap.values()).map(day => ({
      ...day,
      avgCost: day.volume > 0 ? Math.round(day.totalCost / day.volume) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);


  const renderStatusBadge = (passed: number, failed: number) => {
    if (passed === 0 && failed > 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" /> Zero Yield Loss
        </span>
      );
    }
    if (failed > 0) {
      const defectRate = ((failed / (passed + failed)) * 100).toFixed(1);
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
          <TrendingDown className="w-3.5 h-3.5" /> Yield Loss {defectRate}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-100 text-green-700 border border-green-200">
        <CheckCircle2 className="w-3.5 h-3.5" /> Normal
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-10 animate-in fade-in duration-300">

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" /> Product Costs
          </h1>
          <p className="text-sm text-gray-500 mt-1">Consolidate, allocate, and verify actual manufacturing costs.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer" />
              <span className="text-gray-400">-</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer" />
           </div>

           <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer">
                 <option value="ALL">All Products</option>
                 {uniqueProducts.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                 ))}
              </select>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-shrink-0">
         
         <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-md text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-20"><DollarSign className="w-20 h-20" /></div>
               <p className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-2">Total Product Cost</p>
               <h3 className="text-3xl font-black">{formatVND(kpiStats.totalCost)}</h3>
               <p className="text-xs text-blue-200 mt-2">Total manufacturing investment for the period</p>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><PackageCheck className="w-3.5 h-3.5" /> Total Instances</p>
                  <h3 className="text-2xl font-black text-gray-900">{kpiStats.totalPassed.toLocaleString()} <span className="text-sm text-gray-400 font-medium">pcs</span></h3>
               </div>
               <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center">
                  <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><TrendingUp className="w-3.5 h-3.5" /> Average Unit Cost</p>
                  <h3 className="text-xl font-black text-indigo-700">{formatVND(kpiStats.averageCost)}</h3>
               </div>
            </div>
         </div>

         <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 uppercase mb-4">Daily Cost Breakdown</h3>
            <div className="flex-1 w-full min-h-[200px]">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#94a3b8" />
                     <YAxis yAxisId="left" tickFormatter={(v) => `${v} pcs`} tick={{fontSize: 12}} stroke="#94a3b8" />
                     <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v / 1000000}M`} tick={{fontSize: 12}} stroke="#94a3b8" />
                     <RechartsTooltip 
                        formatter={(value: any, name: any) => {
                           if (name === "Output (pcs)") return [value, name];
                           return [formatVND(value), name];
                        }}
                     />
                     <Legend wrapperStyle={{fontSize: '12px', fontWeight: 'bold'}} />
                     <Bar yAxisId="left" dataKey="volume" name="Output (pcs)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                     <Line yAxisId="right" type="monotone" dataKey="avgCost" name="Avg Cost (VND)" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
         <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
               <Info className="w-5 h-5 text-blue-600" /> Cost Breakdown details
            </h2>
            <div className="relative">
               <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
               <input 
                  type="text" placeholder="Search WO Code, Product..." 
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white" 
               />
            </div>
         </div>

         <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left whitespace-nowrap">
               <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm border-b border-gray-200">
                  <tr>
                     <th className="p-4">Work Order (WO)</th>
                     <th className="p-4">Product</th>
                     <th className="p-4">Settlement Date</th>
                     <th className="p-4 text-center">Passed (QC)</th>
                     <th className="p-4 text-center">Failed</th>
                     <th className="p-4 text-right">Unit Cost (Frozen)</th>
                     <th className="p-4 text-center">Status & Notes</th>
                  </tr>
               </thead>
               <tbody className="text-sm divide-y divide-gray-100">
                  {filteredData.map(wo => (
                     <tr key={wo.workOrderId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-black text-gray-900">{wo.code}</td>
                        <td className="p-4">
                           <span className="font-bold text-gray-800 block">{wo.productName}</span>
                           <span className="text-[10px] text-gray-500 font-mono">{wo.productCode}</span>
                        </td>
                        <td className="p-4 text-gray-600">
                           {new Date(wo.completedAt).toLocaleString('vi-VN', { 
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                           })}
                        </td>
                        <td className="p-4 text-center">
                           <span className="font-black text-green-600">{wo.passedQty}</span>
                           <span className="text-[10px] text-gray-400 ml-1">pcs</span>
                        </td>
                        <td className="p-4 text-center">
                           <span className={`font-black ${wo.failedQty > 0 ? 'text-red-500' : 'text-gray-400'}`}>{wo.failedQty}</span>
                           <span className="text-[10px] text-gray-400 ml-1">pcs</span>
                        </td>
                        <td className="p-4 text-right font-black text-indigo-700">
                           {wo.unitProductionCost > 0 ? formatVND(wo.unitProductionCost) : <span className="text-gray-400 font-medium">0 ₫</span>}
                        </td>
                        <td className="p-4 text-center">
                           {renderStatusBadge(wo.passedQty, wo.failedQty)}
                        </td>
                     </tr>
                  ))}
                  {filteredData.length === 0 && (
                     <tr>
                        <td colSpan={7} className="p-12 text-center text-gray-400">No cost data found matching the filters.</td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

    </div>
  );
};