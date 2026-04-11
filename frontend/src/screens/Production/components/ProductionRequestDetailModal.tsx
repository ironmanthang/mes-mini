import { 
  X, Package, Calendar, User, FileText, 
  Loader2, Tag, Printer, CheckCircle2, AlertTriangle, PlayCircle 
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductionRequestServices, type ProductionRequest } from "../../../services/productionRequestServices";

interface ProductionRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: number | null;
}

export const ProductionRequestDetailModal = ({ isOpen, onClose, requestId }: ProductionRequestDetailModalProps): JSX.Element | null => {
  const [requestData, setRequestData] = useState<ProductionRequest | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!requestId) return;
      
      setIsLoading(true);
      setRequestData(null);

      try {
        const data = await ProductionRequestServices.getProductionRequestById(requestId);
        if (isMounted) {
          setRequestData(data);
        }
      } catch (err) {
        console.error("Failed to load request details", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (isOpen) {
      fetchDetails();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, requestId]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle2 className="w-4 h-4"/> Approved</span>;
      case 'WAITING_MATERIAL': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200"><AlertTriangle className="w-4 h-4"/> Waiting Material</span>;
      case 'IN_PROGRESS': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><PlayCircle className="w-4 h-4"/> In Progress</span>;
      case 'FULFILLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">Fulfilled</span>;
      case 'CANCELLED': 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">Cancelled</span>;
      default: 
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">{status || 'N/A'}</span>;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded';
      case 'MEDIUM': return 'text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded';
      case 'LOW': return 'text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded';
      default: return 'text-gray-600';
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
          <title>Purchase_Order_${requestData?.code}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print { @page { margin: 15mm; } }
          </style>
        </head>
        <body class="p-8 bg-white text-black">
          <div class="mb-8 pb-4 border-b-2 border-gray-800 flex justify-between items-end">
             <div>
               <h1 class="text-3xl font-bold text-gray-900">PURCHASE ORDER</h1>
               <p class="text-gray-500 mt-1">Code: <span class="text-black font-bold">${requestData?.code}</span></p>
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

  if (!isOpen || !requestId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[800px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Production Request Details
            </h2>
            <div className="flex items-center gap-3 mt-2">
                <span className="font-mono font-bold text-gray-600">{requestData?.code || 'Loading...'}</span>
                {requestData && getStatusBadge(requestData.status)}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1" id="printable-order-content">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : requestData ? (
            <>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-500" /> General Information
                  </h3>
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Request Type:</span> 
                        <span className="font-bold text-gray-900">
                            {requestData.soDetailId ? 'MTO (Sales Order)' : 'MTS (Make to Stock)'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Priority:</span> 
                        <span className={getPriorityColor(requestData.priority)}>{requestData.priority}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Request Date:</span> 
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(requestData.requestDate)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Due Date:</span> 
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> {formatDate(requestData.dueDate)}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Created By:</span> 
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {requestData.employee?.fullName || 'System'}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" /> Target Product
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm space-y-3">
                    <div>
                        <span className="text-blue-800 text-xs uppercase font-bold block mb-0.5">Product Name</span>
                        <span className="font-bold text-gray-900 text-base">{requestData.product?.productName || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-200/50">
                        <div>
                            <span className="text-blue-800 text-xs uppercase font-bold block mb-0.5">Product Code</span>
                            <span className="font-mono font-medium text-gray-700">{requestData.product?.code || 'N/A'}</span>
                        </div>
                        <div>
                            <span className="text-blue-800 text-xs uppercase font-bold block mb-0.5">Quantity</span>
                            <span className="font-bold text-blue-700 text-lg">
                                {requestData.quantity} <span className="text-sm font-normal text-blue-600">{requestData.product?.unit}</span>
                            </span>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-200 pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" /> Notes & Remarks
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                      {requestData.note || <span className="text-gray-400 italic">No additional notes provided.</span>}
                  </div>
              </div>

            </>
          ) : (
            <div className="text-center text-red-500 py-10">Error loading data.</div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white 
            border border-gray-300 text-gray-700 font-medium rounded-lg 
            hover:bg-gray-100 cursor-pointer transition-colors shadow-sm" onClick={handlePrint}>
                <Printer className="w-4 h-4" /> Print Request
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-sm cursor-pointer">
                Close
            </button>
        </div>

      </div>
    </div>
  );
};