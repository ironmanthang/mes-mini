import { 
  Search, Filter, Activity, AlertTriangle, 
  TrendingUp, TrendingDown, Target, CheckCircle2, 
  RefreshCcw, Download, Clock, BarChart3, PieChart
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";

const MOCK_DEFECTS = [
  { type: "Scratches / Dents", count: 12, color: "bg-orange-500" },
  { type: "Display Defects", count: 8, color: "bg-blue-500" },
  { type: "No Power", count: 5, color: "bg-red-500" },
  { type: "Missing Accessories", count: 3, color: "bg-yellow-500" }
];

export const ProductionMonitor = (): JSX.Element => {
  const [syncMode, setSyncMode] = useState<'LIVE' | 'POLLING'>('LIVE');
  const [selectedShift, setSelectedShift] = useState("ALL");
  const [selectedLine, setSelectedLine] = useState("ALL");
  
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);

  const fetchMonitorData = async () => {
    setIsLoading(true);
    try {
      const response = await WorkOrderServices.getAllWorkOrders({ limit: 100, status: 'IN_PROGRESS' });
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      setWorkOrders(dataArray);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading Monitor data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
    let interval: ReturnType<typeof setInterval>;
    if (syncMode === 'LIVE') {
        interval = setInterval(fetchMonitorData, 30000);
    }
    return () => clearInterval(interval);
  }, [syncMode]);

  // ==========================================
  // LOGIC TÍNH TOÁN KPI (VÙNG 2)
  // ==========================================
  const kpiData = useMemo(() => {
    const totalActive = workOrders.length;
    let totalTarget = 0;
    let totalProduced = 0;
    let delayedCount = 0;

    workOrders.forEach(wo => {
        totalTarget += wo.quantity;
        const mockProduced = Math.floor(wo.quantity * 0.6); 
        totalProduced += mockProduced;
        
        // Logic tính Delayed
        if (wo.endDate && new Date(wo.endDate) < new Date()) {
            delayedCount++;
        } else if (mockProduced / wo.quantity < 0.3) {
            // Giả lập logic vận tốc: Nếu làm đc < 30% mà sắp hết hạn cũng tính là Delayed
            delayedCount++;
        }
    });

    const throughput = totalTarget > 0 ? (totalProduced / totalTarget) * 100 : 0;
    const qcPassRate = 96.5; // Giả lập tỷ lệ Pass

    return { totalActive, totalTarget, totalProduced, throughput, delayedCount, qcPassRate };
  }, [workOrders]);

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  
  // Selected Work Order Data
  const selectedWO = workOrders.find(w => w.workOrderId === selectedWOId);
  const isDelayedWO = selectedWO && (selectedWO.endDate && new Date(selectedWO.endDate) < new Date() || kpiData.delayedCount > 0);

  // Auto-Sort: Đẩy Delayed lên đầu
  const sortedWorkOrders = [...workOrders].sort((a, b) => {
      const aDelayed = a.endDate && new Date(a.endDate) < new Date() ? 1 : 0;
      const bDelayed = b.endDate && new Date(b.endDate) < new Date() ? 1 : 0;
      return bDelayed - aDelayed; // Descending
  });

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      
      {/* ========================================== */}
      {/* KHU VỰC 1: HEADER & GLOBAL FILTERS */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 rounded-lg"><Activity className="w-6 h-6 text-blue-700" /></div>
              <div>
                  <h2 className="text-xl font-bold text-gray-900">Production Monitor</h2>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Last updated: {lastUpdated.toLocaleTimeString('en-US')}
                  </p>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                  <Clock className="w-4 h-4 text-gray-500 ml-2" />
                  <select 
                      value={selectedShift} onChange={e => setSelectedShift(e.target.value)}
                      className="bg-transparent text-sm p-1 outline-none text-gray-700 font-bold cursor-pointer"
                  >
                      <option value="ALL">All Shifts</option>
                      <option value="S1">Shift 1 (06:00 - 14:00)</option>
                      <option value="S2">Shift 2 (14:00 - 22:00)</option>
                  </select>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                  <Filter className="w-4 h-4 text-gray-500 ml-2" />
                  <select 
                      value={selectedLine} onChange={e => setSelectedLine(e.target.value)}
                      className="bg-transparent text-sm p-1 outline-none text-gray-700 font-bold cursor-pointer"
                  >
                      <option value="ALL">All Lines</option>
                      <option value="LINE-A">Line Alpha</option>
                      <option value="LINE-B">Line Beta</option>
                  </select>
              </div>
              
              <div className="w-px h-8 bg-gray-200 mx-2"></div>

              {/* Sync Mode Toggle */}
              <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Sync</span>
                  <button 
                      onClick={() => setSyncMode(syncMode === 'LIVE' ? 'POLLING' : 'LIVE')}
                      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${syncMode === 'LIVE' ? 'bg-green-500' : 'bg-gray-600'}`}
                  >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${syncMode === 'LIVE' ? 'translate-x-5' : 'translate-x-0'}`}></span>
                  </button>
                  {syncMode === 'LIVE' 
                    ? <span className="flex items-center gap-1.5 text-xs font-bold text-green-400"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Live</span>
                    : <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400"><RefreshCcw className="w-3 h-3" /> Polling</span>
                  }
              </div>
          </div>
      </div>

      {/* ========================================== */}
      {/* KHU VỰC 2: REAL-TIME KPI TILES */}
      {/* ========================================== */}
      <div className="grid grid-cols-4 gap-6">
          
          {/* Tile 1: Active Work Orders */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-start">
                  <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Active Work Orders</p>
                      <h3 className="text-3xl font-black text-gray-900">{kpiData.totalActive}</h3>
                      <p className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3"/> ↑ 2 new orders</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Activity className="w-5 h-5" /></div>
              </div>
              {/* Fake Sparkline */}
              <div className="absolute bottom-0 left-0 w-full h-12 opacity-10 flex items-end justify-between px-2">
                  {[40, 60, 45, 80, 50, 70, 90, 60].map((h, i) => (
                      <div key={i} className="w-1/12 bg-blue-600 rounded-t-sm transition-all duration-1000" style={{ height: `${h}%` }}></div>
                  ))}
              </div>
          </div>

          {/* Tile 2: Throughput */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-start">
                  <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Throughput</p>
                      <h3 className="text-2xl font-black text-gray-900">
                          {kpiData.totalProduced.toLocaleString()} <span className="text-sm text-gray-400 font-medium">/ {kpiData.totalTarget.toLocaleString()}</span>
                      </h3>
                      <p className="text-xs font-bold text-blue-600 flex items-center gap-1 mt-1">{kpiData.throughput.toFixed(1)}% Completed</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Target className="w-5 h-5" /></div>
              </div>
               {/* Fake Sparkline Line */}
              <svg className="absolute bottom-0 left-0 w-full h-12 opacity-20" preserveAspectRatio="none" viewBox="0 0 100 100">
                 <path d="M0,100 L0,80 L20,60 L40,70 L60,40 L80,50 L100,20 L100,100 Z" fill="currentColor" className="text-indigo-600"></path>
              </svg>
          </div>

          {/* Tile 3: Delay Alerts (Có Pulse) */}
          <div className={`rounded-xl shadow-sm p-5 relative overflow-hidden transition-colors border-2 ${kpiData.delayedCount > 0 ? 'bg-red-50 border-red-500' : 'bg-white border-gray-200'}`}>
              <div className="relative z-10 flex justify-between items-start">
                  <div>
                      <p className={`text-xs font-black uppercase tracking-wider mb-1 ${kpiData.delayedCount > 0 ? 'text-red-800' : 'text-gray-500'}`}>Delay Alerts</p>
                      <h3 className={`text-3xl font-black ${kpiData.delayedCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>{kpiData.delayedCount}</h3>
                      <p className={`text-xs font-bold flex items-center gap-1 mt-1 ${kpiData.delayedCount > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {kpiData.delayedCount > 0 ? 'Orders Delayed' : 'All on track'}
                      </p>
                  </div>
                  <div className={`p-3 rounded-lg ${kpiData.delayedCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
                      {kpiData.delayedCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
              </div>
          </div>

          {/* Tile 4: QC Pass Rate */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-start">
                  <div>
                      <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-1">Avg QC Pass Rate</p>
                      <h3 className={`text-3xl font-black ${kpiData.qcPassRate < 98 ? 'text-orange-600' : 'text-green-600'}`}>{kpiData.qcPassRate}%</h3>
                      <p className="text-xs font-bold text-orange-600 flex items-center gap-1 mt-1"><TrendingDown className="w-3 h-3"/> ↓ 1.5% vs Target 98%</p>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
              </div>
          </div>
      </div>

      {/* ========================================== */}
      {/* ROW 3: KHU VỰC 3 (GRID) VÀ KHU VỰC 4 (PANEL) */}
      {/* ========================================== */}
      <div className="flex gap-6 h-[500px]">
          
          {/* KHU VỰC 3: PRODUCTION PROGRESS GRID (70%) */}
          <div className="flex-[7] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                     <BarChart3 className="w-4 h-4 text-blue-600" /> Production Progress Grid
                 </h3>
             </div>
             
             <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10 shadow-sm border-b">
                        <tr>
                            <th className="p-4 pl-6">WO Code</th>
                            <th className="p-4">Product Info</th>
                            <th className="p-4 text-right">Output (Act / Tgt)</th>
                            <th className="p-4 w-48">Progress</th>
                            <th className="p-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                        {sortedWorkOrders.map((wo) => {
                            const isDelayed = wo.endDate && new Date(wo.endDate) < new Date();
                            const mockProduced = Math.floor(wo.quantity * (isDelayed ? 0.4 : 0.8)); // Fake data logic
                            const progress = Math.min(100, Math.round((mockProduced / wo.quantity) * 100));
                            const isSelected = selectedWOId === wo.workOrderId;

                            return (
                                <tr 
                                    key={wo.workOrderId} 
                                    onClick={() => setSelectedWOId(wo.workOrderId)}
                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="p-4 pl-6 font-mono font-bold text-blue-700">{wo.code}</td>
                                    <td className="p-4">
                                        <span className="font-bold text-gray-900 block">{wo.product.productName}</span>
                                        <span className="text-[10px] text-gray-500 font-mono">{wo.product.code}</span>
                                    </td>
                                    <td className="p-4 text-right font-bold">
                                        <span className={isDelayed ? 'text-red-600' : 'text-blue-600'}>{mockProduced}</span> 
                                        <span className="text-gray-400 mx-1">/</span> {wo.quantity}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all duration-500 ${isDelayed ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 w-8">{progress}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {isDelayed ? (
                                            <span className="px-2.5 py-1 rounded text-[10px] font-black bg-red-100 text-red-700 border border-red-200 uppercase animate-pulse">Delayed</span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase">On Track</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                 </table>
             </div>
          </div>

          {/* KHU VỰC 4: ROOT CAUSE ANALYTICS PANEL (30%) */}
          <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
             <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2">
                     <PieChart className="w-4 h-4 text-blue-600" /> Root Cause Analysis
                 </h3>
             </div>

             {/* Empty State vs Detail State */}
             {!selectedWO ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                    <Search className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                        Please select a Work Order from the left to view progress details and root cause analysis.
                    </p>
                 </div>
             ) : (
                 <div className="flex-1 overflow-y-auto flex flex-col animate-in slide-in-from-right-4">
                    <div className="p-5 space-y-6 flex-1">
                        
                        {/* Section A: Order Overview */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Analyzing Order</span>
                            <h4 className="text-lg font-mono font-bold text-blue-700">{selectedWO.code}</h4>
                            <p className="text-sm font-medium text-gray-800">{selectedWO.product.productName}</p>
                            
                            {isDelayedWO && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-red-800 uppercase">Delay Alert</p>
                                        <p className="text-xs text-red-700 mt-0.5">Estimated 2 hours late vs Deadline.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section B: Velocity Chart */}
                        <div className="space-y-2">
                            <h5 className="text-xs font-black text-gray-500 uppercase tracking-wider">Velocity Chart</h5>
                            <div className="h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 relative flex items-end">
                                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                                    <polyline points="0,100 100,0" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" />
                                    <polyline points="0,100 20,85 40,75 60,65 80,60" fill="none" stroke={isDelayedWO ? "#ef4444" : "#22c55e"} strokeWidth="3" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[10px] text-gray-400 font-bold bg-white/80 px-2 py-1 rounded">Chart Simulation</span>
                                </div>
                            </div>
                        </div>

                        {/* Section C: Defect Breakdown */}
                        {isDelayedWO && (
                            <div className="space-y-3">
                                <h5 className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <PieChart className="w-3.5 h-3.5" /> Defect Breakdown (Bottleneck)
                                </h5>
                                <div className="space-y-2.5">
                                    {MOCK_DEFECTS.map(defect => (
                                        <div key={defect.type} className="flex items-center gap-3 text-xs">
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${defect.color}`}></div>
                                                <span className="font-medium text-gray-700 truncate">{defect.type}</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{defect.count} defects</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 mt-2 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-xs text-orange-800 leading-relaxed font-medium">
                                        💡 <b>Suggestion:</b> Rework rate due to "Scratches" is too high, causing delays. Request inspection of the packaging machine on Line Beta.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors shadow-sm cursor-pointer">
                            <Download className="w-4 h-4" /> Export Progress Report (PDF)
                        </button>
                    </div>
                 </div>
             )}
          </div>

      </div>

    </div>
  );
};