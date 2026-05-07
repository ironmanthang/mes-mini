import {
   Search, Filter, Download, FileText, AlertTriangle,
   Box, Package, ArrowUpDown, ChevronLeft, ChevronRight
} from "lucide-react";
import { useState, useMemo, useEffect, type JSX } from "react";

type TabType = 'COMPONENT' | 'PRODUCT';

interface InventoryItem {
   id: number;
   code: string;
   name: string;
   unit: string;
   onHand: number;
   reserved: number;
   available: number;
   minStockLevel: number;
   isLowStock: boolean;
   standardCost?: number;
}

const mockComponentWarehouses = [
   { id: 1, name: "Kho Linh Kiện Chính (WH-COMP-01)" },
   { id: 2, name: "Kho Phụ Liệu (WH-SUB-02)" }
];

const mockProductWarehouses = [
   { id: 3, name: "Kho Thành Phẩm (WH-FG-01)" },
   { id: 4, name: "Khu Cách Ly Phế Phẩm (WH-DEFECT)" }
];

// Tạo mock data linh kiện (Có tính cost)
const mockComponents: InventoryItem[] = Array.from({ length: 45 }, (_, i) => {
   const onHand = Math.floor(Math.random() * 5000);
   const reserved = Math.floor(Math.random() * (onHand || 1));
   const available = onHand - reserved;
   const minStockLevel = 500;
   return {
      id: 1000 + i,
      code: `COMP-${(i + 1).toString().padStart(3, '0')}`,
      name: `Linh kiện lắp ráp loại ${String.fromCharCode(65 + (i % 26))}`,
      unit: i % 3 === 0 ? "Bộ" : "Cái",
      onHand, reserved, available, minStockLevel,
      isLowStock: available <= minStockLevel && available > 0,
      standardCost: (Math.floor(Math.random() * 50) + 10) * 1000
   };
});
// Thêm case đặc biệt: Hết hàng
mockComponents[0] = { ...mockComponents[0], onHand: 100, reserved: 100, available: 0, isLowStock: false };

// Tạo mock data thành phẩm (Không có standardCost lúc tồn)
const mockProducts: InventoryItem[] = Array.from({ length: 25 }, (_, i) => {
   const onHand = Math.floor(Math.random() * 1000);
   const reserved = Math.floor(Math.random() * (onHand || 1));
   const available = onHand - reserved;
   const minStockLevel = 100;
   return {
      id: 5000 + i,
      code: `PROD-${(i + 1).toString().padStart(3, '0')}`,
      name: i % 2 === 0 ? `Smart Watch V${(i % 5) + 1}` : `Bluetooth Earbuds Pro ${i}`,
      unit: "Hộp",
      onHand, reserved, available, minStockLevel,
      isLowStock: available <= minStockLevel && available > 0
   };
});

