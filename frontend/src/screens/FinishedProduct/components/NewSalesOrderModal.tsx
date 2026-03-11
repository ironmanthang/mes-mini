import { X, Save, Plus, Trash2, Send, Loader2 } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { AgentServices, type Agent } from "../../../services/agentServices";
import { SalesOrdersServices, type CreateSalesOrder } from "../../../services/salesOrdersServices";
import { type Product, ProductServices } from "../../../services/productServices";

interface NewSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const NewSalesOrderModal = ({ isOpen, onClose, onConfirm }: NewSalesOrderModalProps): JSX.Element | null => {
  // --- Data States ---
  const [agentsList, setAgentsList] = useState<Agent[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Form States ---
  const [agentId, setAgentId] = useState<number | "">("");
  const [orderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedShipDate, setExpectedShipDate] = useState("");
  const [priority, setPriority] = useState<string>("MEDIUM"); // Sửa thành chữ HOA để khớp Enum backend
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB");
  const [note, setNote] = useState("");

  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [agentShippingPrice, setAgentShippingPrice] = useState<number>(0);

  const [rows, setRows] = useState([{ productId: 0, quantity: 1, salePrice: 0 }]);

  // --- Fetch Initial Data ---
  useEffect(() => {
    if (isOpen) {
      AgentServices.getAllAgents()
        .then(response => setAgentsList(response.data))
        .catch(err => console.error("Failed to load agents", err));
      
      ProductServices.getAllProducts()
        .then(response => setProductList(response.data))
        .catch(err => console.error("Failed to load products", err));
    } else {
        // Reset form khi đóng modal
        setAgentId("");
        setExpectedShipDate("");
        setRows([{ productId: 0, quantity: 1, salePrice: 0 }]);
        setDiscount(0); setTax(0); setAgentShippingPrice(0); setNote("");
        setPriority("MEDIUM");
    }
  }, [isOpen]);

  // --- Handlers ---
  const handleAddRow = () => {
    setRows([...rows, { productId: 0, quantity: 1, salePrice: 0 }]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodIdStr: string) => {
    const prodId = Number(prodIdStr);
    const newRows = [...rows];
    newRows[index].productId = prodId;
    newRows[index].salePrice = 0; 
    setRows(newRows);
  };

  const handleRowChange = (index: number, field: 'quantity' | 'salePrice', value: number) => {
    const newRows = [...rows];
    newRows[index][field] = value < 0 ? 0 : value;
    setRows(newRows);
  };

  // --- Calculations ---
  const subtotal = rows.reduce((sum, row) => sum + (row.quantity * row.salePrice), 0);
  const grandTotal = subtotal - discount + tax + agentShippingPrice;

  // --- Submit ---
  const handleSubmit = async (statusTarget: "DRAFT" | "PENDING_APPROVAL") => {
    if (!agentId) return alert("Please select an Agent/Customer.");
    if (!expectedShipDate) return alert("Please set an Expected Delivery Date.");
    if (rows.length === 0 || rows.some(r => r.productId === 0)) return alert("Please select valid products for all rows.");

    setIsSubmitting(true);
    try {
      // Đã SỬA payload khớp 100% với CreateSalesOrder (Xóa code, sửa shippingCost thành agentShippingPrice)
      const payload: CreateSalesOrder = {
        agentId: Number(agentId),
        orderDate,
        expectedShipDate,
        discount,
        tax,
        agentShippingPrice: agentShippingPrice, // Đã đổi tên
        paymentTerms,
        deliveryTerms,
        note,
        status: statusTarget,
        priority, // Sẽ gửi đi dạng "HIGH", "MEDIUM", "LOW"
        details: rows.map(r => ({
          productId: r.productId,
          quantity: r.quantity,
          salePrice: r.salePrice
        }))
      };

      await SalesOrdersServices.createNewSalesOrder(payload);
      
      alert("Tạo đơn hàng thành công!");
      onConfirm();
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create sales order. Status 400 Bad Request.";
      alert(msg);
      console.error(error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[900px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h2 className="text-xl font-bold text-gray-900">New Sales Order</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" /></button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto space-y-8 flex-1">
            
            {/* 1. General Info */}
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Agent / Customer <span className="text-red-500">*</span></label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white" 
                            value={agentId} onChange={e => setAgentId(e.target.value === "" ? "" : Number(e.target.value))}>
                        <option value="">-- Select Agent --</option>
                        {agentsList.map(a => <option key={a.agentId} value={a.agentId}>{a.code} - {a.agentName}</option>)}
                    </select>
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Priority</label>
                    <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white" 
                            value={priority} onChange={e => setPriority(e.target.value)}>
                        <option value="HIGH">High</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Order Date</label>
                    <input type="date" disabled className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" value={orderDate} />
                </div>
                
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Expected Delivery <span className="text-red-500">*</span></label>
                    <input type="date" className="w-full p-2.5 border border-gray-300 rounded-lg text-sm" 
                           value={expectedShipDate} onChange={e => setExpectedShipDate(e.target.value)} />
                </div>
            </div>

            {/* 2. Order Items */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">Order Items</label>
                    <button onClick={handleAddRow} className="text-sm text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3 h-3" /> Add Item
                    </button>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                            <tr>
                                <th className="p-3 w-[40%]">Product</th>
                                <th className="p-3 w-20 text-center">Stock</th>
                                <th className="p-3 w-24 text-right">Qty</th>
                                <th className="p-3 w-32 text-right">Unit Price</th>
                                <th className="p-3 w-32 text-right">Total</th>
                                <th className="p-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, idx) => {
                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="p-2">
                                            <select className="w-full p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white cursor-pointer" 
                                                    value={row.productId} onChange={(e) => handleProductChange(idx, e.target.value)}>
                                                <option value="0">Select Product...</option>
                                                {productList.map(p => <option key={p.productId} value={p.productId}>{p.code} - {p.productName}</option>)}
                                            </select>
                                        </td>
                                        <td className="p-3 text-center text-gray-400 font-medium">N/A</td>
                                        <td className="p-2">
                                            <input type="number" min="1" className="w-full p-2 border border-gray-300 rounded text-right outline-none focus:ring-1 focus:ring-blue-500" 
                                                   value={row.quantity} onChange={(e) => handleRowChange(idx, 'quantity', parseInt(e.target.value) || 0)} />
                                        </td>
                                        <td className="p-2">
                                            <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded text-right outline-none focus:ring-1 focus:ring-blue-500" 
                                                   value={row.salePrice} onChange={(e) => handleRowChange(idx, 'salePrice', parseFloat(e.target.value) || 0)} />
                                        </td>
                                        <td className="p-3 text-right font-medium text-gray-900">
                                            {(row.quantity * row.salePrice).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-2 text-center">
                                            <button onClick={() => handleRemoveRow(idx)} className="text-red-400 hover:text-red-600 cursor-pointer p-1 transition-colors">
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

            {/* 3. Financials & Terms */}
            <div className="grid grid-cols-2 gap-8">
                {/* Terms */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Payment Terms</label>
                        <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none cursor-pointer">
                            <option value="Net 30">Net 30</option>
                            <option value="Due upon receipt">Due upon receipt</option>
                            <option value="50% Advance">50% Advance, 50% on delivery</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Delivery Terms</label>
                        <select value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none cursor-pointer">
                            <option value="FOB - Free On Board">FOB - Free On Board</option>
                            <option value="CIF - Cost, Insurance and Freight">CIF - Cost, Insurance and Freight</option>
                            <option value="EXW - Ex Works">EXW - Ex Works</option>
                            <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
                            <option value="null">null</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-600 uppercase">Internal Note</label>
                        <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm outline-none resize-none" placeholder="Optional notes..." />
                    </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-semibold text-gray-900">${subtotal.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Discount ($)</span>
                        <input type="number" min="0" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                               className="w-24 p-1.5 border border-gray-300 rounded text-right text-sm font-medium bg-white outline-none"/>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Tax ($)</span>
                        <input type="number" min="0" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                               className="w-24 p-1.5 border border-gray-300 rounded text-right text-sm font-medium bg-white outline-none"/>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>Shipping Cost ($)</span>
                        <input type="number" min="0" value={agentShippingPrice} onChange={(e) => setAgentShippingPrice(parseFloat(e.target.value) || 0)}
                               className="w-24 p-1.5 border border-gray-300 rounded text-right text-sm font-medium bg-white outline-none"/>
                    </div>
                    
                    <div className="pt-4 border-t-2 border-gray-200 flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Grand Total</span>
                        <span className="text-2xl font-bold text-blue-600">${grandTotal.toLocaleString('vi-VN')}</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50">
                Cancel
            </button>
            <button onClick={() => handleSubmit("DRAFT")} disabled={isSubmitting} className="px-6 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg font-bold hover:bg-blue-50 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> Save Draft
            </button>
            <button onClick={() => handleSubmit("PENDING_APPROVAL")} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />} 
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
        </div>
      </div>
    </div>
  );
};