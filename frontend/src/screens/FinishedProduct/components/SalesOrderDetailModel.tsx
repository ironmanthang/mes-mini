import { X, Printer, Settings, FileText, CheckCircle, Truck, Package } from "lucide-react";
import { type JSX } from "react";

interface SalesOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export const SalesOrderDetailModal = ({ isOpen, onClose, order }: SalesOrderDetailModalProps): JSX.Element | null => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[900px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-lg">
          <div>
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                    order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                }`}>
                    {order.status}
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">ID: <span className="font-mono font-bold text-gray-700">{order.id}</span> | Date: {order.date}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer" /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
            
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-1">Customer Info</h3>
                    <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-gray-500">Agent:</span> <span className="font-medium">{order.agent}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Contact:</span> <span className="font-medium">Mr. John Doe</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium">(+84) 901 234 567</span></div>
                    </div>
                </div>
                <div className="space-y-4">
                     <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-1">Shipping Info</h3>
                     <div className="text-sm space-y-2">
                        <div className="flex justify-between"><span className="text-gray-500">Delivery Date:</span> <span className="font-medium">{order.deliveryDate}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Address:</span> <span className="font-medium text-right max-w-[200px]">123 Industrial Park, Dist 9, HCMC</span></div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Product List</h3>
                <table className="w-full text-left border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="p-3">Product Name</th>
                            <th className="p-3 text-right">Qty</th>
                            <th className="p-3 text-right">Unit Price</th>
                            <th className="p-3 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y">
                        <tr>
                            <td className="p-3 font-medium">{order.product}</td>
                            <td className="p-3 text-right">{order.quantity}</td>
                            <td className="p-3 text-right">$1,200</td>
                            <td className="p-3 text-right font-medium">${order.totalValue.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td className="p-3 font-medium">Accessories Kit</td>
                            <td className="p-3 text-right">10</td>
                            <td className="p-3 text-right">$50</td>
                            <td className="p-3 text-right font-medium">$500</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Fulfillment Status
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Ready to Ship:</span>
                            <span className="font-bold">45 / {order.quantity}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '45%'}}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors">
                    <h4 className="text-xs font-bold text-purple-800 uppercase mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> Production Link
                    </h4>
                    <p className="text-sm text-purple-700 mb-1">Linked to Production Request:</p>
                    <div className="flex items-center gap-2 font-bold text-purple-900">
                        <Package className="w-4 h-4" /> PR-2025-089
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border 
            border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 cursor-pointer">
                <Printer className="w-4 h-4" /> Print Order
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border 
            border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 cursor-pointer">
                <FileText className="w-4 h-4" /> Generate Invoice
            </button>
            {order.status !== 'Completed' && (
                <button className="flex items-center gap-2 px-6 py-2 bg-green-600 
                text-white font-medium rounded-lg hover:bg-green-500 shadow-md cursor-pointer">
                    <CheckCircle className="w-4 h-4" /> Process Fulfillment
                </button>
            )}
        </div>
      </div>
    </div>
  );
};