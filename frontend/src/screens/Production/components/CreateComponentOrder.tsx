import { 
  Plus, Trash2, Upload, 
  Save, Send, Calculator, Printer, FileText
} from "lucide-react";
import { useState, type JSX } from "react";

// --- Mock Data ---
const suppliers = [
  { id: "SUP001", name: "Bosch Vietnam", phone: "028 1234 5678", email: "contact@bosch.vn", address: "Long Thanh, Dong Nai" },
  { id: "SUP002", name: "Samsung Electro-Mechanics", phone: "024 9876 5432", email: "sales@samsung.com", address: "Thai Nguyen" },
  { id: "SUP003", name: "Intel Products", phone: "028 5555 9999", email: "supply@intel.com", address: "Thu Duc, HCMC" },
];

const componentDatabase = [
  { id: "COMP001", name: "CPU Chipset A1", description: "Main processing unit", currentStock: 150, unitPrice: 250 },
  { id: "COMP002", name: "Memory Module 8GB", description: "DDR4 RAM", currentStock: 500, unitPrice: 45 },
  { id: "COMP003", name: "SSD 512GB", description: "NVMe Storage", currentStock: 200, unitPrice: 60 },
  { id: "COMP004", name: "Wifi Card", description: "Wifi 6E Module", currentStock: 50, unitPrice: 15 },
];

