import { 
  Plus, Trash2, Upload, 
  Save, Send, Calculator, Printer
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
  const [orderDate] = useState(new Date().toISOString().split('T')[0]); // Today
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
    <div className="space-y-6 pb-12">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</span>
          Supplier & Basic Info
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Supplier Selection<span className="text-red-500">*</span></label>
            <select 
              className="w-full p-2.5 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
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
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
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
          
          <div className="w-full h-px bg-gray-100 md:col-span-3 my-2"></div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Order Date</label>
            <div className="relative">
              <input type="date" disabled value={orderDate} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Expected Delivery Date</label>
            <input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">2</span>
          Component List
        </h3>

        <div className="overflow-x-auto mb-4">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs uppercase text-gray-500 font-semibold">
                <th className="p-3 w-[250px]">Component Name*</th>
                <th className="p-3">ID</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Current Stock</th>
                <th className="p-3 text-right w-[100px]">Qty*</th>
                <th className="p-3 text-right w-[120px]">Unit Price ($)*</th>
                <th className="p-3 text-right w-[120px]">Total ($)</th>
                <th className="p-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <select 
                      className="w-full p-2 border border-gray-300 rounded 
                      text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
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
                      className="w-full p-2 border border-gray-300 rounded 
                      text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(row.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-3 text-sm text-gray-600 text-right">
                    {row.unitPrice || '-'}
                  </td>
                  <td className="p-3 text-right text-sm font-medium text-gray-900">
                    {row.total.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(row.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400 italic text-sm">
                    No components added yet. Click "Add Component" to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <button 
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2 
          bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium
          cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Component
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">3</span>
          Summary & Approval
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                  <select 
                    value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Due upon receipt">Due upon receipt</option>
                    <option value="50% Advance, 50% on delivery">50% Advance, 50% on delivery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Delivery Terms</label>
                  <select 
                    value={deliveryTerm} onChange={(e) => setDeliveryTerm(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none cursor-pointer"
                  >
                    <option value="FOB - Free On Board">FOB - Free On Board</option>
                    <option value="CIF - Cost, Insurance and Freight">CIF - Cost, Insurance and Freight</option>
                    <option value="EXW - Ex Works">EXW - Ex Works</option>
                    <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
                  </select>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Attachments</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer text-center">
                   <Upload className="w-8 h-8 text-gray-400 mb-2" />
                   <p className="text-sm text-gray-600 font-medium">Click to upload documents</p>
                   <p className="text-xs text-gray-400">Quotes, Spec Sheets (PDF, JPG)</p>
                </div>
             </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
             <div className="flex justify-between items-center pb-3 border-b border-gray-200">
               <span className="text-sm text-gray-600">Subtotal</span>
               <span className="text-base font-semibold text-gray-900">${subtotal.toLocaleString()}</span>
             </div>

             <div className="flex justify-between items-center gap-4">
               <span className="text-sm text-gray-600">Tax (%)</span>
               <div className="flex items-center justify-end w-32">
                 <input 
                   type="number" 
                   value={taxRate} 
                   onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                   className="w-16 p-1 border border-gray-300 rounded text-right text-sm mr-2"
                 />
                 <span className="text-sm font-medium text-gray-900">${taxAmount.toLocaleString()}</span>
               </div>
             </div>

             <div className="flex justify-between items-center gap-4">
               <span className="text-sm text-gray-600">Shipping Cost ($)</span>
               <input 
                  type="number" 
                  value={shippingCost} 
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="w-32 p-1 border border-gray-300 rounded text-right text-sm font-medium text-gray-900"
               />
             </div>

             <div className="pt-4 border-t-2 border-gray-200 flex justify-between items-center">
               <span className="text-lg font-bold text-gray-900">Grand Total</span>
               <span className="text-2xl font-bold text-blue-600">${grandTotal.toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 ml-[200px]">
         <div className="max-w-7xl mx-auto flex items-center justify-end gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border 
            border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
               <Save className="w-4 h-4" /> Save Draft
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-white border 
            border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
               <Printer className="w-4 h-4" /> Print Preview
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-100 text-blue-700 
            font-medium rounded-lg hover:bg-blue-200 transition-colors cursor-pointer">
               <Calculator className="w-4 h-4" /> Calculate Total
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-[#2EE59D] text-white 
            font-medium rounded-lg hover:bg-[#25D390] transition-colors shadow-sm cursor-pointer">
               <Send className="w-4 h-4" /> Submit for Approval
            </button>
         </div>
      </div>
    </div>
  );
};