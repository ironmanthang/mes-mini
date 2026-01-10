import { 
  Printer, 
  Download, 
  Search, 
  Filter, 
  ScanBarcode, 
  CheckSquare, 
  Square,
  BoxSelect
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";

const batches = [
  { id: "BATCH-2025-001", name: "Gaming Laptop X1 - Lot A" },
  { id: "BATCH-2025-002", name: "Mechanical Keyboard - Lot B" },
  { id: "BATCH-2025-003", name: "Smart Watch V2 - Lot C" },
];

const productTypes = ["Electronics", "Accessories", "Wearables"];

const initialItems = [
  { id: 1, serial: "SN-2025001-001", productId: "PROD-001", productName: "Gaming Laptop X1", type: "Electronics", batchId: "BATCH-2025-001", date: "2025-12-10" },
  { id: 2, serial: "SN-2025001-002", productId: "PROD-001", productName: "Gaming Laptop X1", type: "Electronics", batchId: "BATCH-2025-001", date: "2025-12-10" },
  { id: 3, serial: "SN-2025001-003", productId: "PROD-001", productName: "Gaming Laptop X1", type: "Electronics", batchId: "BATCH-2025-001", date: "2025-12-10" },
  { id: 4, serial: "SN-2025002-001", productId: "PROD-002", productName: "Mechanical Keyboard", type: "Accessories", batchId: "BATCH-2025-002", date: "2025-12-11" },
  { id: 5, serial: "SN-2025002-002", productId: "PROD-002", productName: "Mechanical Keyboard", type: "Accessories", batchId: "BATCH-2025-002", date: "2025-12-11" },
  { id: 6, serial: "SN-2025003-001", productId: "PROD-004", productName: "Smart Watch V2", type: "Wearables", batchId: "BATCH-2025-003", date: "2025-12-12" },
];

export const Barcodes = (): JSX.Element => {
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  const [filterBatch, setFilterBatch] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchBatch = filterBatch === "All" || item.batchId === filterBatch;
      const matchType = filterType === "All" || item.type === filterType;
      const matchSearch = 
        item.serial.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchBatch && matchType && matchSearch;
    });
  }, [items, filterBatch, filterType, searchQuery]);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i.id));
    }
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) return alert("Please select items to print.");
    alert(`Sending ${selectedIds.length} labels to printer...`);
  };

  const handlePrintBatch = () => {
    if (filterBatch === "All") return alert("Please select a specific Batch first.");
    alert(`Printing all items in batch ${filterBatch}...`);
  };

  const handleExport = () => {
    alert("Exporting barcode list to CSV/PDF...");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
      
      <div className="w-full lg:w-1/4 space-y-6">
        
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                <Filter className="w-4 h-4 text-blue-600" />
                Filter Options
            </h3>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Serial Number or Product Name..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Production Batch</label>
                <select 
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                    <option value="All">All Batches</option>
                    {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Type</label>
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                    <option value="All">All Types</option>
                    {productTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                    ))}
                </select>
            </div>

            <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Visible Items:</span>
                    <span className="font-bold text-gray-900">{filteredItems.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Selected:</span>
                    <span className="font-bold text-blue-600">{selectedIds.length}</span>
                </div>
            </div>
        </div>

        <div className="bg-blue-50 p-5 rounded-lg border border-blue-100 space-y-3">
            <h3 className="font-bold text-blue-900 text-sm mb-2">Printing Actions</h3>
            
            <button 
                onClick={handlePrintSelected}
                disabled={selectedIds.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 font-medium rounded hover:bg-blue-100 transition-colors shadow-sm text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
                <Printer className="w-4 h-4" /> Print Selected ({selectedIds.length})
            </button>

            <button 
                onClick={handlePrintBatch}
                className="w-full flex items-center justify-center gap-2 
                px-4 py-2.5 bg-blue-600 text-white font-medium rounded hover:bg-blue-500 
                transition-colors shadow-md text-sm cursor-pointer"
            >
                <BoxSelect className="w-4 h-4" /> Print Entire Batch
            </button>

            <button 
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 
                py-2.5 bg-white border border-gray-300 text-gray-700 
                font-medium rounded hover:bg-gray-50 transition-colors text-sm cursor-pointer"
            >
                <Download className="w-4 h-4" /> Export List
            </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                    {selectedIds.length > 0 && selectedIds.length === filteredItems.length ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                    )}
                    Select All Visible
                </button>
            </div>
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Preview Mode</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map(item => {
                        const isSelected = selectedIds.includes(item.id);
                        return (
                            <div 
                                key={item.id}
                                onClick={() => toggleSelect(item.id)}
                                className={`
                                    relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
                                    ${isSelected ? "border-blue-500 bg-blue-50/30" : "border-gray-200 bg-white hover:border-blue-200"}
                                `}
                            >
                                <div className="absolute top-3 right-3">
                                    {isSelected ? (
                                        <CheckSquare className="w-5 h-5 text-blue-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-gray-300" />
                                    )}
                                </div>

                                <div className="pr-6">
                                    <h4 className="font-bold text-gray-900 text-sm truncate">{item.productName}</h4>
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 mb-2">
                                        {item.type}
                                    </span>
                                    
                                    <div className="h-12 w-full bg-gray-100 my-2 flex items-center justify-center overflow-hidden rounded border border-gray-300">
                                        <div className="w-[90%] h-[70%] flex gap-[2px] justify-center opacity-70">
                                             {[...Array(40)].map((_, i) => (
                                                 <div key={i} className="bg-black h-full" style={{width: Math.random() > 0.5 ? '2px' : '4px'}}></div>
                                             ))}
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] text-gray-400 uppercase">Serial No.</span>
                                            <span className="font-mono font-bold text-sm text-gray-800">{item.serial}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
                                            <div className="text-[10px] text-gray-500">
                                                ID: <span className="font-medium">{item.productId}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                Batch: <span className="font-medium">{item.batchId.split('-')[1]}-{item.batchId.split('-')[2]}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 text-right">
                                            Date: {item.date}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                    <ScanBarcode className="w-16 h-16 mb-4" />
                    <p className="text-lg font-medium">No items found matching filter</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};