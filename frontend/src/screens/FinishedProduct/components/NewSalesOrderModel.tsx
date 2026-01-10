import { X, Save, Plus, Trash2, Calculator } from "lucide-react";
import { useState, type JSX } from "react";

interface NewSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const agents = ["TechWorld Distributor", "Global Electronics", "Local Retailer A"];
const products = [
  { id: "PROD-001", name: "Gaming Laptop X1", stock: 150, price: 1200 },
  { id: "PROD-002", name: "Mechanical Keyboard", stock: 300, price: 80 },
  { id: "PROD-004", name: "Smart Watch V2", stock: 50, price: 250 },
];

export const NewSalesOrderModal = ({ isOpen, onClose, onConfirm }: NewSalesOrderModalProps): JSX.Element | null => {
  const [rows, setRows] = useState([{ productId: "", quantity: 1, price: 0 }]);
  const [agent, setAgent] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [address, setAddress] = useState("");

  const handleAddRow = () => {
    setRows([...rows, { productId: "", quantity: 1, price: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const product = products.find(p => p.id === prodId);
    const newRows = [...rows];
    newRows[index].productId = prodId;
    newRows[index].price = product ? product.price : 0;
    setRows(newRows);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const newRows = [...rows];
    newRows[index].quantity = qty;
    setRows(newRows);
  };

  const totalValue = rows.reduce((sum, row) => sum + (row.quantity * row.price), 0);

  const handleSubmit = () => {
    if (!agent || !deliveryDate) return alert("Please fill required fields");
    onConfirm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[800px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">New Sales Order</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Agent / Customer</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" value={agent} onChange={e => setAgent(e.target.value)}>
                        <option value="">-- Select Agent --</option>
                        {agents.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Delivery Date</label>
                    <input type="date" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                </div>
                <div className="col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700">Delivery Address</label>
                    <textarea rows={2} className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" placeholder="Enter shipping address..." value={address} onChange={e => setAddress(e.target.value)} />
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Order Items</label>
                    <button onClick={handleAddRow} className="text-sm text-blue-600 font-medium 
                    hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3 h-3" /> Add Item
                    </button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-3">Product</th>
                                <th className="p-3 w-24">Stock</th>
                                <th className="p-3 w-24">Qty</th>
                                <th className="p-3 w-32">Price ($)</th>
                                <th className="p-3 w-32">Total ($)</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, idx) => {
                                const stock = products.find(p => p.id === row.productId)?.stock || 0;
                                return (
                                    <tr key={idx}>
                                        <td className="p-2">
                                            <select className="w-full p-1.5 border rounded" value={row.productId} onChange={(e) => handleProductChange(idx, e.target.value)}>
                                                <option value="">Select Product...</option>
                                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3 text-gray-500">{stock}</td>
                                        <td className="p-2"><input type="number" min="1" className="w-full p-1.5 border rounded" value={row.quantity} onChange={(e) => handleQtyChange(idx, parseInt(e.target.value))} /></td>
                                        <td className="p-3 text-right">{row.price}</td>
                                        <td className="p-3 text-right font-medium">{(row.quantity * row.price).toLocaleString()}</td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleRemoveRow(idx)} 
                                            className="text-red-500 hover:text-red-700 cursor-pointer">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-between items-center">
            <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Calculator className="w-5 h-5 text-gray-500" />
                Total: <span className="text-blue-600">${totalValue.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} 
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg 
                text-gray-700 font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button onClick={handleSubmit} 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer">
                    <Save className="w-4 h-4" /> Create Order
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};