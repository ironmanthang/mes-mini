import { X, CheckCircle, RefreshCw, Printer, User, Clock } from "lucide-react";
import type { JSX } from "react";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onApprove: (id: string) => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export const OrderDetailModal = ({ isOpen, onClose, order, onApprove, onUpdateStatus }: OrderDetailModalProps): JSX.Element | null => {
  if (!isOpen || !order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Approved": return "bg-blue-100 text-blue-700 border-blue-200";
      case "Received": return "bg-green-100 text-green-700 border-green-200";
      case "Cancelled": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[900px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Purchase Order Details</h2>
            <p className="text-sm text-gray-500">{order.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Supplier Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{order.supplier}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Contact Person:</span> <span className="font-medium text-gray-900">{order.supplierInfo?.contact}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{order.supplierInfo?.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone:</span> <span className="font-medium text-gray-900">{order.supplierInfo?.phone}</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-blue-600 uppercase border-b border-blue-100 pb-1">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Order Date:</span> <span className="font-medium text-gray-900">{order.date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Created By:</span> <span className="font-medium text-gray-900 flex items-center gap-1"><User className="w-3 h-3"/> {order.createdBy}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Amount:</span> <span className="font-bold text-blue-700 text-lg">${order.amount.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">Component List</h3>
            <table className="w-full text-left border-collapse border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                <tr>
                  <th className="p-3 border-b">Component Name</th>
                  <th className="p-3 border-b text-right">Quantity</th>
                  <th className="p-3 border-b text-right">Unit Price</th>
                  <th className="p-3 border-b text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {order.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{item.name}</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right">${item.price}</td>
                    <td className="p-3 text-right font-medium">${(item.quantity * item.price).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
             <h3 className="text-sm font-bold text-gray-900 mb-3">History Log</h3>
             <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                {order.history?.map((log: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500">{log.date} by {log.user}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          
          {order.status === 'Pending' && (
            <button 
              onClick={() => { onApprove(order.id); onClose(); }}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approve Order
            </button>
          )}

          {order.status === 'Approved' && (
            <button 
               onClick={() => { onUpdateStatus(order.id, "Received"); onClose(); }}
               className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-500 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Mark as Received
            </button>
          )}
        </div>
      </div>
    </div>
  );
};