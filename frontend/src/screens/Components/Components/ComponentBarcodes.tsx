import { 
  ScanBarcode, 
  Search, 
  Printer, 
  Download, 
  Package, 
  ArrowRight, 
  FileText
} from "lucide-react";
import { useState, useMemo, type JSX } from "react";

const exportTransactions = [
  { 
    id: "TRX-EXP-001", 
    date: "2025-12-01", 
    warehouseId: "WH-001", 
    warehouseName: "Central Component Storage",
    componentId: "COMP-001",
    componentName: "CPU Chipset A1",
    quantity: 500,
    workOrderId: "WO-2025-001", // Batch Reference
    description: "Main processor for Laptop X1"
  },
  { 
    id: "TRX-EXP-002", 
    date: "2025-12-02", 
    warehouseId: "WH-001", 
    warehouseName: "Central Component Storage",
    componentId: "COMP-002",
    componentName: "Memory Module 8GB",
    quantity: 200,
    workOrderId: "WO-2025-002",
    description: "DDR4 SODIMM RAM"
  },
  { 
    id: "TRX-EXP-003", 
    date: "2025-12-03", 
    warehouseId: "WH-002", 
    warehouseName: "Defect Quarantine",
    componentId: "COMP-004",
    componentName: "Legacy Port Connector",
    quantity: 50,
    workOrderId: "WO-2025-005",
    description: "Discontinued parts return"
  },
];

export const ComponentBarcodes = (): JSX.Element => {
  const [selectedTrxId, setSelectedTrxId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const selectedTrx = useMemo(() => 
    exportTransactions.find(t => t.id === selectedTrxId), 
  [selectedTrxId]);

  const handleGenerateBarcode = () => {
    if (!selectedTrx) return;
    const code = `COMP_${selectedTrx.componentId}WH${selectedTrx.warehouseId}BATCH${selectedTrx.workOrderId}`;
    setGeneratedCode(code);
  };

  const handlePrint = () => {
    alert(`Printing label for: ${generatedCode}`);
  };

  const handleExport = () => {
    alert("Exporting barcode list to PDF/CSV...");
  };

  const filteredList = exportTransactions.filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.componentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-200px)] flex gap-6">
      
      <div className="w-1/3 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Select Export Transaction</h3>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search ID, Component..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredList.map((trx) => (
            <div 
              key={trx.id}
              onClick={() => {
                setSelectedTrxId(trx.id);
                setGeneratedCode("");
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                selectedTrxId === trx.id 
                ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" 
                : "bg-white border-gray-200 hover:border-blue-300"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-xs text-gray-500">{trx.id}</span>
                <span className="text-xs text-gray-400">{trx.date}</span>
              </div>
              <h4 className={`text-sm font-bold ${selectedTrxId === trx.id ? 'text-blue-700' : 'text-gray-800'}`}>
                {trx.componentName}
              </h4>
              <div className="flex justify-between items-center mt-2 text-xs">
                <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
                  Export
                </span>
                <span className="font-mono font-bold text-gray-600">Qty: {trx.quantity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        {selectedTrx ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ScanBarcode className="w-5 h-5 text-blue-600" />
                  Barcode Generator
                </h2>
                <p className="text-sm text-gray-500">Generate labels for tracking and inventory.</p>
              </div>
              <div className="flex gap-2">
                 {!generatedCode && (
                    <button 
                        onClick={handleGenerateBarcode}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
                    >
                        <ScanBarcode className="w-4 h-4" /> Generate Barcode
                    </button>
                 )}
                 {generatedCode && (
                   <>
                     <button onClick={handleExport} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
                       <Download className="w-4 h-4" /> Export List
                     </button>
                     <button onClick={handlePrint} className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium flex items-center gap-2 shadow-sm">
                       <Printer className="w-4 h-4" /> Print Label
                     </button>
                   </>
                 )}
              </div>
            </div>

            <div className="p-8 grid grid-cols-2 gap-8 overflow-y-auto">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Component Info
                    </h3>
                    <div className="grid grid-cols-1 gap-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div>
                            <label className="text-xs text-gray-500 block">Component Name</label>
                            <span className="text-sm font-bold text-gray-900">{selectedTrx.componentName}</span>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block">Component ID</label>
                            <span className="text-sm font-mono text-gray-700">{selectedTrx.componentId}</span>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block">Description</label>
                            <span className="text-sm text-gray-600">{selectedTrx.description}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Export Reference
                    </h3>
                    <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-500">Transaction ID</label>
                            <span className="text-sm font-mono font-bold text-gray-900">{selectedTrx.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-500">Export Date</label>
                            <span className="text-sm text-gray-900">{selectedTrx.date}</span>
                        </div>
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-500">Warehouse ID</label>
                            <span className="text-sm text-gray-900">{selectedTrx.warehouseId}</span>
                        </div>
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-500">Batch Ref (WO)</label>
                            <span className="text-sm font-bold text-blue-700">{selectedTrx.workOrderId}</span>
                        </div>
                    </div>
                </div>
                
                <div className="col-span-2 mt-4">
                     <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 flex items-center gap-2">
                        Preview
                     </h3>
                     
                     <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 min-h-[200px]">
                        {generatedCode ? (
                            <div className="bg-white p-6 shadow-md border border-gray-200 rounded text-center animate-in fade-in zoom-in duration-300">
                                <div className="flex items-end justify-center h-16 gap-1 mb-2 select-none">
                                    {[...Array(40)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="bg-black" 
                                            style={{
                                                width: Math.random() > 0.5 ? '4px' : '2px', 
                                                height: '100%'
                                            }} 
                                        />
                                    ))}
                                </div>
                                <div className="font-mono text-sm font-bold text-gray-800 tracking-wider break-all max-w-md">
                                    {generatedCode}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400">
                                <ScanBarcode className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Click "Generate Barcode" to create label</p>
                            </div>
                        )}
                     </div>

                     {generatedCode && (
                        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-center text-gray-500">
                            <div className="bg-gray-100 p-2 rounded">Comp: {selectedTrx.componentId}</div>
                            <div className="bg-gray-100 p-2 rounded">WH: {selectedTrx.warehouseId}</div>
                            <div className="bg-gray-100 p-2 rounded">Batch: {selectedTrx.workOrderId}</div>
                            <div className="bg-gray-100 p-2 rounded">Date: {selectedTrx.date}</div>
                        </div>
                     )}
                </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
             <ArrowRight className="w-12 h-12 mb-4 opacity-20" />
             <p className="text-lg font-medium">Select a transaction to start</p>
             <p className="text-sm">Choose an export record from the list on the left.</p>
          </div>
        )}
      </div>
    </div>
  );
};