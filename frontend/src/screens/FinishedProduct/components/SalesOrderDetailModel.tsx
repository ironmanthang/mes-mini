import { X, Printer, FileText, CheckCircle, Truck, Package, User, Hash, DollarSign, Settings } from "lucide-react";
import { type JSX } from "react";
import { type SalesOrder } from "../../../services/salesOrderServices";

interface SalesOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SalesOrder | null;
}

export const SalesOrderDetailModal = ({ isOpen, onClose, order }: SalesOrderDetailModalProps): JSX.Element | null => {
  if (!isOpen || !order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

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
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" /> ID: <span className="font-mono font-bold text-gray-700">{order.salesOrderId}</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1">
                    Code: <span className="font-mono font-bold text-gray-700">{order.code}</span>
                </span>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-blue-600 cursor-pointer" /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
            
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-1">General Info</h3>
                    <div className="text-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 flex items-center gap-2">
                                <User className="w-4 h-4" /> Agent Name:
                            </span> 
                            <span className="font-medium text-gray-900">{order.agent.agentName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" /> Sales Rep:
                            </span> 
                            <span className="font-medium text-gray-900">{order.employee.fullName}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                     <h3 className="text-sm font-bold text-gray-900 uppercase border-b pb-1">Order Value</h3>
                     <div className="text-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Total Amount:
                            </span> 
                            <span className="font-bold text-lg text-blue-600">
                                {formatCurrency(order.totalAmount)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Status:</span> 
                            <span className="font-medium text-gray-400 italic">Pending (No Data)</span>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Product Summary</h3>
                <div className="border rounded-lg overflow-hidden bg-gray-50 p-8 text-center">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium">Order details are not available in the current API response.</p>
                    <p className="text-xs text-gray-400 mt-1">Please update `SalesOrder` interface to include `details[]`.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-800 uppercase mb-2 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Fulfillment Status
                    </h4>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Estimated Status:</span>
                            <span className="font-bold">{order.status}</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full" 
                                style={{
                                    width: order.status === 'Completed' ? '100%' : 
                                           order.status === 'Processing' ? '50%' : '10%'
                                }}>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <h4 className="text-xs font-bold text-purple-800 uppercase mb-2 flex items-center gap-2">
                        <Settings className="w-4 h-4" /> System Info
                    </h4>
                    <p className="text-sm text-purple-700 mb-1">Internal Reference Code:</p>
                    <div className="flex items-center gap-2 font-bold text-purple-900 font-mono">
                        <Package className="w-4 h-4" /> {order.code}
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border 
            border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 cursor-pointer">
                <Printer className="w-4 h-4" /> Print
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border 
            border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 cursor-pointer">
                <FileText className="w-4 h-4" /> Invoice
            </button>
            {order.status !== 'Completed' && (
                <button className="flex items-center gap-2 px-6 py-2 bg-green-600 
                text-white font-medium rounded-lg hover:bg-green-500 shadow-md cursor-pointer">
                    <CheckCircle className="w-4 h-4" /> Process
                </button>
            )}
        </div>
      </div>
    </div>
  );
};