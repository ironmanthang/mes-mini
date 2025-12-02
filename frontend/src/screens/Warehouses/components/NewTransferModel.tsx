import { X, Save, Plus, Trash2, ArrowRight } from "lucide-react";
import { useState, type JSX } from "react";

interface NewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockStock = [
  { id: "COMP-001", name: "CPU Chipset A1", available: 500 },
  { id: "COMP-002", name: "Memory 8GB", available: 200 },
  { id: "PROD-101", name: "Gaming Laptop", available: 50 },
];

export const NewTransferModal = ({ isOpen, onClose }: NewTransferModalProps): JSX.Element | null => {
  if (!isOpen) return null;

  const [items, setItems] = useState([
    { id: "COMP-001", name: "CPU Chipset A1", available: 500, quantity: 0 }
  ]);

  const addItem = () => {
    setItems([...items, { id: "", name: "", available: 0, quantity: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleItemSelect = (index: number, itemId: string) => {
    const selected = mockStock.find(s => s.id === itemId);
    const newItems = [...items];
    if (selected) {
      newItems[index] = { ...newItems[index], id: selected.id, name: selected.name, available: selected.available };
    }
    setItems(newItems);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    setItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[800px] rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">NEW TRANSFER REQUEST</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
            
            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">From Warehouse</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                        <option>Central Component Storage</option>
                    </select>
                </div>
                <div className="flex items-center justify-center pt-6">
                    <ArrowRight className="w-6 h-6 text-gray-400" />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">To Warehouse</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white">
                        <option>Finished Goods Hub</option>
                        <option>Defect Quarantine</option>
                    </select>
                </div>
                <div className="space-y-2 col-span-3">
                    <label className="text-sm font-medium text-gray-700">Transfer Date</label>
                    <input type="date" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" />
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-2 mb-3">Items to Transfer</h3>
                <div className="space-y-3">
                    {items.map((item, index) => {
                        const isError = item.quantity > item.available;
                        return (
                            <div key={index} className="flex gap-3 items-start">
                                <div className="flex-1 space-y-1">
                                    <select 
                                        className="w-full p-2 border border-gray-300 rounded text-sm"
                                        value={item.id}
                                        onChange={(e) => handleItemSelect(index, e.target.value)}
                                    >
                                        <option value="">Select Item...</option>
                                        {mockStock.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <div className="text-xs text-gray-500">Available Stock: <span className="font-bold">{item.available}</span></div>
                                </div>
                                <div className="w-32 space-y-1">
                                    <input 
                                        type="number" 
                                        placeholder="Qty"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                        className={`w-full p-2 border rounded text-sm outline-none focus:ring-2 ${isError ? 'border-red-500 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-200'}`}
                                    />
                                    {isError && <div className="text-xs text-red-600 font-bold">Exceeds Stock!</div>}
                                </div>
                                <button onClick={() => removeItem(index)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded mt-0.5">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )
                    })}
                </div>
                <button onClick={addItem} className="mt-3 flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline">
                    <Plus className="w-4 h-4" /> Add Item
                </button>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100">Cancel</button>
          <button 
            onClick={() => { alert("Transfer Request Created!"); onClose(); }}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 shadow-sm"
          >
            <Save className="w-4 h-4" /> Confirm Transfer
          </button>
        </div>
      </div>
    </div>
  );
};