// --- Interfaces ---
interface OrderRow {
  id: number;
  componentId: string;
  componentName: string;
  description: string;
  currentStock: number;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const CreateComponentOrder = (): JSX.Element => {
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierInfo, setSupplierInfo] = useState<any>(null);
  const [orderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [rows, setRows] = useState<OrderRow[]>([]);

  const [taxRate, setTaxRate] = useState(10);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentTerm, setPaymentTerm] = useState("Net 30");
  const [deliveryTerm, setDeliveryTerm] = useState("FOB - Free On Board");

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSupplierId(id);
    const supplier = suppliers.find(s => s.id === id);
    setSupplierInfo(supplier || null);
  };

  const addRow = () => {
    setRows([
      ...rows,
      { id: Date.now(), componentId: "", componentName: "", description: "", currentStock: 0, quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const removeRow = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleComponentSelect = (rowId: number, compId: string) => {
    const comp = componentDatabase.find(c => c.id === compId);
    if (comp) {
      setRows(rows.map(r => r.id === rowId ? {
        ...r,
        componentId: comp.id,
        componentName: comp.name,
        description: comp.description,
        currentStock: comp.currentStock,
        unitPrice: comp.unitPrice,
        total: r.quantity * comp.unitPrice
      } : r));
    }
  };

  const handleRowChange = (rowId: number, field: 'quantity' | 'unitPrice', value: number) => {
    setRows(rows.map(r => {
      if (r.id === rowId) {
        const newVal = value < 0 ? 0 : value;
        const newTotal = field === 'quantity' ? newVal * r.unitPrice : r.quantity * newVal;
        return { ...r, [field]: newVal, total: newTotal };
      }
      return r;
    }));
  };

  // Calculations
  const subtotal = rows.reduce((sum, r) => sum + r.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount + shippingCost;

  return (
    <div className="space-y-6 pb-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">New Component Order</h2>
          <p className="text-sm text-gray-500">Create a purchase order for raw materials.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm">
             <Save className="w-4 h-4" /> Save Draft
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-sm">
             <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
          <FileText className="w-4 h-4 text-blue-600" /> Supplier Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supplier<span className="text-red-500">*</span></label>
            <select 
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer bg-white"
              value={selectedSupplierId}
              onChange={handleSupplierChange}
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.id} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input type="text" readOnly value={supplierInfo?.phone || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input type="text" readOnly value={supplierInfo?.email || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
          </div>

          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-medium text-gray-700">Address</label>
            <input type="text" readOnly value={supplierInfo?.address || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
          </div>
          
          <div className="w-full h-px bg-gray-100 md:col-span-3 my-1"></div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Order Date</label>
            <input type="date" disabled value={orderDate} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Expected Delivery</label>
            <input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer bg-white"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm min-h-[300px]">
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Items Details
            </h3>
            <button 
                onClick={addRow}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium cursor-pointer"
            >
                <Plus className="w-4 h-4" /> Add Item
            </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase text-gray-500 font-semibold">
                <th className="p-3 w-[300px]">Component Name*</th>
                <th className="p-3">ID</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3 text-right w-[100px]">Qty*</th>
                <th className="p-3 text-right w-[120px]">Unit Price ($)*</th>
                <th className="p-3 text-right w-[120px]">Total ($)</th>
                <th className="p-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <select 
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
                      value={row.componentId}
                      onChange={(e) => handleComponentSelect(row.id, e.target.value)}
                    >
                      <option value="">Select Component...</option>
                      {componentDatabase.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{row.componentId || '-'}</td>
                  <td className="p-3 text-sm text-gray-600 truncate max-w-[150px]">{row.description || '-'}</td>
                  <td className="p-3 text-sm text-gray-600 text-right">{row.currentStock}</td>
                  <td className="p-3">
                    <input 
                      type="number" 
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(row.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-3 text-sm text-gray-600 text-right">
                    <input 
                        type="number" 
                        min="0"
                        className="w-full p-2 border border-gray-300 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={row.unitPrice}
                        onChange={(e) => handleRowChange(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-3 text-right text-sm font-medium text-gray-900">
                    {row.total.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400 border-dashed border-2 border-gray-100 rounded-lg">
                    <div className="flex flex-col items-center">
                        <Plus className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm">List is empty.</p>
                        <button onClick={addRow} className="mt-2 text-blue-600 hover:underline text-sm">Add first item</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6 h-full">
             <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">Terms & Conditions</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Payment Terms</label>
                        <select 
                            value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none cursor-pointer"
                        >
                            <option value="Net 30">Net 30</option>
                            <option value="Due upon receipt">Due upon receipt</option>
                            <option value="50% Advance">50% Advance, 50% on delivery</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Delivery Terms</label>
                        <select 
                            value={deliveryTerm} onChange={(e) => setDeliveryTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none cursor-pointer"
                        >
                            <option value="FOB">FOB - Free On Board</option>
                            <option value="CIF">CIF - Cost, Insurance and Freight</option>
                            <option value="DDP">DDP - Delivered Duty Paid</option>
                        </select>
                    </div>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-medium text-gray-500 block">Attachments</label>
                <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer text-gray-500">
                   <Upload className="w-4 h-4" />
                   <span className="text-sm">Upload Quotes / Specs</span>
                </div>
             </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
             <div className="space-y-4">
                 <div className="flex justify-between items-center text-sm text-gray-600">
                   <span>Subtotal</span>
                   <span className="font-semibold text-gray-900">${subtotal.toLocaleString()}</span>
                 </div>

                 <div className="flex justify-between items-center text-sm text-gray-600">
                   <span>Tax (%)</span>
                   <div className="flex items-center justify-end w-32">
                     <input 
                       type="number" 
                       value={taxRate} 
                       onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                       className="w-12 p-1 border border-gray-300 rounded text-right text-sm mr-2 bg-white"
                     />
                     <span className="font-medium text-gray-900">${taxAmount.toLocaleString()}</span>
                   </div>
                 </div>

                 <div className="flex justify-between items-center text-sm text-gray-600">
                   <span>Shipping ($)</span>
                   <input 
                      type="number" 
                      value={shippingCost} 
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-24 p-1 border border-gray-300 rounded text-right text-sm font-medium text-gray-900 bg-white"
                   />
                 </div>

                 <div className="pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                   <span className="text-lg font-bold text-gray-900">Grand Total</span>
                   <span className="text-2xl font-bold text-blue-600">${grandTotal.toLocaleString()}</span>
                 </div>
             </div>

             <div className="mt-8 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                   <Calculator className="w-4 h-4" /> Recalculate
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2EE59D] text-white font-bold rounded-lg hover:bg-[#25D390] transition-colors shadow-md cursor-pointer">
                   <Send className="w-4 h-4" /> Submit Order
                </button>
             </div>
          </div>
      </div>

    </div>
  );
};