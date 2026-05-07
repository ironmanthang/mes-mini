import { 
  Activity, AlertTriangle, CheckCircle2, Clock, Download, 
  Factory, RefreshCw, Search, Calendar
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  ResponsiveContainer, XAxis, Tooltip, AreaChart, Area
} from "recharts";

interface MonitorWorkOrder {
  workOrderId: number;
  code: string;
  productCode: string;
  productName: string;
  targetQty: number;
  producedQty: number;
  isDelayed: boolean;
  delayHours: number;
}

const mockWorkOrders: MonitorWorkOrder[] = [
  { workOrderId: 1, code: "WO-2026-089", productCode: "PROD-SW-01", productName: "Smart Watch V1", targetQty: 1000, producedQty: 450, isDelayed: true, delayHours: 2.5 },
  { workOrderId: 2, code: "WO-2026-090", productCode: "PROD-EB-02", productName: "Bluetooth Earbuds", targetQty: 2000, producedQty: 1500, isDelayed: false, delayHours: 0 },
  { workOrderId: 3, code: "WO-2026-091", productCode: "PROD-LT-05", productName: "Laptop X1 Pro", targetQty: 500, producedQty: 100, isDelayed: true, delayHours: 4.0 },
  { workOrderId: 4, code: "WO-2026-092", productCode: "PROD-PH-09", productName: "Phone S9", targetQty: 3000, producedQty: 2800, isDelayed: false, delayHours: 0 },
  { workOrderId: 5, code: "WO-2026-093", productCode: "PROD-AC-12", productName: "Wireless Charger", targetQty: 1500, producedQty: 300, isDelayed: false, delayHours: 0 },
];

const mockDefects = [
  { name: 'Scratches / Dents', value: 45 },
  { name: 'No Power', value: 25 },
  { name: 'Display Defects', value: 20 },
  { name: 'Missing Accessories', value: 10 },
];
const DEFECT_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

const mockTimeline = [
  { time: '08:00', plan: 100, actual: 95 },
  { time: '09:00', plan: 200, actual: 180 },
  { time: '10:00', plan: 300, actual: 210 },
  { time: '11:00', plan: 400, actual: 250 },
  { time: '12:00', plan: 500, actual: 300 },
];

const mockTrendData = Array.from({ length: 7 }, () => ({ value: Math.floor(Math.random() * 100) + 50 }));

