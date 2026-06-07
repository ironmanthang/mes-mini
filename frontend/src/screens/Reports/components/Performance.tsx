import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, PieChart, Pie
} from 'recharts';
import {
  Calendar, Activity, Target, AlertCircle, TrendingUp, CheckCircle2,
  Clock, Info, LayoutDashboard, Loader2, RefreshCw
} from 'lucide-react';
import { useState, useEffect, useMemo, type JSX } from 'react';
import { ReportServices, type LinePerformanceReport } from '../../../services/reportServices';
import { ProductionLineServices, type ProductionLine } from '../../../services/productionLineServices';
import { ProductServices, type Product } from '../../../services/productServices';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#94a3b8'];

export const Performance = (): JSX.Element => {
  // --- STATE ---
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days for a richer dashboard
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [lineId, setLineId] = useState<string>("ALL");
  const [productId, setProductId] = useState<string>("ALL");
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reportData, setReportData] = useState<LinePerformanceReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Meta selectors
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // --- PRESETS ---
  const handlePreset = (preset: 'today' | '7days' | '30days') => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // --- FETCH CONFIGS ON STARTUP ---
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [linesRes, productsRes] = await Promise.all([
          ProductionLineServices.getAllProductionLines(),
          ProductServices.getAllProducts()
        ]);
        setLines(linesRes);
        const dataArray = Array.isArray(productsRes) ? productsRes : (productsRes as any).data || [];
        setProducts(dataArray);
      } catch (err) {
        console.error("Failed to load metadata filters:", err);
      }
    };
    fetchMetadata();
  }, []);

  // --- FETCH MAIN DASHBOARD REPORT ---
  const fetchDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: any = {
        startDate,
        endDate
      };
      if (lineId !== "ALL") params.productionLineId = Number(lineId);
      if (productId !== "ALL") params.productId = Number(productId);

      const data = await ReportServices.getLinePerformance(params);
      setReportData(data);
    } catch (err: any) {
      console.error("Failed to fetch performance report:", err);
      setErrorMessage(err.response?.data?.message || err.message || "An unexpected error occurred while fetching report.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate, lineId, productId]);

  // --- COMPUTED PROPERTIES ---
  const topLine = useMemo(() => {
    if (!reportData || reportData.lines.length === 0) return { name: "None", output: 0 };
    let top = reportData.lines[0];
    for (const line of reportData.lines) {
      if (line.totalProduced > top.totalProduced) {
        top = line;
      }
    }
    return { name: top.lineName, output: top.totalProduced };
  }, [reportData]);

  const chartData = useMemo(() => {
    if (!reportData) return [];
    return reportData.lines.map(line => ({
      lineName: line.lineName || "Unassigned",
      Passed: line.passedCount,
      Failed: line.failedCount
    }));
  }, [reportData]);

  const productBreakdown = useMemo(() => {
    if (!reportData) return [];
    const map = new Map<number, { name: string; value: number }>();
    for (const line of reportData.lines) {
      for (const prod of line.products) {
        const existing = map.get(prod.productId) ?? { name: prod.productName, value: 0 };
        existing.value += prod.totalProduced;
        map.set(prod.productId, existing);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [reportData]);

  const productPieData = useMemo(() => {
    const total = productBreakdown.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return [];
    return productBreakdown;
  }, [productBreakdown]);

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">

      {/* ========================================== */}
      {/* SECTION 1. CONTROL TOOLBAR & FILTERS */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-2 bg-blue-50 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Line Performance Analytics</h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
              <Clock className="w-3 h-3" /> Timezone: Local (GMT+7)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Quick presets */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => handlePreset('today')} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors">Today</button>
            <button onClick={() => handlePreset('7days')} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 border-l border-gray-200 transition-colors">7 Days</button>
            <button onClick={() => handlePreset('30days')} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 border-l border-gray-200 transition-colors">30 Days</button>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm font-bold text-gray-700 outline-none cursor-pointer" />
            <span className="text-gray-300 font-bold">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm font-bold text-gray-700 outline-none cursor-pointer" />
          </div>

          {/* Line & Product filters */}
          <select value={lineId} onChange={e => setLineId(e.target.value)} className="text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none cursor-pointer shadow-sm">
            <option value="ALL">All Lines</option>
            {lines.map(l => (
              <option key={l.productionLineId} value={l.productionLineId}>{l.lineName}</option>
            ))}
          </select>

          <select value={productId} onChange={e => setProductId(e.target.value)} className="text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none cursor-pointer shadow-sm w-44">
            <option value="ALL">All Products</option>
            {products.map(p => (
              <option key={p.productId} value={p.productId}>{p.productName}</option>
            ))}
          </select>

          <button onClick={() => fetchDashboard()} disabled={isLoading} className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Failed to load analytics</h4>
            <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 2. TELEMETRY OVERVIEW CARDS */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Output */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Output</p>
          <h3 className="text-3xl font-black text-gray-900">
            {isLoading ? (
              <span className="inline-block w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              `${(reportData?.totals.totalProduced ?? 0).toLocaleString()} `
            )}
            <span className="text-sm text-gray-400 font-medium">pcs</span>
          </h3>
          <div className="mt-2 flex items-center gap-1 text-green-600 font-bold text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> Live telemetry from factory
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Activity className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        {/* Pass Rate */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Pass Rate</p>
          <h3 className={`text-3xl font-black ${
            isLoading ? 'text-gray-900' : (reportData?.totals.passRate ?? 0) < 95 ? 'text-red-600' : 'text-green-600'
          }`}>
            {isLoading ? (
              <span className="inline-block w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              `${reportData?.totals.passRate ?? 0}%`
            )}
          </h3>
          <div className="mt-2 flex items-center gap-1.5">
            {!isLoading && (reportData?.totals.passRate ?? 0) < 95 ? (
              <div className="flex items-center gap-1 text-red-500 font-bold text-xs animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" /> Below Target (95%)
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Yield Level
              </div>
            )}
          </div>
        </div>

        {/* Top Line */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Top Line Performance</p>
          <h3 className="text-lg font-black text-gray-900 truncate">
            {isLoading ? <span className="inline-block w-36 h-6 bg-gray-100 rounded animate-pulse" /> : topLine.name}
          </h3>
          <p className="text-sm font-bold text-blue-600 mt-1">
            {isLoading ? <span className="inline-block w-20 h-4 bg-gray-50 rounded animate-pulse" /> : `${topLine.output.toLocaleString()} pcs processed`}
          </p>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Target className="w-12 h-12 text-indigo-600" />
          </div>
        </div>

        {/* Quality Defect Rate */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">QC Defect Rate</p>
          <h3 className="text-3xl font-black text-red-500">
            {isLoading ? (
              <span className="inline-block w-20 h-8 bg-gray-100 rounded animate-pulse" />
            ) : (
              `${reportData?.totals.defectRate ?? 0}%`
            )}
          </h3>
          <p className="text-xs font-bold text-gray-400 mt-1 truncate">
            {isLoading ? (
              <span className="inline-block w-28 h-4 bg-gray-50 rounded animate-pulse" />
            ) : (
              `Failed: ${reportData?.totals.failedCount ?? 0} pcs | Pending: ${reportData?.totals.pendingQcCount ?? 0} pcs`
            )}
          </p>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:-rotate-12 transition-transform">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION 3. LINE YIELD CHART */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Line Yield & Output Breakdown
            </h2>
            <p className="text-xs text-gray-500 mt-1">Passed vs Failed unit breakdown by production line</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#10b981]"></span> Passed</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ef4444]"></span> Failed</div>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl font-bold">
              No line data available for the selected parameters.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="lineName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="Passed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={40} />
                <Bar dataKey="Failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION 4. DATA TABLES & YIELD BREAKDOWNS */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[520px]">

        {/* Detailed Line Breakdown (3/5 width) */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden lg:col-span-3">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <Activity className="w-5 h-5 text-blue-600 animate-pulse" /> Detailed Line Performance Leaderboard
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-black sticky top-0 z-10 border-b">
                <tr>
                  <th className="p-4">Line Name & Location</th>
                  <th className="p-4 text-center">Produced</th>
                  <th className="p-4 text-center">QC Checked</th>
                  <th className="p-4 text-center">Passed</th>
                  <th className="p-4 text-center">Failed</th>
                  <th className="p-4 text-right">Yield (Pass Rate)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4"><div className="w-32 h-4 bg-gray-100 rounded" /></td>
                      <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                      <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                      <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                      <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                      <td className="p-4 text-right"><div className="w-16 h-4 bg-gray-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : !reportData || reportData.lines.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-gray-400 font-bold">
                      No data loaded. Change parameters or select a wider date range.
                    </td>
                  </tr>
                ) : (
                  reportData.lines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {line.lineName.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800">{line.lineName}</span>
                            {line.location && <div className="text-[10px] text-gray-400 font-bold">{line.location}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-gray-700">{line.totalProduced.toLocaleString()}</td>
                      <td className="p-4 text-center text-gray-500 font-bold">{line.qcCompleted.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-green-600">{line.passedCount.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-red-600">{line.failedCount.toLocaleString()}</td>
                      <td className={`p-4 text-right font-black text-base text-blue-700`}>
                        {line.passRate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Output Pie Chart (2/5 width) */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <Target className="w-5 h-5 text-indigo-500" /> Product Output Breakdown
            </h2>
          </div>

          <div className="flex-1 flex flex-col md:flex-row items-center p-6 gap-6 overflow-y-auto">
            <div className="w-full md:w-1/2 h-48 relative">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
              ) : productPieData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold text-center">No product data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={productPieData}
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productPieData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legend & Stats Table */}
            <div className="w-full md:w-1/2 space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share of Manufacturing Vol</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                  ))
                ) : productBreakdown.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No output recorded.</p>
                ) : (
                  productBreakdown.map((item, idx) => {
                    const totalVal = productBreakdown.reduce((s, c) => s + c.value, 0);
                    const percentage = totalVal > 0 ? ((item.value / totalVal) * 100).toFixed(1) : "0";
                    return (
                      <div key={idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                          <span className="text-xs font-bold text-gray-700 truncate group-hover:text-blue-600 transition-colors" title={item.name}>{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-gray-900 ml-2">{percentage}%</span>
                      </div>
                    )
                  })
                )}
              </div>
              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Info className="w-3.5 h-3.5" /> Output grouped by product volume
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};