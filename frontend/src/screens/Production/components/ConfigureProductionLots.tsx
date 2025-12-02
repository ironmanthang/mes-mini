import { 
  Settings, 
  Zap, 
  CheckSquare, 
  Info,
  QrCode
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";

const workOrders = [
  { 
    id: "WO-2025-001", 
    productName: "Gaming Laptop X1", 
    category: "Electronics", 
    quantity: 50, 
    status: "Approved",
    description: "High performance batch for Q4"
  },
  { 
    id: "WO-2025-002", 
    productName: "Organic Energy Bar", 
    category: "Food & Beverage", 
    quantity: 1000, 
    status: "Approved",
    description: "Export quality batch"
  },
  { 
    id: "WO-2025-003", 
    productName: "Mechanical Keyboard", 
    category: "Accessories", 
    quantity: 200, 
    status: "Pending",
    description: "Switch Blue Clicky"
  },
];

const productionLines = [
  { id: "LINE-A1", name: "Assembly Line Alpha" },
  { id: "LINE-B2", name: "Assembly Line Beta" },
  { id: "LINE-C3", name: "Packaging Line" },
];

export const ConfigureProductionLots = (): JSX.Element => {
  const [selectedWOId, setSelectedWOId] = useState("");
  const [selectedWO, setSelectedWO] = useState<any>(null);
  
  const [batchCode, setBatchCode] = useState("");
  const [productionDate, setProductionDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedLine, setSelectedLine] = useState("");

  useEffect(() => {
    const wo = workOrders.find(w => w.id === selectedWOId);
    setSelectedWO(wo || null);

    if (wo) {
      const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
      setBatchCode(`${wo.id}-${dateStr}`);
      
      calculateExpiry(wo.category, productionDate);
    } else {
      setBatchCode("");
      setExpiryDate("");
    }
  }, [selectedWOId]);

  useEffect(() => {
    if (selectedWO) {
      calculateExpiry(selectedWO.category, productionDate);
    }
  }, [productionDate]);

  const calculateExpiry = (category: string, prodDate: string) => {
    const date = new Date(prodDate);
    
    if (category === "Food & Beverage") {
      date.setMonth(date.getMonth() + 6);
    } else if (category === "Electronics") {
      date.setFullYear(date.getFullYear() + 2);
    } else {
      date.setFullYear(date.getFullYear() + 1);
    }
    
    setExpiryDate(date.toISOString().split('T')[0]);
  };

  const handleGenerateInstances = () => {
    if (!selectedWO || !selectedLine) return alert("Please select Work Order and Production Line");
    alert(`Generated ${selectedWO.quantity} product instances for Batch ${batchCode}`);
  };

  const handleAssignChecklist = () => {
    if (!selectedWO) return alert("Please select Work Order");
    alert(`Quality Checklist assigned to ${batchCode}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Configure Production Lots
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                Setup batch details and assign production lines before starting.
                </p>
            </div>
            <div className="w-[300px]">
                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Select Work Order</label>
                <select 
                    value={selectedWOId}
                    onChange={(e) => setSelectedWOId(e.target.value)}
                    className="w-full p-2 border border-blue-200 rounded-lg 
                    focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-blue-50 
                    font-medium text-blue-900 cursor-pointer"
                >
                    <option value="">-- Choose Work Order --</option>
                    {workOrders.map(wo => (
                        <option key={wo.id} value={wo.id}>{wo.id} - {wo.productName}</option>
                    ))}
                </select>
            </div>
        </div>

        {selectedWO ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                
                <div className="space-y-4 border-r border-gray-100 pr-8">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Info className="w-4 h-4 text-gray-500" /> Work Order Info
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Product Name</label>
                            <div className="text-sm font-medium text-gray-900">{selectedWO.productName}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Category</label>
                            <div className="text-sm font-medium text-gray-900">{selectedWO.category}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Total Quantity</label>
                            <div className="text-sm font-bold text-blue-600">{selectedWO.quantity} units</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Current Status</label>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {selectedWO.status}
                            </span>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-xs text-gray-500">Description</label>
                            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{selectedWO.description}</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
                        <QrCode className="w-4 h-4 text-gray-500" /> Batch Configuration
                    </h4>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Batch Code (Auto)</label>
                            <div className="flex items-center">
                                <input 
                                    type="text" 
                                    value={batchCode}
                                    readOnly
                                    className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 font-mono cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Production Date</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={productionDate}
                                        onChange={(e) => setProductionDate(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 
                                        rounded-lg text-sm focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Expiry Date (Auto)</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={expiryDate}
                                        readOnly
                                        className="w-full p-2.5 bg-yellow-50 border border-yellow-200 
                                        rounded-lg text-sm text-yellow-700 font-medium 
                                        cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Production Line<span className="text-red-500">*</span></label>
                            <select 
                                value={selectedLine}
                                onChange={(e) => setSelectedLine(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm 
                                focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                            >
                                <option value="">-- Select Line --</option>
                                {productionLines.map(line => (
                                    <option key={line.id} value={line.id}>{line.name} ({line.id})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Settings className="w-12 h-12 mb-3 opacity-20" />
                <p>Select a Work Order above to start configuration.</p>
            </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 ml-[200px]">
        <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
          <button
            onClick={handleAssignChecklist}
            disabled={!selectedWO}
            className="flex items-center gap-2 px-6 py-2.5 
            bg-white border border-gray-300 text-gray-700 font-medium 
            rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer
            disabled:cursor-not-allowed"
          >
            <CheckSquare className="w-4 h-4" />
            Assign Quality Checklist
          </button>
          
          <button
            onClick={handleGenerateInstances}
            disabled={!selectedWO}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2EE59D] text-white font-medium 
            rounded-lg hover:bg-[#25D390] transition-colors shadow-sm disabled:opacity-50 cursor-pointer
            disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            Generate Product Instances
          </button>
        </div>
      </div>
    </div>
  );
};