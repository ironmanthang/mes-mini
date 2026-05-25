import {
   Search, Filter, AlertTriangle,
   Box, Package, ArrowUpDown, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import { useState, useMemo, useEffect, type JSX } from "react";
import { WarehouseServices, type Warehouse } from "../../../services/warehouseServices";
import { InventoryServices, type InventoryStatusItem } from "../../../services/inventoryServices";
import { ProductInstanceServices, type ProductInstanceListItem } from "../../../services/productInstanceServices";
import { ProductServices, type Product } from "../../../services/productServices";

type TabType = 'COMPONENT' | 'PRODUCT';

interface DisplayInventoryItem {
   id: number;
   code: string;
   name: string;
   unit: string;
   onHand: number;
   reserved: number;
   available: number;
   minStockLevel: number;
   isLowStock: boolean;
}

export const InventoryReport = (): JSX.Element => {
   // --- VIEW & FILTERS STATE MANAGEMENT ---
   const [activeTab, setActiveTab] = useState<TabType>('COMPONENT');
   const [warehouseId, setWarehouseId] = useState<string>("ALL");
   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

   // --- REAL DATA STATE ---
   const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
   const [componentsStock, setComponentsStock] = useState<InventoryStatusItem[]>([]);
   const [productInstances, setProductInstances] = useState<ProductInstanceListItem[]>([]);
   const [productsList, setProductsList] = useState<Product[]>([]);
   const [isLoading, setIsLoading] = useState<boolean>(false);

   // --- DATA TABLE STATE ---
   const [sortConfig, setSortConfig] = useState<{ key: keyof DisplayInventoryItem, direction: 'asc' | 'desc' } | null>(null);
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 15;

   // Reset page & search when tab changes
   useEffect(() => {
      setCurrentPage(1);
      setSearchQuery("");
   }, [activeTab]);

   // --- FETCH WAREHOUSES ON START ---
   useEffect(() => {
      const fetchWarehouses = async () => {
         try {
            const response = await WarehouseServices.getAllWarehouse();
            const data = Array.isArray(response) ? response : (response as any).data || [];
            setWarehouses(data);
         } catch (err) {
            console.error("Failed to load warehouses list:", err);
         }
      };
      fetchWarehouses();
   }, []);

   // --- FETCH REPORT DATA BASED ON TAB & FILTERS ---
   const fetchInventoryData = async () => {
      setIsLoading(true);
      try {
         if (activeTab === 'COMPONENT') {
            const params: any = {
               page: 1,
               limit: 1000 // load all for client-side search/sort match
            };
            if (warehouseId !== "ALL") params.warehouseId = Number(warehouseId);
            
            const res = await InventoryServices.getConsolidatedInventory(params);
            setComponentsStock(res.data);
         } else {
            // Fetch product instances & products list
            const params: any = {
               page: 1,
               limit: 5000
            };
            if (warehouseId !== "ALL") params.warehouseId = Number(warehouseId);
            
            const [instancesRes, productsRes] = await Promise.all([
               ProductInstanceServices.getAllProductInstances(params),
               ProductServices.getAllProducts()
            ]);
            setProductInstances(instancesRes.data);
            const dataArray = Array.isArray(productsRes) ? productsRes : (productsRes as any).data || [];
            setProductsList(dataArray);
         }
      } catch (err) {
         console.error("Failed to fetch inventory reports:", err);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      fetchInventoryData();
   }, [activeTab, warehouseId]);

   // --- FORMAT REAL DATA TO TABLE ROWS ---
   const rawData = useMemo<DisplayInventoryItem[]>(() => {
      if (activeTab === 'COMPONENT') {
         return componentsStock.map(comp => ({
            id: comp.componentId,
            code: comp.code,
            name: comp.componentName,
            unit: comp.unit,
            onHand: comp.availableQuantity,
            reserved: 0, // reserved isn't tracked explicitly in simple warehouse schema
            available: comp.availableQuantity,
            minStockLevel: comp.minStockLevel,
            isLowStock: comp.status === 'LOW_STOCK'
         }));
      } else {
         const map = new Map<number, DisplayInventoryItem>();
         // Initialize all products in system
         for (const p of productsList) {
            map.set(p.productId, {
               id: p.productId,
               code: p.code,
               name: p.productName,
               unit: p.unit || "Box",
               onHand: 0,
               reserved: 0,
               available: 0,
               minStockLevel: 5, // default threshold limit
               isLowStock: false
            });
         }
         // Accumulate counts from matching product instances
         for (const inst of productInstances) {
            const entry = map.get(inst.product.productId);
            if (entry) {
               entry.onHand += 1;
               if (inst.status === 'IN_STOCK_SALES' || inst.status === 'PASSED_QC') {
                  entry.available += 1;
               }
            }
         }
         return Array.from(map.values()).map(item => ({
            ...item,
            isLowStock: item.available <= item.minStockLevel && item.available > 0
         }));
      }
   }, [activeTab, componentsStock, productInstances, productsList]);

   // --- FILTERING ---
   const filteredData = useMemo(() => {
      return rawData.filter(item => {
         const matchSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase());

         let matchStatus = true;
         if (statusFilter === 'LOW_STOCK') matchStatus = item.available <= item.minStockLevel;
         if (statusFilter === 'OUT_OF_STOCK') matchStatus = item.available === 0;

         return matchSearch && matchStatus;
      });
   }, [rawData, searchQuery, statusFilter]);

   // --- SORTING ---
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

   // --- PAGINATION ---
   const totalPages = Math.ceil(sortedData.length / itemsPerPage);
   const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

   const requestSort = (key: keyof DisplayInventoryItem) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
         direction = 'desc';
      }
      setSortConfig({ key, direction });
   };

   return (
      <div className="flex flex-col gap-5 h-[calc(100vh-100px)] animate-in fade-in duration-300">

         {/* ========================================== */}
         {/* MỤC 1: TOOLBAR & WAREHOUSE FILTER */}
         {/* ========================================== */}
         <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">

            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Box className="w-4 h-4 text-gray-500" />
                  <select
                     value={warehouseId} onChange={e => setWarehouseId(e.target.value)}
                     className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer w-48"
                  >
                     <option value="ALL">All warehouses</option>
                     {warehouses.map(wh => (
                        <option key={wh.warehouseId} value={wh.warehouseId}>
                           {wh.warehouseName} ({wh.code})
                        </option>
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
                     <option value="OUT_OF_STOCK">Out of Stock (Safety = 0)</option>
                  </select>
               </div>
            </div>

            <div className="flex items-center gap-3">
               {/* Export buttons removed as they were mock buttons */}
            </div>
         </div>

         {/* ========================================== */}
         {/* SECTION 2: DATAGRID TABLE */}
         {/* ========================================== */}
         <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">

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

            <div className="flex-1 overflow-y-auto relative">
               {isLoading ? (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                     <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  </div>
               ) : null}

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
                     {paginatedData.length === 0 && !isLoading && (
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