import { 
  X, CheckCircle, RefreshCw, Printer, User, Package
} from "lucide-react";
import { type JSX } from "react";
import type { PurchaseOrder } from "../../../services/purchaseOrderServices";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onApprove: () => void;
  onUpdateStatus: () => void;
}

export const OrderDetailModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onApprove, 
  onUpdateStatus 
}: OrderDetailModalProps): JSX.Element | null => {
  
  if (!isOpen || !order) return null;

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "N/A";
  };
  
  const parseCurrency = (val: string | number | undefined) => {
    if (val === undefined || val === null) return 0;
    return Number(val);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "APPROVED": return "bg-blue-100 text-blue-700 border-blue-200";
      case "RECEIVED": return "bg-green-100 text-green-700 border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[900px] h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Purchase Order Details</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono text-gray-500 font-bold">{order.code}</span>
                <span className="text-xs text-gray-400">| ID: {order.purchaseOrderId}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
            <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Supplier Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Name:</span> 
                                <span className="font-medium text-gray-900">{order.supplier?.supplierName || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Code:</span> 
                                <span className="font-medium text-gray-900">{order.supplier?.code || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span> 
                                <span className="font-medium text-gray-900">{order.supplier?.email || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Phone:</span> 
                                <span className="font-medium text-gray-900">{order.supplier?.phone || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1 flex justify-between items-center">
                            Order Summary
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Order Date:</span> 
                                <span className="font-medium text-gray-900">{formatDate(order.orderDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Delivery Date:</span> 
                                <span className="font-medium text-gray-900">{formatDate(order.expectedDeliveryDate)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Created By:</span> 
                                <span className="font-medium text-gray-900 flex items-center gap-1">
                                    <User className="w-3 h-3"/> {order.employee?.fullName || "System"}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-100">
                                <span className="text-gray-500">Total Amount:</span> 
                                <span className="font-bold text-blue-700 text-lg">
                                    {parseCurrency(order.totalAmount).toLocaleString('vi-VN')} VND
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" /> Component List
                    </h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <tr>
                                    <th className="p-3 border-b">Component Name</th>
                                    <th className="p-3 border-b text-right">Quantity</th>
                                    <th className="p-3 border-b text-right">Unit Price</th>
                                    <th className="p-3 border-b text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {order.details && order.details.length > 0 ? (
                                    order.details.map((detail, idx) => {
                                      const qty = detail.quantityOrdered || 0;
                                      const price = parseCurrency(detail.unitPrice);
                                      const lineTotal = qty * price;

                                      return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-900">
                                                {detail.componentName || `Item #${detail.componentId}`}
                                                <div className="text-xs text-gray-400 font-normal">
                                                    {detail.code}
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">{qty}</td>
                                            <td className="p-3 text-right">{price.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right font-medium">
                                                {lineTotal.toLocaleString('vi-VN')}
                                            </td>
                                        </tr>
                                      );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                                            No items found in this order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 grid grid-cols-2 gap-4">
                    <div>
                        <span className="block font-bold text-gray-700 text-xs uppercase mb-1">Note</span>
                        {order.note || "No notes provided."}
                    </div>
                    <div className="space-y-1">
                        <p><span className="font-bold text-gray-700">Payment Terms:</span> {order.paymentTerms || "N/A"}</p>
                        <p><span className="font-bold text-gray-700">Delivery Terms:</span> {order.deliveryTerms || "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors">
            <Printer className="w-4 h-4" /> Print
          </button>
          
          {order.status === 'PENDING' && (
            <button 
              onClick={onApprove}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Approve Order
            </button>
          )}

          {order.status === 'APPROVED' && (
             <button 
                onClick={onUpdateStatus}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
             >
               <RefreshCw className="w-4 h-4" /> Mark as Received
             </button>
          )}
        </div>
      </div>
    </div>
  );
};