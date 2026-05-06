import { 
  Search, CheckCircle2, XCircle, ArrowRightCircle, 
  Loader2, Send, Box, AlertCircle, Trash2, Layers
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";

// --- INTERFACES ---
interface ProductInstance {
  id: number;
  serialNumber: string;
  productName: string;
  batchCode: string;
  status: 'PASSED' | 'FAILED';
}

// --- MOCK DATA (Giai đoạn 1 - Vùng đệm) ---
const mockInstances: ProductInstance[] = [
  { id: 101, serialNumber: "SN-2026-00101", productName: "Smart Watch V1", batchCode: "BATCH-WO-089", status: "PASSED" },
  { id: 102, serialNumber: "SN-2026-00102", productName: "Smart Watch V1", batchCode: "BATCH-WO-089", status: "PASSED" },
  { id: 103, serialNumber: "SN-2026-00103", productName: "Smart Watch V1", batchCode: "BATCH-WO-089", status: "FAILED" },
  { id: 104, serialNumber: "SN-2026-00104", productName: "Bluetooth Earbuds", batchCode: "BATCH-WO-090", status: "PASSED" },
  { id: 105, serialNumber: "SN-2026-00105", productName: "Bluetooth Earbuds", batchCode: "BATCH-WO-090", status: "FAILED" },
];

export const InboundRequests = (): JSX.Element => {
  // --- STATE ---
  const [instances, setInstances] = useState<ProductInstance[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  
  // Right Panel Form
  const [priority, setPriority] = useState("NORMAL");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize data
  useEffect(() => {
    // [FE]: Fetch list of products pending inbound
    setInstances(mockInstances);
  }, []);

  // --- BATCHING & CROSS-LOCK LOGIC ---
  // Determine the type of products being selected (PASSED or FAILED) to lock the rest
  const selectedType = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const firstSelected = instances.find(i => i.id === selectedIds[0]);
    return firstSelected?.status || null;
  }, [selectedIds, instances]);

  const handleToggleSelect = (item: ProductInstance) => {
    // Prevent click if selecting different type
    if (selectedType && item.status !== selectedType) return;

    setSelectedIds(prev => 
      prev.includes(item.id) 
        ? prev.filter(id => id !== item.id) 
        : [...prev, item.id]
    );
  };

  const handleSelectAll = (filteredData: ProductInstance[]) => {
    // Only Select All VALID items (same type as current selection or no selection)
    const validItems = filteredData.filter(item => !selectedType || item.status === selectedType);
    
    // If all validItems are selected -> Deselect all
    const isAllSelected = validItems.length > 0 && validItems.every(i => selectedIds.includes(i.id));
    
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      const newIds = new Set([...selectedIds, ...validItems.map(i => i.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleCancelSelection = () => {
    setSelectedIds([]);
    setPriority("NORMAL");
    setNote("");
  };

  // --- GIAI ĐOẠN 3 & 4: SUBMIT ---
  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    
    try {
      console.log("Submitting Payload:", {
        instanceIds: selectedIds,
        priority,
        note,
        targetWarehouse: selectedType === 'PASSED' ? 'SALES' : 'DEFECT'
      });
      
      // Simulate BE Transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Inbound request submitted successfully!");
      
      // [FE]: Remove submitted items from pending list and reset form
      setInstances(prev => prev.filter(i => !selectedIds.includes(i.id)));
      handleCancelSelection();
      
    } catch (error) {
      alert("System error while submitting request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LỌC DỮ LIỆU ---
  const filteredInstances = useMemo(() => {
    return instances.filter(item => {
      const matchSearch = item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTab = filterTab === 'ALL' || item.status === filterTab;
      return matchSearch && matchTab;
    });
  }, [instances, searchQuery, filterTab]);

  const selectedItemsData = instances.filter(i => selectedIds.includes(i.id));

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] animate-in fade-in duration-300">
      
      {/* ========================================== */}
      {/* CỘT TRÁI (70%): PENDING INBOUND LIST */}
      {/* ========================================== */}
      <div className="flex-[7] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" /> Pending Inbound List
          </h2>
          <p className="text-xs text-gray-500 mt-1">Group QC-passed products to create inbound requests.</p>
        </div>

        {/* Thanh công cụ: Search & Tabs */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search by Serial Number..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {(['ALL', 'PASSED', 'FAILED'] as const).map(tab => (
              <button 
                key={tab} onClick={() => setFilterTab(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${filterTab === tab ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab === 'ALL' ? 'All' : tab === 'PASSED' ? 'Passed' : 'Failed'}
              </button>
            ))}
          </div>
        </div>

        {/* Cảnh báo trạng thái đang chọn (Header Alert) */}
        {selectedType && (
          <div className={`px-5 py-2.5 flex items-center gap-2 text-sm font-bold border-b ${selectedType === 'PASSED' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            <AlertCircle className="w-4 h-4" />
            Selecting: {selectedIds.length} products of type [{selectedType}]. Other types are temporarily locked.
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 w-12 text-center">
                   <input 
                      type="checkbox" 
                      onChange={() => handleSelectAll(filteredInstances)}
                      checked={filteredInstances.filter(i => !selectedType || i.status === selectedType).length > 0 && 
                               filteredInstances.filter(i => !selectedType || i.status === selectedType).every(i => selectedIds.includes(i.id))}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                   />
                </th>
                <th className="p-4">Serial Number</th>
                <th className="p-4">Product Info</th>
                <th className="p-4">Batch Code</th>
                <th className="p-4 text-center">QC Result</th>
                <th className="p-4">Target Warehouse</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filteredInstances.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                const isDisabled = selectedType && item.status !== selectedType; // Logic Khóa chéo
                
                return (
                  <tr key={item.id} onClick={() => handleToggleSelect(item)} 
                      className={`transition-colors cursor-pointer 
                      ${isSelected ? 'bg-blue-50/50' : isDisabled ? 'bg-gray-50/50 opacity-50 grayscale cursor-not-allowed' : 'hover:bg-gray-50'}`}>
                    
                    <td className="p-4 text-center">
                       <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4 text-blue-600 rounded border-gray-300 cursor-pointer" />
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-900">{item.serialNumber}</td>
                    <td className="p-4 font-medium text-gray-700">{item.productName}</td>
                    <td className="p-4 font-mono text-gray-500 text-xs">{item.batchCode}</td>
                    <td className="p-4 text-center">
                        {item.status === 'PASSED' 
                          ? <span className="px-2 py-0.5 rounded text-[10px] font-black bg-green-100 text-green-700 uppercase">Pass</span>
                          : <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-100 text-red-700 uppercase">Fail</span>
                        }
                    </td>
                    <td className="p-4">
                        <span className="text-xs font-bold text-gray-400">
                           {item.status === 'PASSED' ? 'Sales Warehouse' : 'Defect Warehouse'}
                        </span>
                    </td>
                  </tr>
                )
              })}
              {filteredInstances.length === 0 && (
                <tr><td colSpan={6} className="p-16 text-center text-gray-400">No products pending inbound.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* CỘT PHẢI (30%): INBOUND REQUEST PANEL */}
      {/* ========================================== */}
      <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">Inbound Request Panel</h2>
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{selectedIds.length} Items</span>
        </div>

        {/* TRẠNG THÁI: CHƯA CHỌN HÀNG (EMPTY STATE) */}
        {selectedIds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200 shadow-inner">
                <Box className="w-10 h-10 text-gray-300" />
             </div>
             <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Please select at least 1 product from the list on the left to group and create an inbound request.
             </p>
          </div>
        ) : (
          /* STATUS: ACTIVE STATE */
          <div className="flex-1 overflow-y-auto flex flex-col animate-in fade-in">
             <div className="p-5 space-y-6 flex-1">
                
                {/* Section 1: Routing Info */}
                <div className="space-y-3">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Routing Information</h3>
                   <div className="p-4 rounded-xl border flex flex-col gap-3 bg-gray-50 border-gray-200">
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-500">Source:</span>
                         <span className="text-sm font-bold text-gray-900">Production Line 01</span>
                      </div>
                      <ArrowRightCircle className={`w-5 h-5 mx-auto ${selectedType === 'PASSED' ? 'text-green-400' : 'text-red-400'}`} />
                      <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-gray-500">Target Warehouse:</span>
                         <span className={`text-sm font-black uppercase ${selectedType === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedType === 'PASSED' ? 'WH-FG (Sales)' : 'WH-DEFECT (Error)'}
                         </span>
                      </div>
                   </div>
                </div>

                {/* Vùng 2: Batch Summary */}
                <div className="space-y-3">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex justify-between items-center">
                      Serial List 
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[10px]">Total: {selectedIds.length}</span>
                   </h3>
                   <div className="h-32 overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1">
                      {selectedItemsData.map(i => (
                         <div key={i.id} className="text-xs font-mono text-gray-600 bg-white p-1.5 rounded border border-gray-100 shadow-sm flex items-center gap-2">
                            {selectedType === 'PASSED' ? <CheckCircle2 className="w-3 h-3 text-green-500"/> : <XCircle className="w-3 h-3 text-red-500"/>}
                            {i.serialNumber}
                         </div>
                      ))}
                   </div>
                </div>

                {/* Vùng 3: Additional Info */}
                <div className="space-y-3">
                   <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider">Additional Information</h3>
                   <div className="space-y-4">
                      <div>
                         <label className="text-xs font-bold text-gray-700 block mb-1">Priority Level</label>
                         <select 
                            value={priority} onChange={e => setPriority(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                         >
                            <option value="NORMAL">Normal</option>
                            <option value="URGENT">Urgent</option>
                         </select>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-gray-700 block mb-1">Notes for Warehouse Keeper</label>
                         <textarea 
                            value={note} onChange={e => setNote(e.target.value)}
                            rows={3} placeholder="e.g., Export goods..."
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                         />
                      </div>
                   </div>
                </div>

             </div>

             {/* Vùng 4: Footer Actions */}
             <div className="p-5 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button 
                   onClick={handleCancelSelection}
                   disabled={isSubmitting}
                   className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm cursor-pointer flex-shrink-0"
                   title="Cancel Selection"
                >
                   <Trash2 className="w-4 h-4" />
                </button>
                <button 
                   onClick={handleSubmit}
                   disabled={isSubmitting}
                   className="flex-1 py-2.5 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-all active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
                >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                   Submit Request ({selectedIds.length})
                </button>
             </div>
          </div>
        )}
      </div>

    </div>
  );
};