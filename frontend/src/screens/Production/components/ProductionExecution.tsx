import {
  Search, PlayCircle, Loader2, Factory, Calendar, PackageCheck, AlertCircle
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { WorkOrderServices, type WorkOrderListItem } from "../../../services/workOrderServices";
import { RecordOutputModal } from "./RecordOutputModal";

export const ProductionExecution = (): JSX.Element => {
  const [workOrders, setWorkOrders] = useState<WorkOrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedWO, setSelectedWO] = useState<WorkOrderListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchActiveWorkOrders = async () => {
    setIsLoading(true);
    try {
      const response = await WorkOrderServices.getAllWorkOrders({
        limit: 500,
        status: 'IN_PROGRESS'
      });
      setWorkOrders(response.data || []);
    } catch (error) {
      console.error("Failed to fetch active work orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveWorkOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return workOrders.filter(wo => {
      const q = searchQuery.toLowerCase();
      return wo.code.toLowerCase().includes(q) || wo.product.productName.toLowerCase().includes(q);
    });
  }, [workOrders, searchQuery]);

  const renderMRStatus = (status: string | undefined) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
            <PackageCheck className="w-3 h-3" /> ISSUED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
            <AlertCircle className="w-3 h-3" /> PENDING
          </span>
        );
      default:
        return <span className="text-xs text-gray-400 italic">No Request</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">

        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Factory className="w-6 h-6 text-blue-600" />
              Active Work Orders
            </h2>
            <p className="text-sm text-gray-500 mt-1">List of work orders currently being executed on the shop floor.</p>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search WO Code, Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="p-4">WO Code</th>
                  <th className="p-4">Product Info</th>
                  <th className="p-4 text-center">Target Qty</th>
                  <th className="p-4">Start Date</th>
                  <th className="p-4 text-center">Material Request Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((wo) => {
                    const mrStatus = wo.materialRequest?.status;

                    return (
                      <tr key={wo.workOrderId} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-mono font-bold text-gray-900">{wo.code}</td>

                        <td className="p-4">
                          <span className="font-bold text-gray-800 block">{wo.product.productName}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">{wo.product.code}</span>
                        </td>

                        <td className="p-4 text-center font-bold text-gray-700">
                          {wo.quantity} <span className="text-[10px] font-normal text-gray-400">{wo.product.unit}</span>
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-3.5 h-3.5" />
                            {wo.startDate ? new Date(wo.startDate).toLocaleDateString('en-US') : 'N/A'}
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          {renderMRStatus(mrStatus)}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => { setSelectedWO(wo); setIsModalOpen(true); }}
                            className="flex items-center justify-center mx-auto gap-1.5 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm text-xs cursor-pointer active:scale-95"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> Record Output
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 italic">
                      No work orders are currently in progress.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedWO && (
        <RecordOutputModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedWO(null); }}
          onSuccess={fetchActiveWorkOrders}
          workOrder={selectedWO}
        />
      )}
    </div>
  );
};