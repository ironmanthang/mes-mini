import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import {
  Calendar, TrendingUp, Clock, Info,
  DollarSign, Briefcase, Layers, ShoppingBag, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useState, useEffect, type JSX } from 'react';
import { ReportServices, type MaterialCostReport, type ProductCostReport } from '../../../services/reportServices';

export const CostReport = (): JSX.Element => {
  // --- STATE ---
  const [costType, setCostType] = useState<'MATERIAL' | 'PRODUCT'>('MATERIAL');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Default to last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Loaded reports
  const [materialReport, setMaterialReport] = useState<MaterialCostReport | null>(null);
  const [productReport, setProductReport] = useState<ProductCostReport | null>(null);

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

  // --- FETCH REPORT DATA ---
  const fetchReport = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params = { startDate, endDate };
      if (costType === 'MATERIAL') {
        const data = await ReportServices.getMaterialCosts(params);
        setMaterialReport(data);
      } else {
        const data = await ReportServices.getProductCosts(params);
        setProductReport(data);
      }
    } catch (err: any) {
      console.error("Failed to load cost report:", err);
      setErrorMessage(err.response?.data?.message || err.message || "Failed to load financial cost analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [costType, startDate, endDate]);

  // --- FORMAT HELPER ---
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">

      {/* ========================================== */}
      {/* SECTION 1. CONTROL BAR & FILTERS */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="p-2 bg-green-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-green-600 animate-bounce" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Cost & Financial Reports</h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
              <Clock className="w-3 h-3" /> Timezone: Local (GMT+7)
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Cost category selector toggle */}
          <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shadow-inner">
            <button
              onClick={() => setCostType('MATERIAL')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-md transition-all ${
                costType === 'MATERIAL' ? 'bg-white text-green-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Material Spend
            </button>
            <button
              onClick={() => setCostType('PRODUCT')}
              className={`px-4 py-2 text-xs font-black uppercase rounded-md transition-all ${
                costType === 'PRODUCT' ? 'bg-white text-green-700 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Production Yield Costs
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => handlePreset('today')} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors">Today</button>
            <button onClick={() => handlePreset('7days')} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 border-l border-gray-200 transition-colors">7 Days</button>
            <button onClick={() => handlePreset('30days')} className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 border-l border-gray-200 transition-colors">30 Days</button>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-green-500 transition-all">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm font-bold text-gray-700 outline-none cursor-pointer" />
            <span className="text-gray-300 font-bold">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm font-bold text-gray-700 outline-none cursor-pointer" />
          </div>

          <button onClick={() => fetchReport()} disabled={isLoading} className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-800">Failed to load cost reporting data</h4>
            <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 2. DYNAMIC SUMMARY METRIC CARDS */}
      {/* ========================================== */}
      {costType === 'MATERIAL' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Total Spend */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Procurement Spend</p>
            <h3 className="text-2xl font-black text-gray-900">
              {isLoading ? <span className="inline-block w-40 h-8 bg-gray-100 rounded animate-pulse" /> : formatCurrency(materialReport?.totalMaterialCost ?? 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-green-600 font-bold text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Direct materials purchasing costs
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ShoppingBag className="w-12 h-12 text-green-600" /></div>
          </div>

          {/* Quantity Received */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Quantity Received</p>
            <h3 className="text-3xl font-black text-gray-900">
              {isLoading ? <span className="inline-block w-20 h-8 bg-gray-100 rounded animate-pulse" /> : `${(materialReport?.totalQuantityReceived ?? 0).toLocaleString()} `}
              <span className="text-sm text-gray-400 font-medium">units</span>
            </h3>
            <div className="mt-2 flex items-center gap-1 text-blue-600 font-bold text-xs">
              <Layers className="w-3.5 h-3.5" /> Component items added to warehouses
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Layers className="w-12 h-12 text-blue-600" /></div>
          </div>

          {/* Average Unit Cost */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Average Cost Per Unit</p>
            <h3 className="text-2xl font-black text-gray-900">
              {isLoading ? (
                <span className="inline-block w-40 h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  materialReport && materialReport.totalQuantityReceived > 0
                    ? materialReport.totalMaterialCost / materialReport.totalQuantityReceived
                    : 0
                )
              )}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-orange-600 font-bold text-xs">
              <Info className="w-3.5 h-3.5" /> Procurement cost absorption metric
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:-rotate-12 transition-transform"><Briefcase className="w-12 h-12 text-orange-600" /></div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Total Production Cost */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Production Cost</p>
            <h3 className="text-2xl font-black text-gray-900">
              {isLoading ? <span className="inline-block w-40 h-8 bg-gray-100 rounded animate-pulse" /> : formatCurrency(productReport?.totalProductionCost ?? 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-green-600 font-bold text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Fully absorbed manufacturing spend
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><ShoppingBag className="w-12 h-12 text-green-600" /></div>
          </div>

          {/* Material Cost Component */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Material Component Cost</p>
            <h3 className="text-2xl font-black text-gray-900">
              {isLoading ? <span className="inline-block w-40 h-8 bg-gray-100 rounded animate-pulse" /> : formatCurrency(productReport?.totalMaterialCost ?? 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-blue-600 font-bold text-xs">
              <Layers className="w-3.5 h-3.5" /> Cost of BOM parts consumed
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Layers className="w-12 h-12 text-blue-600" /></div>
          </div>

          {/* Conversion Cost (Labor + Overhead) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Labor & Overhead Cost</p>
            <h3 className="text-2xl font-black text-gray-900">
              {isLoading ? <span className="inline-block w-40 h-8 bg-gray-100 rounded animate-pulse" /> : formatCurrency(productReport?.totalConversionCost ?? 0)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-orange-600 font-bold text-xs">
              <Briefcase className="w-3.5 h-3.5" /> Factory conversion cost absorbed
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:-rotate-12 transition-transform"><Briefcase className="w-12 h-12 text-orange-600" /></div>
          </div>

          {/* Avg Manufacturing Cost per unit */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Avg Product Unit Cost</p>
            <h3 className="text-2xl font-black text-blue-700">
              {isLoading ? (
                <span className="inline-block w-40 h-8 bg-gray-100 rounded animate-pulse" />
              ) : (
                formatCurrency(
                  productReport && productReport.passedCount > 0
                    ? productReport.totalProductionCost / productReport.passedCount
                    : 0
                )
              )}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-gray-500 font-bold text-xs">
              <Info className="w-3.5 h-3.5" /> Calculated per passed QC piece
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp className="w-12 h-12 text-blue-600" /></div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* SECTION 3. VISUAL CHARTS TRENDS */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" /> {costType === 'MATERIAL' ? 'Procurement Spend Timeline' : 'Manufacturing Cost Trends'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">Daily absorbed expenditure trends over the selected period</p>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-xl">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          ) : costType === 'MATERIAL' ? (
            !materialReport || materialReport.dailyBreakdown.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl font-bold">No purchase records found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materialReport.dailyBreakdown} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => [formatCurrency(value), "Procurement Cost"]}
                  />
                  <Bar dataKey="totalCost" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )
          ) : (
            !productReport || productReport.dailyBreakdown.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl font-bold">No production absorption records found.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={productReport.dailyBreakdown} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: any) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line name="Total Production Cost" type="monotone" dataKey="totalProductionCost" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line name="Material Spend (BOM)" type="monotone" dataKey="totalMaterialCost" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line name="Factory Labor & Overhead" type="monotone" dataKey="totalConversionCost" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )
          )}
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION 4. BREAKDOWN TABLES */}
      {/* ========================================== */}
      {costType === 'MATERIAL' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
          {/* Supplier Spend Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Supplier Spend Distribution</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-black sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-4">Supplier Code & Name</th>
                    <th className="p-4 text-center">Items Received</th>
                    <th className="p-4 text-right">Total Purchased Value</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="w-40 h-4 bg-gray-100 rounded" /></td>
                        <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                        <td className="p-4 text-right"><div className="w-24 h-4 bg-gray-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : !materialReport || materialReport.supplierBreakdown.length === 0 ? (
                    <tr><td colSpan={3} className="p-16 text-center text-gray-400 font-bold">No supplier logs available.</td></tr>
                  ) : (
                    materialReport.supplierBreakdown.map((s, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-black text-gray-900 mr-2">{s.supplierCode}</span>
                          <span className="font-bold text-gray-800">{s.supplierName}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-600">{s.quantityReceived.toLocaleString()}</td>
                        <td className="p-4 text-right font-black text-green-700">{formatCurrency(s.totalCost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Component Spend Breakdown */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Component-wise Ingestion Spend</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-black sticky top-0 z-10 border-b">
                  <tr>
                    <th className="p-4">Component Code & Name</th>
                    <th className="p-4 text-center">Volume Bought</th>
                    <th className="p-4 text-right">Total Ingestion Cost</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="w-40 h-4 bg-gray-100 rounded" /></td>
                        <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                        <td className="p-4 text-right"><div className="w-24 h-4 bg-gray-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  ) : !materialReport || materialReport.componentBreakdown.length === 0 ? (
                    <tr><td colSpan={3} className="p-16 text-center text-gray-400 font-bold">No component ingestion logged.</td></tr>
                  ) : (
                    materialReport.componentBreakdown.map((c, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4">
                          <span className="font-mono font-black text-gray-900 mr-2">{c.componentCode}</span>
                          <span className="font-bold text-gray-800">{c.componentName}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-600">{c.quantityReceived.toLocaleString()}</td>
                        <td className="p-4 text-right font-black text-green-700">{formatCurrency(c.totalCost)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Product Cost Breakdown */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[500px]">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Product Manufacturing Cost & Yield Absorptions</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-black sticky top-0 z-10 border-b">
                <tr>
                  <th className="p-4">Product Code & Name</th>
                  <th className="p-4 text-center">Total Produced</th>
                  <th className="p-4 text-center">Passed Yield</th>
                  <th className="p-4 text-right">Material Cost</th>
                  <th className="p-4 text-right">Labor & Overhead</th>
                  <th className="p-4 text-right">Total Absorbed Spend</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-4"><div className="w-40 h-4 bg-gray-100 rounded" /></td>
                      <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                      <td className="p-4 text-center"><div className="w-12 h-4 bg-gray-100 rounded mx-auto" /></td>
                      <td className="p-4 text-right"><div className="w-24 h-4 bg-gray-100 rounded ml-auto" /></td>
                      <td className="p-4 text-right"><div className="w-24 h-4 bg-gray-100 rounded ml-auto" /></td>
                      <td className="p-4 text-right"><div className="w-28 h-4 bg-gray-100 rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : !productReport || productReport.productBreakdown.length === 0 ? (
                  <tr><td colSpan={6} className="p-16 text-center text-gray-400 font-bold">No product absorption records available.</td></tr>
                ) : (
                  productReport.productBreakdown.map((p, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4">
                        <span className="font-mono font-black text-gray-900 mr-2">{p.productCode}</span>
                        <span className="font-bold text-gray-800">{p.productName}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-gray-700">{p.totalInstancesCreated.toLocaleString()}</td>
                      <td className="p-4 text-center font-bold text-green-600">{p.passedCount.toLocaleString()}</td>
                      <td className="p-4 text-right text-gray-600 font-medium">{formatCurrency(p.totalMaterialCost)}</td>
                      <td className="p-4 text-right text-gray-600 font-medium">{formatCurrency(p.totalConversionCost)}</td>
                      <td className="p-4 text-right font-black text-blue-700">{formatCurrency(p.totalProductionCost)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
