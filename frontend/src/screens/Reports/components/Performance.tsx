import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  ResponsiveContainer, PieChart, Pie
} from 'recharts';
import {
  Calendar, Users, Activity, Target, AlertCircle, TrendingUp, CheckCircle2,
  Download, Clock, Info, LayoutDashboard, Search,
} from 'lucide-react';
import { useState, useEffect, type JSX } from 'react';

interface PerformanceDashboardData {
  metrics: {
    totalOutput: number;
    overallPassRate: number;
    topLine: { name: string; output: number };
    topStaff: { name: string; count: number };
  };
  linePerformance: {
    lineName: string;
    passed: number;
    failed: number;
  }[];
  staffLeaderboard: {
    employeeName: string;
    role: string;
    processedCount: number;
  }[];
  defectBreakdown: {
    name: string;
    value: number;
  }[];
}

const mockData: PerformanceDashboardData = {
  metrics: {
    totalOutput: 4580,
    overallPassRate: 94.2,
    topLine: { name: "Line 01 - Assembly", output: 1250 },
    topStaff: { name: "John Doe", count: 320 }
  },
  linePerformance: [
    { lineName: "Line 01", passed: 1200, failed: 50 },
    { lineName: "Line 02", passed: 980, failed: 20 },
    { lineName: "Line 03", passed: 1100, failed: 150 },
    { lineName: "Unassigned", passed: 1080, failed: 0 }
  ],
  staffLeaderboard: [
    { employeeName: "John Doe", role: "QC Staff", processedCount: 320 },
    { employeeName: "Jane Smith", role: "Assembly Worker", processedCount: 295 },
    { employeeName: "Michael Brown", role: "QC Staff", processedCount: 280 },
    { employeeName: "Emily Davis", role: "QC Staff", processedCount: 250 },
    { employeeName: "Alex Wilson", role: "Assembly Worker", processedCount: 210 }
  ],
  defectBreakdown: [
    { name: "Scratches", value: 45 },
    { name: "No Power", value: 30 },
    { name: "Display Error", value: 15 },
    { name: "Missing Parts", value: 7 },
    { name: "Others", value: 3 } // Group Others
  ]
};

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#94a3b8'];

