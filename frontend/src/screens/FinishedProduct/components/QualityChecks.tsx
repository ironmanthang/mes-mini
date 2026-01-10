import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  Search, 
  AlertTriangle,
  PackageCheck,
  Save,
  Truck
} from "lucide-react";
import { useState, type JSX } from "react";


const pendingQCItems = [
  { id: 1, serial: "SN-2025001-001", name: "Gaming Laptop X1", batch: "BATCH-2025-001", status: "Pending" },
  { id: 2, serial: "SN-2025001-002", name: "Gaming Laptop X1", batch: "BATCH-2025-001", status: "Pending" },
  { id: 3, serial: "SN-2025002-055", name: "Mechanical Keyboard", batch: "BATCH-2025-002", status: "Pending" },
];

const qualityChecklist = [
  { id: "C1", criteria: "Visual Inspection (No scratches/dents)", critical: true },
  { id: "C2", criteria: "Power On Test (Boot successfully)", critical: true },
  { id: "C3", criteria: "Screen/Display Check (No dead pixels)", critical: true },
  { id: "C4", criteria: "Keyboard/Touchpad Responsiveness", critical: false },
  { id: "C5", criteria: "Connectivity (Wifi/Bluetooth/Ports)", critical: true },
  { id: "C6", criteria: "Packaging & Accessories Check", critical: false },
];

export const QualityChecks = (): JSX.Element => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [finalDecision, setFinalDecision] = useState<"PASS" | "FAIL" | null>(null);

  
  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setCheckedItems({});
    setNotes("");
    setFinalDecision(null);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((checkedCount / qualityChecklist.length) * 100);
  const allCriticalPassed = qualityChecklist
    .filter(c => c.critical)
    .every(c => checkedItems[c.id]);

  const handlePass = () => {
    if (!allCriticalPassed) {
      alert("Cannot Pass: Some critical checks are missing!");
      return;
    }
    if (window.confirm(`Confirm PASS for ${selectedItem.serial}?\nItem will be transferred to Sales Warehouse.`)) {
      alert(`Item ${selectedItem.serial} passed! Transferring to Finished Goods Warehouse...`);
      setSelectedItem(null);
    }
  };

  const handleFail = () => {
    if (!notes) {
      alert("Please provide a reason/note for failure.");
      return;
    }
    if (window.confirm(`Confirm FAIL for ${selectedItem.serial}?\nItem will be moved to Defect Quarantine.`)) {
      alert(`Item ${selectedItem.serial} marked as DEFECT. Moving to Quarantine Warehouse...`);
      setSelectedItem(null);
    }
  };

  const handleSaveDraft = () => {
    alert("Inspection progress saved as Draft.");
  };

  const filteredQueue = pendingQCItems.filter(item => 
    item.serial.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
      
      <div className="w-full lg:w-1/4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <ClipboardListIcon className="w-4 h-4 text-blue-600" />
            Pending Inspection
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Scan Serial or Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredQueue.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleSelectItem(item)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm group ${
                selectedItem?.id === item.id 
                ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" 
                : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs text-gray-900 group-hover:text-blue-700">{item.serial}</span>
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">QC Ready</span>
              </div>
              <p className="text-xs text-gray-600 truncate">{item.name}</p>
              <p className="text-[10px] text-gray-400 mt-1">Batch: {item.batch}</p>
            </div>
          ))}
          {filteredQueue.length === 0 && (
             <div className="text-center p-4 text-gray-400 text-sm">No items found.</div>
          )}
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        {selectedItem ? (
          <div className="flex flex-col h-full">
            
            <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg flex justify-between items-start">
               <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                     <PackageCheck className="w-6 h-6 text-blue-600" />
                     {selectedItem.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                     <span className="font-mono bg-white px-2 py-0.5 border rounded">{selectedItem.serial}</span>
                     <span>|</span>
                     <span>Batch: {selectedItem.batch}</span>
                  </div>
               </div>
               <div className="text-right">
                  <div className="text-sm font-medium text-gray-500 mb-1">Progress</div>
                  <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-blue-600'}`} style={{width: `${progress}%`}}></div>
                      </div>
                      <span className="text-xs font-bold">{progress}%</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                
                <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-gray-500" /> Inspection Checklist
                    </h3>
                    <div className="space-y-3">
                        {qualityChecklist.map((check) => (
                            <label 
                                key={check.id} 
                                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    checkedItems[check.id] 
                                    ? "bg-green-50 border-green-200" 
                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <input 
                                    type="checkbox" 
                                    checked={!!checkedItems[check.id]}
                                    onChange={() => toggleCheck(check.id)}
                                    className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                                />
                                <div>
                                    <div className="text-sm font-medium text-gray-900">
                                        {check.criteria}
                                        {check.critical && <span className="ml-2 text-[10px] text-red-500 font-bold uppercase border border-red-200 px-1 rounded">Critical</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {checkedItems[check.id] ? "Pass" : "Not checked"}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="w-full lg:w-[350px] p-6 bg-gray-50/50 flex flex-col gap-6">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Inspector Notes / Failure Reason</label>
                        <textarea 
                            rows={4}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter details here (required for Fail)..."
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white"
                        />
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase">Routing Preview</h4>
                        <div className="flex items-center gap-2 text-sm">
                            <Truck className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">If Pass:</span>
                            <span className="font-bold text-green-700 ml-auto">→ Sales Warehouse</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">If Fail:</span>
                            <span className="font-bold text-red-700 ml-auto">→ Defect Quarantine</span>
                        </div>
                    </div>

                    <div className="mt-auto space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={handleFail}
                                className="flex flex-col items-center justify-center p-4 
                                bg-white border border-red-200 text-red-600 rounded-xl 
                                hover:bg-red-50 hover:border-red-300 transition-all 
                                shadow-sm group cursor-pointer"
                             >
                                <XCircle className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">FAIL</span>
                                <span className="text-[10px] opacity-70">Move to Defect</span>
                             </button>

                             <button 
                                onClick={handlePass}
                                className="flex flex-col items-center justify-center 
                                p-4 bg-green-600 border border-green-600 text-white 
                                rounded-xl hover:bg-green-500 hover:border-green-500 
                                transition-all shadow-md group cursor-pointer"
                             >
                                <CheckCircle2 className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">PASS</span>
                                <span className="text-[10px] opacity-90">Move to Sales</span>
                             </button>
                        </div>

                        <button 
                            onClick={handleSaveDraft}
                            className="w-full flex items-center justify-center 
                            gap-2 py-2 text-gray-500 hover:text-gray-700 text-sm 
                            font-medium transition-colors cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> Save Progress (Draft)
                        </button>
                    </div>

                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
             <ClipboardCheck className="w-16 h-16 mb-4" />
             <p className="text-lg font-medium">Select an item to inspect</p>
             <p className="text-sm">Scan barcode or choose from pending list</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ClipboardListIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/><path d="M9 8h6"/></svg>
);