import { 
  X, CheckCircle, Printer, User, Package
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
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ORDERED': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'RECEIVING': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-order-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      alert("Vui lòng cho phép popup để sử dụng tính năng in.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase_Order_${order.code}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Ép trình duyệt in cả background colors (màu nền của badge, table header) */
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            @media print {
              @page { margin: 15mm; }
            }
          </style>
        </head>
        <body class="p-8 bg-white text-black">
          <div class="mb-8 pb-4 border-b-2 border-gray-800 flex justify-between items-end">
             <div>
               <h1 class="text-3xl font-bold text-gray-900">PURCHASE ORDER</h1>
               <p class="text-gray-500 mt-1">Code: <span class="text-black font-bold">${order.code}</span></p>
             </div>
             <div class="text-right text-sm text-gray-500">
               <p>Date Printed: ${new Date().toLocaleDateString('vi-VN')}</p>
             </div>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
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

        <div className="flex-1 overflow-y-auto p-8" id="printable-order-content">
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
                                <span className="font-medium text-gray-900">{order.supplier?.phoneNumber || "N/A"}</span>
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
                                    ${parseCurrency(order.totalAmount).toLocaleString('vi-VN')}
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
                                    <th className="p-3 border-b text-center">Ordered</th>
                                    <th className="p-3 border-b text-center">Received</th>
                                    <th className="p-3 border-b text-right">Unit Price</th>
                                    <th className="p-3 border-b text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-gray-100">
                                {order.details && order.details.length > 0 ? (
                                    order.details.map((detail, idx) => {
                                      const qtyOrd = detail.quantityOrdered || 0;
                                      const qtyRec = detail.quantityReceived || 0;
                                      const price = parseCurrency(detail.unitPrice);
                                      const lineTotal = qtyOrd * price;

                                      return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium text-gray-900">
                                                {detail.component?.componentName || `Item #${detail.componentId}`}
                                                <div className="text-xs text-gray-500">{detail.component?.code}</div>
                                            </td>
                                            <td className="p-3 text-center">{qtyOrd}</td>
                                            <td className="p-3 text-center">
                                              <span className={qtyRec < qtyOrd ? "text-orange-600 font-medium" : "text-green-600 font-bold"}>
                                                {qtyRec}
                                              </span>
                                            </td>
                                            <td className="p-3 text-right">${price.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right font-medium">
                                                ${lineTotal.toLocaleString('vi-VN')}
                                            </td>
                                        </tr>
                                      );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                                            No items found in this order.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 grid grid-cols-2 gap-4 border border-gray-100">
                    <div className="space-y-2">
                        <p><span className="font-bold text-gray-700">Payment Terms:</span> {order.paymentTerms || "N/A"}</p>
                        <p><span className="font-bold text-gray-700">Delivery Terms:</span> {order.deliveryTerms || "N/A"}</p>
                        <p><span className="font-bold text-gray-700">Priority:</span> {order.priority || "NORMAL"}</p>
                    </div>
                    <div className="space-y-2">
                        <p><span className="font-bold text-gray-700">Tax Rate:</span> {order.taxRate ? `${order.taxRate}%` : "0%"}</p>
                        <p><span className="font-bold text-gray-700">Shipping Cost:</span> ${parseCurrency(order.shippingCost).toLocaleString('vi-VN')}</p>
                        <p><span className="font-bold text-gray-700">Note:</span> {order.note || "N/A"}</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button 
            onClick={handlePrint} 
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors"
          >
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

          {(order.status === 'ORDERED' || order.status === 'RECEIVING') && (
             <button 
                onClick={onUpdateStatus}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-500 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
             >
               <Package className="w-4 h-4" /> Receive Goods
             </button>
          )}
        </div>
      </div>
    </div>
  );
};