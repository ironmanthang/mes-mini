import { X, Save, Edit, Loader2 } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { purchaseOrderService, type UpdatePORequest } from "../../../services/purchaseOrderServices";

interface UpdateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onSuccess: () => void;
}

export const UpdateOrderModal = ({ isOpen, onClose, orderId, onSuccess }: UpdateOrderModalProps): JSX.Element | null => {
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB - Free On Board");
  const [priority, setPriority] = useState("NORMAL");
  const [note, setNote] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setIsLoading(true);
      purchaseOrderService.getPOById(orderId)
        .then((data) => {
          const dateStr = data.expectedDeliveryDate ? data.expectedDeliveryDate.split('T')[0] : "";
          setExpectedDeliveryDate(dateStr);
          setTaxRate(Number(data.taxRate) || 0);
          setShippingCost(Number(data.shippingCost) || 0);
          setPaymentTerms(data.paymentTerms || "Net 30");
          setDeliveryTerms(data.deliveryTerms || "FOB - Free On Board");
          setPriority(data.priority || "NORMAL");
          setNote(data.note || "");
        })
        .catch(err => console.error("Failed to load PO details", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, orderId]);

  const handleSubmit = async () => {
    if (!orderId) return;

    setIsSubmitting(true);
    try {
      const payload: UpdatePORequest = {
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        taxRate,
        shippingCost,
        paymentTerms,
        deliveryTerms,
        priority,
        note
      };

      await purchaseOrderService.updatePO(orderId, payload);
      
      alert("✅ Purchase Order updated successfully!");
      onSuccess(); 
      onClose();   
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error updating Purchase Order.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[600px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" /> Update Purchase Order
            </h2>
            <p className="text-sm font-mono text-gray-500 mt-1">Order ID: {orderId}</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full 
          hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Expected Delivery Date</label>
                    <input 
                        type="date" 
                        value={expectedDeliveryDate} 
                        onChange={e => setExpectedDeliveryDate(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Priority</label>
                    <select 
                        value={priority} 
                        onChange={e => setPriority(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="URGENT">High (Urgent)</option>
                        <option value="NORMAL">Medium (Normal)</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Tax Rate (%)</label>
                    <input 
                        type="number" min="0"
                        value={taxRate} 
                        onChange={e => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Shipping Cost ($)</label>
                    <input 
                        type="number" min="0"
                        value={shippingCost} 
                        onChange={e => setShippingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right" 
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Payment Terms</label>
                    <select 
                        value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="Net 30">Net 30</option>
                        <option value="Due upon receipt">Due upon receipt</option>
                        <option value="50% Advance">50% Advance</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Delivery Terms</label>
                    <select 
                        value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="FOB - Free On Board">FOB - Free On Board</option>
                        <option value="CIF - Cost, Insurance and Freight">CIF - Cost, Insurance and Freight</option>
                        <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
                        <option value="EXW - Ex Works">EXW - Ex Works</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Internal Note</label>
                <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    disabled={isSubmitting}
                    rows={3}
                    placeholder="Add specific instructions or notes..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting || isLoading} 
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};