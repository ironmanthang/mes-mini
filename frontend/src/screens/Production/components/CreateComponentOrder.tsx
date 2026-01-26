import { 
  Plus, Trash2, 
  Save, Send, Printer, FileText, Loader2
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";

import { supplierService, type Supplier, type SupplierComponent } from "../../../services/supplierServices";
import { purchaseOrderService } from "../../../services/purchaseOrderServices";

interface OrderRow {
  id: number;
  componentId: number;
  componentName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export const CreateComponentOrder = (): JSX.Element => {
  const [suppliersList, setSuppliersList] = useState<Supplier[]>([]);
  const [componentsList, setComponentsList] = useState<SupplierComponent[]>([]); 
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = useState<number | "">("");
  const [supplierInfo, setSupplierInfo] = useState<Supplier | null>(null);
  
  const [orderDate] = useState(new Date().toISOString().split('T')[0]);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState("Medium");

  const [rows, setRows] = useState<OrderRow[]>([]);

  const [taxRate] = useState(10);
  const [shippingCost, setShippingCost] = useState(0);
  const [paymentTerm, setPaymentTerm] = useState("Net 30");
  const [deliveryTerm, setDeliveryTerm] = useState("FOB - Free On Board");

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const suppliers = await supplierService.getAllSuppliers();
        //@ts-expect-error data
        setSuppliersList(suppliers.data);
      } catch (error) {
        console.error("Failed to load suppliers", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const fetchComponentsBySupplier = async () => {
      if (!selectedSupplierId) {
        setComponentsList([]);
        return;
      }

      setIsLoadingComponents(true);
      try {
        const components = await supplierService.getSupplierComponents(Number(selectedSupplierId));
        setComponentsList(components);
      } catch (error) {
        console.error("Failed to load components for this supplier", error);
        setComponentsList([]);
      } finally {
        setIsLoadingComponents(false);
      }
    };

    fetchComponentsBySupplier();
  }, [selectedSupplierId]);

  const handleSupplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedSupplierId(id);
    const supplier = suppliersList.find(s => s.supplierId === id);
    setSupplierInfo(supplier || null);
    
    setRows([]);
  };

  const addRow = () => {
    if (!selectedSupplierId) return alert("Please select a supplier first.");
    setRows([
      ...rows,
      { id: Date.now(), componentId: 0, componentName: "", quantity: 1, unitPrice: 0, total: 0 }
    ]);
  };

  const removeRow = (id: number) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleComponentSelect = (rowId: number, compIdStr: string) => {
    const compId = Number(compIdStr);
    const comp = componentsList.find(c => c.componentId === compId);
    
    if (comp) {
      setRows(rows.map(r => r.id === rowId ? {
        ...r,
        componentId: comp.componentId,
        componentName: comp.name,
        unitPrice: comp.suggestedPrice || 0,
        total: r.quantity * (comp.suggestedPrice || 0)
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

  const handleSubmit = async () => {
    if (!selectedSupplierId) return alert("Please select a supplier.");
    if (rows.length === 0) return alert("Please add at least one component.");
    if (rows.some(r => r.componentId === 0)) return alert("Please select components for all rows.");

    setIsSubmitting(true);
    try {
      const poCode = `PO-${Date.now().toString().slice(-6)}`;

      await purchaseOrderService.createPO({
        code: poCode,
        supplierId: Number(selectedSupplierId),
        expectedDeliveryDate: deliveryDate || undefined,
        discount: 0,
        tax: taxRate,
        shippingCost: shippingCost,
        paymentTerms: paymentTerm,
        deliveryTerms: deliveryTerm,
        note: `Priority: ${priority}`,
        details: rows.map(r => ({
          componentId: r.componentId,
          quantity: r.quantity,
          unitPrice: r.unitPrice
        }))
      });

      alert("Purchase Order Created Successfully!");
      setRows([]);
      setSelectedSupplierId("");
      setSupplierInfo(null);

    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = rows.reduce((sum, r) => sum + r.total, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount + shippingCost;

  if (isLoadingData) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">New Component Order</h2>
          <p className="text-sm text-gray-500">Create a purchase order for raw materials.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
             <Save className="w-4 h-4" /> Save Draft
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
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
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
              value={selectedSupplierId}
              onChange={handleSupplierChange}
            >
              <option value="">-- Select Supplier --</option>
              {suppliersList.map(s => (
                <option key={s.supplierId} value={s.supplierId}>{s.code} - {s.supplierName}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone</label>
            <input type="text" readOnly value={supplierInfo?.phoneNumber || ''} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
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
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm cursor-pointer" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer"
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
                {isLoadingComponents && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </h3>
            <button 
                onClick={addRow}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
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
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 cursor-pointer disabled:bg-gray-100"
                      value={row.componentId}
                      disabled={!selectedSupplierId || isLoadingComponents}
                      onChange={(e) => handleComponentSelect(row.id, e.target.value)}
                    >
                      <option value="0">{isLoadingComponents ? "Loading..." : "Select Component..."}</option>
                      {componentsList.map(c => (
                        <option key={c.componentId} value={c.componentId}>{c.code} - {c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{row.componentId || '-'}</td>
                  <td className="p-3">
                    <input 
                      type="number" min="1"
                      className="w-full p-2 border border-gray-300 rounded text-right text-sm"
                      value={row.quantity}
                      onChange={(e) => handleRowChange(row.id, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-3">
                    <input 
                        type="number" min="0"
                        className="w-full p-2 border border-gray-300 rounded text-right text-sm"
                        value={row.unitPrice}
                        onChange={(e) => handleRowChange(row.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="p-3 text-right text-sm font-medium text-gray-900">
                    {row.total.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeRow(row.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
             <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 border-b border-gray-100 pb-2">Terms & Conditions</h4>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Payment Terms</label>
                        <select 
                            value={paymentTerm} onChange={(e) => setPaymentTerm(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm cursor-pointer"
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
                            className="w-full p-2 border border-gray-300 rounded-md text-sm cursor-pointer"
                        >
                            <option value="FOB - Free On Board">FOB - Free On Board</option>
                            <option value="CIF - Cost, Insurance and Freight">CIF - Cost, Insurance and Freight</option>
                            <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
                            <option value="EXW - Ex Works">EXW - Ex Works</option>
                        </select>
                    </div>
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
                   <span>Tax ({taxRate}%)</span>
                   <span className="font-medium text-gray-900">${taxAmount.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm text-gray-600">
                   <span>Shipping ($)</span>
                   <input 
                      type="number" value={shippingCost} 
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-24 p-1 border border-gray-300 rounded text-right text-sm font-medium bg-white"
                   />
                 </div>
                 <div className="pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                   <span className="text-lg font-bold text-gray-900">Grand Total</span>
                   <span className="text-2xl font-bold text-blue-600">${grandTotal.toLocaleString()}</span>
                 </div>
             </div>

             <div className="mt-8 flex justify-end gap-3">
                <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-[#2EE59D] text-white font-bold rounded-lg hover:bg-[#25D390] transition-colors shadow-md disabled:opacity-70"
                >
                   {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                   {isSubmitting ? "Submitting..." : "Submit Order"}
                </button>
             </div>
          </div>
      </div>
    </div>
  );
};