export const ProductionMonitor = (): JSX.Element => {
  // --- STATE ---
  const [syncMode, setSyncMode] = useState<'LIVE' | 'POLLING'>('LIVE');
  const [selectedWO, setSelectedWO] = useState<MonitorWorkOrder | null>(null);
  
  // Filters
  const [shift, setShift] = useState("ALL");
  const [line, setLine] = useState("ALL");
  
  // --- CALCULATE KPIs ---
  const totalActiveWOs = mockWorkOrders.length;
  const delayedWOs = mockWorkOrders.filter(wo => wo.isDelayed).length;
  
  const totalTarget = mockWorkOrders.reduce((sum, wo) => sum + wo.targetQty, 0);
  const totalProduced = mockWorkOrders.reduce((sum, wo) => sum + wo.producedQty, 0);
  const throughputPercent = Math.round((totalProduced / totalTarget) * 100) || 0;
  
  const avgQcPassRate = 92.5;

  const sortedWorkOrders = useMemo(() => {
    return [...mockWorkOrders].sort((a, b) => {
      if (a.isDelayed && !b.isDelayed) return -1;
      if (!a.isDelayed && b.isDelayed) return 1;
      return 0;
    });
  }, []);

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-100px)] animate-in fade-in duration-300">
      
      {/* ========================================== */}
      {/* ROW 1: HEADER & GLOBAL FILTERS (KHU VỰC 1) */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6">
           <h1 className="text-xl font-black text-gray-900 flex items-center gap-2 tracking-tight">
             <Activity className="w-6 h-6 text-blue-600" /> Production Monitor
           </h1>
           
           <div className="h-6 w-px bg-gray-200"></div>

           {/* Filters */}
           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                 <Clock className="w-4 h-4 text-gray-500" />
                 <select value={shift} onChange={(e) => setShift(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer">
                    <option value="ALL">All Shifts</option>
                    <option value="1">Shift 1 (06:00 - 14:00)</option>
                    <option value="2">Shift 2 (14:00 - 22:00)</option>
                    <option value="3">Shift 3 (22:00 - 06:00)</option>
                 </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                 <Factory className="w-4 h-4 text-gray-500" />
                 <select value={line} onChange={(e) => setLine(e.target.value)} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer">
                    <option value="ALL">All Lines</option>
                    <option value="L1">Line 1 (Assembly)</option>
                    <option value="L2">Line 2 (Packaging)</option>
                 </select>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                 <Calendar className="w-4 h-4 text-gray-500" />
                 <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer" />
              </div>
           </div>
        </div>

        {/* Sync Mode Toggle */}
        <div className="flex items-center gap-3 bg-gray-900 p-1.5 rounded-lg">
           <button 
             onClick={() => setSyncMode('LIVE')}
             className={`flex items-center gap-2 px-4 cursor-pointer
                py-1.5 text-xs font-bold rounded-md transition-all ${syncMode === 'LIVE' ? 'bg-white text-blue-700 shadow' : 'text-gray-400 hover:text-gray-200'}`}
           >
              {syncMode === 'LIVE' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
              Live Auto-sync
           </button>
           <button 
             onClick={() => setSyncMode('POLLING')}
             className={`flex items-center gap-2 px-4 cursor-pointer
                py-1.5 text-xs font-bold rounded-md transition-all ${syncMode === 'POLLING' ? 'bg-white text-gray-800 shadow' : 'text-gray-400 hover:text-gray-200'}`}
           >
              <RefreshCw className="w-3.5 h-3.5" /> Polling (1m)
           </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* ROW 2: REAL-TIME KPI TILES (KHU VỰC 2) */}
      {/* ========================================== */}
      <div className="grid grid-cols-4 gap-5 flex-shrink-0">
        
        {/* Card 1: Active WOs */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
            <p className="text-xs font-bold text-gray-500 uppercase">Active Work Orders</p>
            <div className="flex items-end gap-3 mt-1">
                <span className="text-3xl font-black text-gray-900">{totalActiveWOs}</span>
                <span className="text-xs font-bold text-green-600 mb-1.5 flex items-center">↑ 2 mới</span>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockTrendData}>
                     <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
        </div>

        {/* Card 2: Throughput */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <p className="text-xs font-bold text-gray-500 uppercase">Throughput (Sản lượng)</p>
            <div className="flex items-end justify-between mt-1">
                <div>
                   <span className="text-3xl font-black text-blue-700">{totalProduced.toLocaleString()}</span>
                   <span className="text-sm font-bold text-gray-400 ml-1">/ {totalTarget.toLocaleString()}</span>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1.5">{throughputPercent}% Completed</span>
            </div>
            {/* Sparkline Line */}
            <div className="absolute bottom-0 left-0 w-full h-8 opacity-20">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockTrendData}>
                     <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} dot={false} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
        </div>

        {/* Card 3: Delay Alerts (Logic Cảnh báo Đỏ) */}
        <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden transition-colors duration-500 ${delayedWOs > 0 ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
            <p className={`text-xs font-bold uppercase ${delayedWOs > 0 ? 'text-red-600' : 'text-gray-500'}`}>Delay Alerts</p>
            <div className="flex items-center justify-between mt-1">
                <span className={`text-3xl font-black ${delayedWOs > 0 ? 'text-red-700' : 'text-gray-900'}`}>{delayedWOs}</span>
                {delayedWOs > 0 ? (
                    <div className="bg-red-100 text-red-600 p-2 rounded-full relative">
                        <AlertTriangle className="w-6 h-6 relative z-10" />
                    </div>
                ) : (
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                )}
            </div>
        </div>

        {/* Card 4: QC Pass Rate (Logic Cảnh báo Cam) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <p className="text-xs font-bold text-gray-500 uppercase">Average QC Pass Rate</p>
            <div className="flex items-end gap-3 mt-1">
                <span className={`text-3xl font-black ${avgQcPassRate < 95 ? 'text-orange-500' : 'text-green-600'}`}>{avgQcPassRate}%</span>
                <span className="text-xs font-bold text-red-500 mb-1.5">↓ 1.5% vs KPI</span>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-12 opacity-20">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrendData}>
                     <Area type="monotone" dataKey="value" stroke="#f97316" fill="#fb923c" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="flex-1 flex gap-5 overflow-hidden">
        
        <div className="flex-[7] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-900">Production Progress Grid</h2>
              <div className="relative">
                 <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                 <input type="text" placeholder="Search WO Code..." className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left whitespace-nowrap">
                 <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold sticky top-0 z-10 shadow-sm">
                    <tr>
                       <th className="p-4">WO Code</th>
                       <th className="p-4">Product Info</th>
                       <th className="p-4 text-center">Output (Actual/Target)</th>
                       <th className="p-4 w-48">Progress (%)</th>
                       <th className="p-4 text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm divide-y divide-gray-100">
                    {sortedWorkOrders.map(wo => {
                       const progress = Math.round((wo.producedQty / wo.targetQty) * 100);
                       const isSelected = selectedWO?.workOrderId === wo.workOrderId;
                       
                       return (
                          <tr 
                             key={wo.workOrderId} 
                             onClick={() => setSelectedWO(wo)}
                             className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'} ${wo.isDelayed && !isSelected ? 'bg-red-50/20' : ''}`}
                          >
                             <td className="p-4 font-mono font-black text-gray-900">{wo.code}</td>
                             <td className="p-4">
                                <span className="font-bold text-gray-800 block">{wo.productName}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{wo.productCode}</span>
                             </td>
                             <td className="p-4 text-center">
                                <span className={`font-bold ${wo.isDelayed ? 'text-red-600' : 'text-blue-600'}`}>{wo.producedQty}</span>
                                <span className="text-gray-400 mx-1">/</span>
                                <span className="text-gray-700 font-medium">{wo.targetQty}</span>
                             </td>
                             <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-500 ${wo.isDelayed ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-gray-600 w-8">{progress}%</span>
                                </div>
                             </td>
                             <td className="p-4 text-center">
                                {wo.isDelayed ? (
                                   <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase border border-red-200">
                                      Delayed
                                   </span>
                                ) : (
                                   <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase border border-green-200">
                                      On Track
                                   </span>
                                )}
                             </td>
                          </tr>
                       )
                    })}
                 </tbody>
              </table>
           </div>
        </div>

        <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
           
           {!selectedWO ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                 <Search className="w-12 h-12 text-gray-300 mb-4" />
                 <p className="text-gray-500 font-medium">Please select a Work Order on the left to view progress details and root cause analysis.</p>
              </div>
           ) : (
              <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-300 h-full overflow-hidden">
                 
                 <div className="p-5 border-b border-gray-100 bg-gray-900 text-white flex-shrink-0">
                    <h3 className="text-lg font-black tracking-wide">{selectedWO.code}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedWO.productName}</p>
                    
                    {selectedWO.isDelayed && (
                       <div className="mt-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-200">Warning: Expected {selectedWO.delayHours} hours delay vs Deadline.</span>
                       </div>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    
                    {/* Vùng B: Timeline Chart */}
                    <div className="space-y-2">
                       <h4 className="text-xs font-bold text-gray-500 uppercase">Velocity Progress</h4>
                       <div className="h-40 w-full border border-gray-100 rounded-lg p-2 bg-white">
                          <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={mockTimeline}>
                                <XAxis dataKey="time" tick={{fontSize: 10}} stroke="#cbd5e1" />
                                <Tooltip contentStyle={{fontSize: '12px', borderRadius: '8px'}} />
                                <Line type="monotone" dataKey="plan" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="Plan" dot={false} />
                                <Line type="monotone" dataKey="actual" stroke={selectedWO.isDelayed ? "#ef4444" : "#22c55e"} strokeWidth={3} name="Actual" />
                             </LineChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Vùng C: Defect Breakdown (Nếu bị trễ) */}
                    {selectedWO.isDelayed && (
                       <div className="space-y-2 animate-in fade-in">
                          <h4 className="text-xs font-bold text-gray-500 uppercase">Defect Statistics - Bottleneck</h4>
                          <div className="h-40 w-full relative border border-gray-100 rounded-lg bg-gray-50 flex items-center">
                             <div className="w-1/2 h-full">
                                <ResponsiveContainer width="100%" height="100%">
                                   <PieChart>
                                      <Pie data={mockDefects} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={2} dataKey="value">
                                         {mockDefects.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={DEFECT_COLORS[index % DEFECT_COLORS.length]} />
                                         ))}
                                      </Pie>
                                      <Tooltip contentStyle={{fontSize: '10px'}} />
                                   </PieChart>
                                </ResponsiveContainer>
                             </div>
                             <div className="w-1/2 flex flex-col justify-center gap-2 pr-2">
                                {mockDefects.map((d, i) => (
                                   <div key={i} className="flex items-center justify-between text-[10px] font-bold text-gray-600">
                                      <div className="flex items-center gap-1.5 truncate">
                                         <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor: DEFECT_COLORS[i]}}></span>
                                         <span className="truncate">{d.name}</span>
                                      </div>
                                      <span>{d.value}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    )}

                 </div>

                 {/* Vùng D: Action Buttons */}
                 <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button className="w-full py-2.5 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-sm cursor-pointer active:scale-95">
                       <Download className="w-4 h-4" /> Export Progress Report
                    </button>
                 </div>
              </div>
           )}

        </div>

      </div>
    </div>
  );
};