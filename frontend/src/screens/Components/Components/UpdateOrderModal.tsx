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
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB - Free On Board");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<'DRAFT' | 'PENDING' | 'CANCELLED'>('DRAFT');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      setIsLoading(true);
      purchaseOrderService.getPOById(orderId)
        .then((data) => {
          const dateStr = data.expectedDeliveryDate ? data.expectedDeliveryDate.split('T')[0] : "";
          setExpectedDeliveryDate(dateStr);
          setDiscount(data.discount || 0);
          setTax(data.tax || 0);
          setShippingCost(data.shippingCost || 0);
          setPaymentTerms(data.paymentTerms || "Net 30");
          setDeliveryTerms(data.deliveryTerms || "FOB - Free On Board");
          setNote(data.note || "");
          
          if (['DRAFT', 'PENDING', 'CANCELLED'].includes(data.status)) {
              setStatus(data.status as 'DRAFT' | 'PENDING' | 'CANCELLED');
          }
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
        discount,
        tax,
        shippingCost,
        paymentTerms,
        deliveryTerms,
        note,
        status
      };

      await purchaseOrderService.updatePO(orderId, payload);
      
      alert("✅ Cập nhật Purchase Order thành công!");
      onSuccess(); 
      onClose();   
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi cập nhật Purchase Order.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[600px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" /> Cập nhật Purchase Order
            </h2>
            <p className="text-sm font-mono text-gray-500 mt-1">Order ID: {orderId}</p>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Trạng thái</label>
                    <select 
                        value={status} 
                        onChange={e => setStatus(e.target.value as 'DRAFT' | 'PENDING' | 'CANCELLED')}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Ngày dự kiến giao</label>
                    <input 
                        type="date" 
                        value={expectedDeliveryDate} 
                        onChange={e => setExpectedDeliveryDate(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                    />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Chiết khấu ($)</label>
                    <input 
                        type="number" min="0"
                        value={discount} 
                        onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Thuế ($)</label>
                    <input 
                        type="number" min="0"
                        value={tax} 
                        onChange={e => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Vận chuyển ($)</label>
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
                    <label className="text-sm font-bold text-gray-700">Điều khoản TT (Payment)</label>
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
                    <label className="text-sm font-bold text-gray-700">Điều khoản GH (Delivery)</label>
                    <select 
                        value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="FOB - Free On Board">FOB - Free On Board</option>
                        <option value="CIF - Cost, Insurance and Freight">CIF - Cost, Insurance...</option>
                        <option value="EXW - Ex Works">EXW - Ex Works</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Ghi chú (Note)</label>
                  <textarea 
                      rows={2} 
                      value={note} 
                      onChange={e => setNote(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                  />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting || isLoading} 
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
};