export const InventoryReport = (): JSX.Element => {
   // --- STATE QUẢN LÝ VIEW & FILTERS ---
   const [activeTab, setActiveTab] = useState<TabType>('COMPONENT');
   const [warehouseId, setWarehouseId] = useState<string>("ALL");
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

   // --- STATE BẢNG DỮ LIỆU ---
   const [sortConfig, setSortConfig] = useState<{ key: keyof InventoryItem, direction: 'asc' | 'desc' } | null>(null);
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 30;

   // Reset page & warehouse when tab changes
   useEffect(() => {
      setCurrentPage(1);
      setWarehouseId("ALL");
      setSearchQuery("");
   }, [activeTab]);

   // --- LOGIC: FETCH & FILTER DATA ---
   const rawData = activeTab === 'COMPONENT' ? mockComponents : mockProducts;

   const filteredData = useMemo(() => {
      return rawData.filter(item => {
         const matchSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase());

         let matchStatus = true;
         if (statusFilter === 'LOW_STOCK') matchStatus = item.available > 0 && item.available <= item.minStockLevel;
         if (statusFilter === 'OUT_OF_STOCK') matchStatus = item.available === 0;

         return matchSearch && matchStatus;
      });
   }, [rawData, searchQuery, statusFilter]);

   // --- LOGIC: SORTING ---
   const sortedData = useMemo(() => {
      const sortableItems = [...filteredData];
      if (sortConfig !== null) {
         sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key] ?? "";
            const bValue = b[sortConfig.key] ?? "";
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
         });
      }
      return sortableItems;
   }, [filteredData, sortConfig]);

   // --- LOGIC: PAGINATION ---
   const totalPages = Math.ceil(sortedData.length / itemsPerPage);
   const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   const requestSort = (key: keyof InventoryItem) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
         direction = 'desc';
      }
      setSortConfig({ key, direction });
   };


   // --- ACTIONS: EXPORT ---
   const handleExportExcel = () => {
      alert("Hệ thống (FE) đang trích xuất dữ liệu thành file Excel .xlsx...");
   };

   const handleExportPDF = () => {
      alert("Gọi API GET /inventory/summary/export-pdf... Đang tải file PDF có chữ ký...");
   };

   return (
      <div className="flex flex-col gap-5 h-[calc(100vh-100px)] animate-in fade-in duration-300">

         {/* ========================================== */}
         {/* MỤC 1: BỘ LỌC & CÔNG CỤ XUẤT BÁO CÁO (TOOLBAR) */}
         {/* ========================================== */}
         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">

            {/* Bộ lọc Dữ liệu */}
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Box className="w-4 h-4 text-gray-500" />
                  <select
                     value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                     className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer w-48"
                  >
                     <option value="ALL">All {activeTab === 'COMPONENT' ? 'component' : 'product'} warehouses</option>
                     {(activeTab === 'COMPONENT' ? mockComponentWarehouses : mockProductWarehouses).map(wh => (
                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                     ))}
                  </select>
               </div>

               <div className="relative w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                     type="text" placeholder="Search by Code or Name..."
                     value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>

               <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                     value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                     className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer"
                  >
                     <option value="ALL">All status</option>
                     <option value="LOW_STOCK">Low Stock Alert</option>
                     <option value="OUT_OF_STOCK">Out of Stock (Available = 0)</option>
                  </select>
               </div>
            </div>

            {/* Công cụ Export */}
            <div className="flex items-center gap-3">
               <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 font-bold rounded-lg text-sm hover:bg-green-100 transition-colors cursor-pointer shadow-sm">
                  <Download className="w-4 h-4" /> Export Excel
               </button>
               <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 font-bold rounded-lg text-sm hover:bg-red-100 transition-colors cursor-pointer shadow-sm">
                  <FileText className="w-4 h-4" /> Export PDF
               </button>
            </div>
         </div>



         {/* ========================================== */}
         {/* MỤC 3: BẢNG DỮ LIỆU TỔNG HỢP (DATA GRID) */}
         {/* ========================================== */}
         <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

            {/* 3.1 & 3.2: Tabs Navigation */}
            <div className="flex border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
               <button
                  onClick={() => setActiveTab('COMPONENT')}
                  className={`flex-1 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'COMPONENT' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
               >
                  <Box className="w-4 h-4" /> Component Inventory Report
               </button>
               <button
                  onClick={() => setActiveTab('PRODUCT')}
                  className={`flex-1 py-4 text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${activeTab === 'PRODUCT' ? 'bg-white text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
               >
                  <Package className="w-4 h-4" /> Finished Goods Inventory Report
               </button>
            </div>

            {/* 3.3: Interactive Data Grid */}
            <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-100 text-[11px] uppercase text-gray-600 font-black sticky top-0 z-10 shadow-sm">
                     <tr>
                        <th className="p-4 w-12 text-center">No.</th>
                        <th className="p-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('code')}>
                           <div className="flex items-center gap-2">{activeTab === 'COMPONENT' ? 'Component' : 'Product'} Code <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                        </th>
                        <th className="p-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('name')}>
                           <div className="flex items-center gap-2">Item Name <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                        </th>
                        <th className="p-4 text-center">Unit</th>
                        <th className="p-4 text-right cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('onHand')}>
                           <div className="flex items-center justify-end gap-2">Physical Stock <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                        </th>
                        <th className="p-4 text-right text-orange-700">Reserved</th>
                        <th className="p-4 text-right cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('available')}>
                           <div className="flex items-center justify-end gap-2 text-blue-800">Available <ArrowUpDown className="w-3 h-3 text-gray-400" /></div>
                        </th>
                        <th className="p-4 text-center">Alerts</th>
                     </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                     {paginatedData.map((item, index) => {
                        // Conditional Formatting logic
                        const isOutOfStock = item.available === 0;
                        const isLow = item.available <= item.minStockLevel && item.available > 0;

                        return (
                           <tr key={item.id} className={`hover:bg-blue-50/30 transition-colors ${isOutOfStock ? 'bg-gray-50/50 opacity-60 grayscale' : ''}`}>
                              <td className="p-4 text-center text-gray-400 font-mono">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="p-4 font-mono font-black text-gray-900">{item.code}</td>
                              <td className="p-4 font-bold text-gray-800 truncate max-w-[250px]">{item.name}</td>
                              <td className="p-4 text-center text-gray-500 font-medium">{item.unit}</td>
                              <td className="p-4 text-right font-black text-gray-700">{item.onHand.toLocaleString()}</td>
                              <td className="p-4 text-right font-bold text-orange-600">{item.reserved.toLocaleString()}</td>
                              <td className={`p-4 text-right font-black text-lg ${isOutOfStock ? 'text-gray-400' : isLow ? 'text-red-600' : 'text-blue-700'}`}>
                                 {item.available.toLocaleString()}
                              </td>
                              <td className="p-4 text-center">
                                 {isOutOfStock ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 text-gray-600 uppercase">Out of Stock</span>
                                 ) : isLow ? (
                                    <span title={`Below safety limit (${item.minStockLevel})`}>
                                       <AlertTriangle className="w-5 h-5 text-red-500 mx-auto animate-pulse" />
                                    </span>
                                 ) : null}
                              </td>
                           </tr>
                        )
                     })}
                     {paginatedData.length === 0 && (
                        <tr><td colSpan={8} className="p-16 text-center text-gray-500 font-medium text-lg">No data found matching current filters.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>

            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center flex-shrink-0">
               <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Showing <span className="text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * itemsPerPage, sortedData.length)}</span> of <span className="text-gray-900">{sortedData.length}</span> entries
               </p>
               <div className="flex items-center gap-2">
                  <button
                     onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                     className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                  ><ChevronLeft className="w-4 h-4" /></button>
                  <div className="text-xs font-bold text-gray-700">Page {currentPage} / {totalPages || 1}</div>
                  <button
                     onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
                     className="p-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                  ><ChevronRight className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

      </div>
   );
};