import { X, Printer, FileText, CheckCircle, Truck, AlertTriangle, User, Calendar } from "lucide-react";
import { type JSX } from "react";
import type { SalesOrderDetail } from "../../../services/salesOrdersServices";

interface SalesOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SalesOrderDetail | null;
}

export const SalesOrderDetailModal = ({ isOpen, onClose, order }: SalesOrderDetailModalProps): JSX.Element | null => {
  if (!isOpen || !order) return null;

  const formatDate = (dateString?: string | null) => {
      return dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "N/A";
  };
  
  const parseCurrency = (val: string | number | undefined) => {
      return Number(val) || 0;
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case "COMPLETED": return "bg-green-100 text-green-700 border-green-200";
          case "IN_PROGRESS": return "bg-blue-100 text-blue-700 border-blue-200";
          case "APPROVED": return "bg-purple-100 text-purple-700 border-purple-200";
          case "PENDING_APPROVAL": return "bg-yellow-100 text-yellow-700 border-yellow-200";
          case "DRAFT": return "bg-gray-100 text-gray-700 border-gray-200";
          case "CANCELLED": return "bg-red-100 text-red-700 border-red-200";
          default: return "bg-gray-100 text-gray-700 border-gray-200";
      }
  };

  const totalOrdered = order.details?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalShipped = order.details?.reduce((sum, item) => sum + item.quantityShipped, 0) || 0;
  const fulfillmentPercent = totalOrdered > 0 ? Math.round((totalShipped / totalOrdered) * 100) : 0;

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
          <title>Sales_Order_${order.code}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print { @page { margin: 15mm; } }
          </style>
        </head>
        <body class="p-8 bg-white text-black">
          <div class="mb-8 pb-4 border-b-2 border-gray-800 flex justify-between items-end">
             <div>
               <h1 class="text-3xl font-bold text-gray-900">SALES ORDER</h1>
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
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[1000px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-lg">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Sales Order Details</h2>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${getStatusColor(order.status)}`}>
                    {order.status}
                </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="font-mono font-bold text-gray-700">{order.code}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(order.orderDate)}</span>
                <span className="flex items-center gap-1"><User className="w-4 h-4" /> {order.employee?.fullName}</span>
            </div>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-blue-600 cursor-pointer transition-colors" /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1" id="printable-order-content">
            
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2">Customer Info</h3>
                    <div className="text-sm space-y-2.5">
                        <div className="flex justify-between"><span className="text-gray-500">Agent Name:</span> <span className="font-bold text-gray-900">{order.agent?.agentName}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Agent Code:</span> <span className="font-medium">{order.agent?.code}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium">{order.agent?.phoneNumber}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Address:</span> <span className="font-medium text-right max-w-[250px]">{order.agent?.address}</span></div>
                    </div>
                </div>
                <div className="space-y-4">
                     <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2">Order Info</h3>
                     <div className="text-sm space-y-2.5">
                        <div className="flex justify-between"><span className="text-gray-500">Priority:</span> <span className="font-medium">{order.priority}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Delivery Date:</span> <span className="font-medium">{formatDate(order.expectedShipDate)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Payment Terms:</span> <span className="font-medium">{order.paymentTerms || "N/A"}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Approved By:</span> <span className="font-medium">{order.approver?.fullName || "Not Approved"}</span></div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Product List</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-3">Product Name</th>
                                <th className="p-3 text-center">Unit</th>
                                <th className="p-3 text-right">Ordered</th>
                                <th className="p-3 text-right">Shipped</th>
                                <th className="p-3 text-right">Unit Price</th>
                                <th className="p-3 text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-100">
                            {order.details && order.details.length > 0 ? (
                                order.details.map((item) => {
                                    const qty = item.quantity || 0;
                                    const price = parseCurrency(item.salePrice);
                                    const lineTotal = qty * price;

                                    return (
                                        <tr key={item.soDetailId} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3">
                                                <span className="font-bold text-gray-900 block">{item.product?.productName}</span>
                                                <span className="text-xs text-gray-500">{item.product?.code}</span>
                                            </td>
                                            <td className="p-3 text-center text-gray-600">{item.product?.unit}</td>
                                            <td className="p-3 text-right font-medium">{qty}</td>
                                            <td className="p-3 text-right">
                                                <span className={`${item.quantityShipped >= qty ? 'text-green-600 font-bold' : 'text-blue-600'}`}>
                                                    {item.quantityShipped}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-gray-600">{price.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right font-bold text-gray-900">{lineTotal.toLocaleString('vi-VN')}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={6} className="p-6 text-center text-gray-400 italic">No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 items-end">
                <div className="space-y-4">
                    {order.hasShortage && (
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-red-800">Inventory Shortage Detected</h4>
                                <p className="text-xs text-red-600 mt-1">Some products in this order do not have enough available stock. Production might be required.</p>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" /> Fulfillment Progress
                        </h4>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-blue-900">Shipped vs Ordered:</span>
                                <span className="font-bold text-blue-900">{totalShipped} / {totalOrdered}</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{width: `${fulfillmentPercent}%`}}></div>
                            </div>
                        </div>
                    </div>
                    
                    {order.note && (
                        <div className="text-sm bg-yellow-50 p-3 rounded-md border border-yellow-100 text-yellow-800">
                            <span className="font-bold">Note: </span>{order.note}
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Discount:</span>
                        <span>- {parseCurrency(order.discount).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax:</span>
                        <span>+ {parseCurrency(order.tax).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Shipping Fee:</span>
                        <span>+ {parseCurrency(order.agentShippingPrice).toLocaleString('vi-VN')} ₫</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-base font-bold text-gray-900">Grand Total:</span>
                        <span className="text-xl font-bold text-blue-600">{parseCurrency(order.totalAmount).toLocaleString('vi-VN')} ₫</span>
                    </div>
                </div>
            </div>

        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
            <button className="flex items-center gap-2 px-4 py-2 
            bg-white border border-gray-300 text-gray-700 font-medium 
            rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-sm"
            onClick={handlePrint}>
                <Printer className="w-4 h-4" /> Print Order
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 cursor-pointer transition-colors shadow-sm">
                <FileText className="w-4 h-4" /> Generate Invoice
            </button>
            
            {(order.status === 'APPROVED' || order.status === 'IN_PROGRESS') && fulfillmentPercent < 100 && (
                <button className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 shadow-md cursor-pointer transition-colors">
                    <CheckCircle className="w-4 h-4" /> Process Fulfillment
                </button>
            )}
        </div>
      </div>
    </div>
  );
};