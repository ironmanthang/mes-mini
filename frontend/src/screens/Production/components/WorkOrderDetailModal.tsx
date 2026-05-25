import { type JSX } from "react";
import { X, Package, Calendar, User, ClipboardList, Box, AlertCircle } from "lucide-react";
import type { WorkOrderDetail } from "../../../services/workOrderServices";

interface WorkOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderDetail | null;
}

export const WorkOrderDetailModal = ({ isOpen, onClose, workOrder }: WorkOrderDetailModalProps): JSX.Element | null => {
  if (!isOpen || !workOrder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{workOrder.code}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                workOrder.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                workOrder.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                workOrder.status === 'RELEASED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                workOrder.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {workOrder.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Detailed manufacturing and fulfillment information.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Section 1: General Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Package className="w-3 h-3" /> Product
              </label>
              <p className="text-sm font-bold text-gray-900">{workOrder.product.productName}</p>
              <p className="text-xs text-gray-500">{workOrder.product.code}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Schedule
              </label>
              <p className="text-sm font-medium text-gray-900">Start: {workOrder.startDate || 'N/A'}</p>
              <p className="text-sm font-medium text-gray-900">End: {workOrder.endDate || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Assigned To
              </label>
              <p className="text-sm font-medium text-gray-900">{workOrder.employee?.fullName || 'Unassigned'}</p>
              <p className="text-xs text-gray-500">Line: {workOrder.productionLine?.lineName || 'N/A'}</p>
            </div>
          </div>

          {/* Section 2: Fulfillment (Linked PRs) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <ClipboardList className="w-4 h-4 text-blue-600" /> Fulfillment Targets
            </h3>
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                  <tr>
                    <th className="p-3">PR Code</th>
                    <th className="p-3 text-center">Target Qty</th>
                    <th className="p-3 text-center">Fulfilled</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workOrder.workOrderFulfillments?.map((f) => (
                    <tr key={f.productionRequestId} className="hover:bg-gray-50">
                      <td className="p-3 font-mono font-medium text-blue-600">{f.productionRequest.code}</td>
                      <td className="p-3 text-center font-bold">{f.quantity}</td>
                      <td className="p-3 text-center font-bold text-green-600">{f.fulfilledQuantity}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          f.productionRequest.status === 'FULFILLED' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}>
                          {f.productionRequest.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Production Output (Batches & Instances) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
              <Box className="w-4 h-4 text-blue-600" /> Production Output
            </h3>
            {workOrder.productionBatches && workOrder.productionBatches.length > 0 ? (
              <div className="space-y-4">
                {workOrder.productionBatches.map((batch) => (
                  <div key={batch.productionBatchId} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-gray-900">{batch.batchCode}</span>
                      <span className="text-xs text-gray-500">Expiry: {batch.expiryDate || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {batch.productInstances?.map((inst) => (
                        <div key={inst.productInstanceId} className="p-2 bg-white border border-gray-200 rounded-lg text-[10px] flex flex-col gap-1">
                          <span className="font-mono font-bold text-gray-700">{inst.serialNumber}</span>
                          <span className={`font-bold ${inst.status === 'PASSED_QC' ? 'text-green-600' : 'text-red-600'}`}>
                            {inst.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 italic text-sm">
                No production output recorded for this order.
              </div>
            )}
          </div>

          {/* Section 4: Notes */}
          {workOrder.note && (
            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 italic">{workOrder.note}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};