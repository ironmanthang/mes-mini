import { X, ScanBarcode, CheckCircle2 } from "lucide-react";
import { useState, useEffect, type JSX } from "react";

interface StocktakingSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseName: string;
}

const initialItems = [
  { id: "COMP-001", name: "CPU Chipset A1", barcode: "8930001", expected: 150, actual: 150, notes: "" },
  { id: "COMP-002", name: "Memory 8GB", barcode: "8930002", expected: 500, actual: 498, notes: "Damaged box" },
  { id: "PROD-101", name: "Gaming Laptop", barcode: "8930003", expected: 50, actual: 0, notes: "" },
];

export const StocktakingSessionModal = ({ isOpen, onClose, warehouseName }: StocktakingSessionModalProps): JSX.Element | null => {
  const [items, setItems] = useState(initialItems);
  const [scanningCode, setScanningCode] = useState("");

  useEffect(() => {
    if (isOpen) {
      setItems(initialItems); 
      setScanningCode("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleQuantityChange = (id: string, value: number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, actual: value } : item
    ));
  };

  const handleNoteChange = (id: string, note: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, notes: note } : item
    ));
  };

  const handleSimulateScan = (e: React.FormEvent) => {
    e.preventDefault();
    const found = items.find(i => i.barcode === scanningCode);
    if (found) {
      handleQuantityChange(found.id, found.actual + 1);
      alert(`Scanned: ${found.name}. Count increased to ${found.actual + 1}`);
      setScanningCode("");
    } else {
      alert("Barcode not found in this list!");
    }
  };

  const totalVariance = items.reduce((acc, item) => acc + (item.actual - item.expected), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[900px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ScanBarcode className="w-6 h-6 text-blue-600" />
              STOCKTAKING SESSION
            </h2>
            <p className="text-sm text-gray-500 mt-1">Target: <span className="font-medium text-gray-900">{warehouseName}</span></p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-4">
            <form onSubmit={handleSimulateScan} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                    <ScanBarcode className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={scanningCode}
                        onChange={(e) => setScanningCode(e.target.value)}
                        placeholder="Scan barcode here to increment count..." 
                        className="w-full pl-9 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        autoFocus
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500">
                    Simulate Scan
                </button>
            </form>
            <div className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 ${totalVariance === 0 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                <span>Total Variance:</span>
                <span>{totalVariance > 0 ? `+${totalVariance}` : totalVariance}</span>
            </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                <th className="py-3 pr-4">Item Details</th>
                <th className="py-3 px-2 text-center">Expected</th>
                <th className="py-3 px-2 text-center">Actual Qty</th>
                <th className="py-3 px-2 text-center">Variance</th>
                <th className="py-3 pl-4">Notes</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items.map((item) => {
                const variance = item.actual - item.expected;
                const isDiscrepancy = variance !== 0;

                return (
                  <tr key={item.id} className={`border-b border-gray-100 group ${isDiscrepancy ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">ID: {item.id} | Barcode: {item.barcode}</div>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-600 bg-gray-50 rounded">
                        {item.expected}
                    </td>
                    <td className="py-3 px-2">
                        <input 
                            type="number" 
                            value={item.actual}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className={`w-20 mx-auto block text-center p-1.5 border rounded font-bold outline-none focus:ring-2 ${
                                isDiscrepancy ? 'border-red-300 text-red-700 focus:ring-red-200' : 'border-gray-300 text-gray-900 focus:ring-blue-200'
                            }`}
                        />
                    </td>
                    <td className="py-3 px-2 text-center">
                        <span className={`font-bold ${variance === 0 ? 'text-gray-300' : variance < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                            {variance > 0 ? `+${variance}` : variance}
                        </span>
                    </td>
                    <td className="py-3 pl-4">
                        <input 
                            type="text" 
                            value={item.notes}
                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                            placeholder="Add note..."
                            className="w-full p-1.5 border-b border-gray-200 bg-transparent text-gray-600 focus:border-blue-500 outline-none text-sm"
                        />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Save Draft & Close
          </button>
          <button 
            onClick={() => { alert("Stocktake Submitted for Approval!"); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#2EE59D] text-white font-medium rounded-lg hover:bg-[#25D390] transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Submit for Approval
          </button>
        </div>
      </div>
    </div>
  );
};