export const Performance = (): JSX.Element => {
  // --- STATE ---
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [_isLoading, setIsLoading] = useState(false);

  // --- LOGIC: CHUYỂN ĐỔI SANG UTC TRƯỚC KHI GỬI (Giai đoạn 1) ---
  const fetchDashboard = async () => {
    setIsLoading(true);
    // FE chuyển đổi mốc thời gian sang UTC (ISO 8601)
    const utcStart = new Date(startDate).toISOString();
    const utcEnd = new Date(endDate).toISOString();
    console.log(`Calling API: GET /reports/performance-dashboard?startDate=${utcStart}&endDate=${utcEnd}`);

    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">

      {/* ========================================== */}
      {/* MỤC 1. BỘ LỌC THỜI GIAN (Time Filters) */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Performance Dashboard</h1>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
              <Clock className="w-3 h-3" /> Timezone: Local (GMT+7)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Presets */}
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors">Today</button>
            <button className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors border-l border-gray-200">Last 7 Days</button>
            <button className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors border-l border-gray-200">This Month</button>
          </div>

          {/* Range Picker */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition-all">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-sm font-bold text-gray-700 outline-none cursor-pointer" />
            <span className="text-gray-300 font-bold">→</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-sm font-bold text-gray-700 outline-none cursor-pointer" />
          </div>

          <button onClick={() => alert("Exporting PDF...")} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-bold rounded-lg text-sm hover:bg-black transition-all active:scale-95 shadow-md">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* ========================================== */}
      {/* MỤC 2. THẺ KPI TỔNG QUAN (Overview Metrics) */}
      {/* ========================================== */}
      <div className="grid grid-cols-4 gap-5">
        {/* Total Output */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Output</p>
          <h3 className="text-3xl font-black text-gray-900">{mockData.metrics.totalOutput.toLocaleString()} <span className="text-sm text-gray-400 font-medium">pcs</span></h3>
          <div className="mt-2 flex items-center gap-1 text-green-600 font-bold text-xs">
            <TrendingUp className="w-3.5 h-3.5" /> +12% vs last period
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity className="w-12 h-12 text-blue-600" /></div>
        </div>

        {/* Pass Rate (Logic Cảnh báo Đỏ < 95%) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Overall Pass Rate</p>
          <h3 className={`text-3xl font-black ${mockData.metrics.overallPassRate < 95 ? 'text-red-600' : 'text-green-600'}`}>
            {mockData.metrics.overallPassRate}%
          </h3>
          <div className="mt-2 flex items-center gap-1.5">
            {mockData.metrics.overallPassRate < 95 ? (
              <div className="flex items-center gap-1 text-red-500 font-bold text-xs animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" /> Below Target 95%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Healthy Yield
              </div>
            )}
          </div>
        </div>

        {/* Top Line */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Top Line Performance</p>
          <h3 className="text-lg font-black text-gray-900 truncate">{mockData.metrics.topLine.name}</h3>
          <p className="text-sm font-bold text-blue-600 mt-1">{mockData.metrics.topLine.output.toLocaleString()} pcs processed</p>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform"><Target className="w-12 h-12 text-indigo-600" /></div>
        </div>

        {/* Top Staff */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Productivity Star</p>
          <h3 className="text-lg font-black text-gray-900">{mockData.metrics.topStaff.name}</h3>
          <p className="text-sm font-bold text-orange-600 mt-1">{mockData.metrics.topStaff.count} inspections done</p>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:-rotate-12 transition-transform"><Users className="w-12 h-12 text-orange-600" /></div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MỤC 3. HIỆU SUẤT DÂY CHUYỀN (Chart) */}
      {/* ========================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col h-[400px]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" /> Line Performance Comparison
            </h2>
            <p className="text-xs text-gray-500 mt-1">Passed/Failed output breakdown by production line (Includes Unassigned)</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold uppercase">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#22c55e]"></span> Passed</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ef4444]"></span> Failed</div>
          </div>
        </div>

        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData.linePerformance} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="lineName" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="passed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={40} />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================== */}
      {/* MỤC 4. XẾP HẠNG & PHÂN TÍCH LỖI */}
      {/* ========================================== */}
      <div className="grid grid-cols-2 gap-6 h-[500px]">

        {/* Staff Leaderboard (Cột Trái) */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <Users className="w-5 h-5 text-blue-600" /> Staff Leaderboard
            </h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search name..." className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-40" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-500 font-black sticky top-0 z-10 border-b">
                <tr>
                  <th className="p-4">Staff Name</th>
                  <th className="p-4">Position</th>
                  <th className="p-4 text-center">Units Processed</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {mockData.staffLeaderboard.map((staff, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        {staff.employeeName.charAt(0)}
                      </div>
                      <span className="font-bold text-gray-800">{staff.employeeName}</span>
                    </td>
                    <td className="p-4 text-gray-500 font-medium italic">{staff.role}</td>
                    <td className="p-4 text-center font-black text-gray-900">
                      {staff.processedCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Defect Breakdown (Cột Phải) */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle className="w-5 h-5 text-red-500" /> Defect Reason Breakdown
            </h2>
          </div>

          <div className="flex-1 flex items-center p-6">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockData.defectBreakdown}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {mockData.defectBreakdown.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Stats Table */}
            <div className="w-1/2 space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Defect Sources (80/20)</h4>
              <div className="space-y-2">
                {mockData.defectBreakdown.map((item, idx) => {
                  const percentage = ((item.value / mockData.defectBreakdown.reduce((s, c) => s + c.value, 0)) * 100).toFixed(1);
                  return (
                    <div key={idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span className="text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors">{item.name}</span>
                      </div>
                      <span className="text-xs font-black text-gray-400">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400 font-medium">
                <Info className="w-3.5 h-3.5" /> Data grouped by failure count
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};