import { X, Save, ArrowRight } from "lucide-react";
import { useState, } from "react";

const purchaseOrders = ["PO-001 (Bosch)", "PO-002 (Samsung)", "PO-003 (Intel)"];
const productionBatches = [
  { id: "PB-2024-001", product: "Laptop Dell XPS 15", total: 100, imported: 45 },
  { id: "PB-2024-002", product: "Mechanical Keyboard", total: 200, imported: 0 },
];
const workOrders = ["WO-2025-001", "WO-2025-002"];

export const ImportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [importType, setImportType] = useState<"COMPONENT" | "PRODUCT">("PRODUCT");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [qualityStatus, setQualityStatus] = useState("PASS");

  const selectedBatch = productionBatches.find(b => b.id === selectedBatchId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[800px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">NEW IMPORT TRANSACTION</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-8 overflow-y-auto">
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex justify-center gap-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" name="type" 
                checked={importType === "COMPONENT"} 
                onChange={() => setImportType("COMPONENT")}
                className="w-5 h-5 text-blue-600" 
              />
              <span className="font-bold text-gray-700">Component Import (Linh kiện)</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="radio" name="type" 
                checked={importType === "PRODUCT"} 
                onChange={() => setImportType("PRODUCT")}
                className="w-5 h-5 text-blue-600" 
              />
              <span className="font-bold text-gray-700">Product Import (Thành phẩm)</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">1. Transaction Info</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Type</label>
                <input type="text" value="IMPORT" disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Reference ({importType === "COMPONENT" ? "Purchase Order" : "Production Batch"})
                </label>
                <select 
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                >
                  <option value="">-- Select Reference --</option>
                  {importType === "COMPONENT" 
                    ? purchaseOrders.map(po => <option key={po}>{po}</option>)
                    : productionBatches.map(pb => <option key={pb.id} value={pb.id}>{pb.id}</option>)
                  }
                </select>
              </div>

              {importType === "PRODUCT" && selectedBatch && (
                <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm space-y-1">
                  <div className="font-bold text-gray-800 border-b border-gray-200 pb-1 mb-1">Batch Information (Read-only)</div>
                  <div className="flex justify-between"><span>Code:</span> <span className="font-medium">{selectedBatch.id}</span></div>
                  <div className="flex justify-between"><span>Product:</span> <span className="font-medium">{selectedBatch.product}</span></div>
                  <div className="flex justify-between"><span>Total:</span> <span className="font-medium">{selectedBatch.total}</span></div>
                  <div className="flex justify-between"><span>Imported:</span> <span className="font-medium">{selectedBatch.imported}</span></div>
                  <div className="flex justify-between text-blue-600 font-bold"><span>Remaining:</span> <span>{selectedBatch.total - selectedBatch.imported}</span></div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">2. Import Details</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Warehouse</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  {importType === "COMPONENT" ? (
                    <option value="Central Component Storage">Central Component Storage</option>
                  ) : (
                    <>
                      <option value="Finished Goods Hub">Finished Goods Hub (Sales)</option>
                      <option value="Defect Quarantine">Defect Quarantine (Error/Fail)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {importType === "COMPONENT" ? "Component" : "Product"}
                </label>
                <input 
                  type="text" 
                  placeholder={importType === "COMPONENT" ? "Select Component..." : "Auto-fill from Batch..."}
                  defaultValue={importType === "PRODUCT" && selectedBatch ? selectedBatch.product : ""}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50"
                  readOnly={importType === "PRODUCT"}
                />
              </div>

               {importType === "PRODUCT" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quality Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="qc" checked={qualityStatus === "PASS"} onChange={() => setQualityStatus("PASS")} className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-bold">PASS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="qc" checked={qualityStatus === "FAIL"} onChange={() => setQualityStatus("FAIL")} className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-700 font-bold">FAIL</span>
                    </label>
                  </div>
                  {qualityStatus === "FAIL" && (
                    <input type="text" placeholder="Reason for failure..." className="w-full p-2 border border-red-200 rounded text-sm focus:ring-red-500 outline-none" />
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                {importType === "COMPONENT" && (
                  <div className="space-y-2 flex-1">
                    <label className="text-sm font-medium text-gray-700">Unit Cost</label>
                    <input type="number" placeholder="Auto from PO" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50" readOnly />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <input type="text" placeholder={importType === "COMPONENT" ? "Ex: Import from PO-001" : "Ex: Import from Batch PB-2024-001"} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 shadow-sm">
            <Save className="w-4 h-4" /> Confirm Import
          </button>
        </div>
      </div>
    </div>
  );
};

export const ExportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[600px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">NEW EXPORT TRANSACTION</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <input type="text" value="EXPORT" disabled className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-orange-600" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Reference (Work Order)</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"><option>-- Select WO --</option>{workOrders.map(wo => <option key={wo}>{wo}</option>)}</select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Source Warehouse</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"><option>Central Component Storage</option></select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Component</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"><option>Select Component...</option></select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="space-y-2 flex items-end pb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Generate Barcode</span>
                    </label>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <input type="text" placeholder="Ex: Export for WO-001" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
            </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg">Cancel</button>
          <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-500 shadow-sm">
            <Save className="w-4 h-4" /> Confirm Export
          </button>
        </div>
      </div>
    </div>
  );
};


export const TransferModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[600px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">NEW TRANSFER TRANSACTION</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-center mb-4">
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm font-bold text-gray-700">From Warehouse</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">To Warehouse</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">From</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"><option>Central Storage</option></select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">To</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"><option>Finished Goods Hub</option></select>
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Component / Product</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"><option>Select Item...</option></select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Quantity</label>
                <input type="number" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
            </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg">Cancel</button>
          <button onClick={onClose} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 shadow-sm">
            <Save className="w-4 h-4" /> Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};