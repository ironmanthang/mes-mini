import { 
  X, CheckCircle, Printer, User, Package, Paperclip, Loader2, Download, FileText, QrCode
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { purchaseOrderService, type PurchaseOrder, type Attachment, type ComponentLot } from "../../../services/purchaseOrderServices";
import { hasPermission } from "../../../lib/auth";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onApprove: () => void;
}

export const OrderDetailModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onApprove, 
}: OrderDetailModalProps): JSX.Element | null => {

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [lots, setLots] = useState<ComponentLot[]>([]);
  const [isLoadingLots, setIsLoadingLots] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLots = async () => {
      if (!order?.purchaseOrderId) return;
      if (order.status !== 'RECEIVING' && order.status !== 'COMPLETED') {
        setLots([]);
        return;
      }
      
      setIsLoadingLots(true);
      setLots([]); 

      try {
        const data = await purchaseOrderService.getLotsByPO(order.purchaseOrderId);
        if (isMounted) {
          setLots(data);
        }
      } catch (err) {
        console.error("Failed to fetch lots:", err);
      } finally {
        if (isMounted) {
          setIsLoadingLots(false);
        }
      }
    };

    if (isOpen) {
      fetchLots();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, order?.purchaseOrderId, order?.status]);

  const handlePrintLot = (lot: ComponentLot) => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép popup để sử dụng tính năng in.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Lot Label</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            @media print {
              @page {
                margin: 10mm;
              }
            }
            .label-card {
              width: 100%;
              height: 100vh;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              page-break-after: always;
            }
            .label-card:last-child {
              page-break-after: auto;
            }
            .qr-code {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .qr-code canvas, .qr-code img {
              width: 65vw !important;
              height: 65vw !important;
              max-width: 500px;
              max-height: 500px;
            }
            .lot-code {
              margin-top: 16px;
              font-size: 20px;
              font-family: monospace;
              font-weight: bold;
              white-space: nowrap;
              letter-spacing: 1px;
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
          <div class="label-card">
            <div class="qr-code" data-code="${lot.lotCode}"></div>
            <div class="lot-code">${lot.lotCode}</div>
          </div>
          <script>
            window.onload = function() {
              document.querySelectorAll('.qr-code').forEach(function(el) {
                new QRCode(el, {
                  text: el.getAttribute('data-code'),
                  width: 400,
                  height: 400,
                  colorDark : "#000000",
                  colorLight : "#ffffff",
                  correctLevel : QRCode.CorrectLevel.H
                });
              });
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAllLots = () => {
    if (lots.length === 0) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép popup để sử dụng tính năng in.");
      return;
    }

    const labelsHTML = lots.map(lot => `
      <div class="label-card">
        <div class="qr-code" data-code="${lot.lotCode}"></div>
        <div class="lot-code">${lot.lotCode}</div>
      </div>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Lot Labels</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: white;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            @media print {
              @page {
                margin: 10mm;
              }
            }
            .label-card {
              width: 100%;
              height: 100vh;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              page-break-after: always;
            }
            .label-card:last-child {
              page-break-after: auto;
            }
            .qr-code {
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .qr-code canvas, .qr-code img {
              width: 65vw !important;
              height: 65vw !important;
              max-width: 500px;
              max-height: 500px;
            }
            .lot-code {
              margin-top: 16px;
              font-size: 20px;
              font-family: monospace;
              font-weight: bold;
              white-space: nowrap;
              letter-spacing: 1px;
            }
          </style>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
          ${labelsHTML}
          <script>
            window.onload = function() {
              document.querySelectorAll('.qr-code').forEach(function(el) {
                new QRCode(el, {
                  text: el.getAttribute('data-code'),
                  width: 400,
                  height: 400,
                  colorDark : "#000000",
                  colorLight : "#ffffff",
                  correctLevel : QRCode.CorrectLevel.H
                });
              });
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAttachments = async () => {
      if (!order?.purchaseOrderId) return;
      
      setIsLoadingAttachments(true);
      setAttachments([]); 

      try {
        const data = await purchaseOrderService.getAttachmentsByPO(order.purchaseOrderId);
        if (isMounted) {
          setAttachments(data);
        }
      } catch (err) {
        console.error("Failed to fetch attachments:", err);
      } finally {
        if (isMounted) {
          setIsLoadingAttachments(false);
        }
      }
    };

    if (isOpen) {
      fetchAttachments();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, order?.purchaseOrderId]);

  if (!isOpen || !order) return null;

  const formatDate = (dateString?: string) => {
    return dateString ? new Date(dateString).toLocaleDateString("vi-VN") : "N/A";
  };
  
  const formatCurrency = (val: any): string => {
    if (val === undefined || val === null) return "0\u00a0\u20ab";
    const numberVal = Number(val);
    if (isNaN(numberVal)) return "0\u00a0\u20ab";
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numberVal);
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
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @media print { @page { margin: 15mm; } }
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
    }, 2000);
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
                                    {formatCurrency(order.totalAmount)}
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
                                      const price = Number(detail.unitPrice) || 0;
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
                                            <td className="p-3 text-right">{formatCurrency(price)}</td>
                                            <td className="p-3 text-right font-medium">
                                                {formatCurrency(lineTotal)}
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
                        <p><span className="font-bold text-gray-700">Shipping Cost:</span> {formatCurrency(order.shippingCost)}</p>
                        <p><span className="font-bold text-gray-700">Note:</span> {order.note || "N/A"}</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 border-t border-gray-100 pt-6">
                        <Paperclip className="w-4 h-4 text-blue-500" /> Attached Documents
                    </h3>
                    
                    {isLoadingAttachments ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading attachments...
                        </div>
                    ) : attachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {attachments.map(att => (
                                <div key={att.attachmentId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:border-blue-200 transition-colors group">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded flex items-center justify-center flex-shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={att.fileName}>{att.fileName}</p>
                                            <p className="text-xs text-gray-500">
                                              {att.category} • {new Date(att.uploadedAt).toLocaleDateString('vi-VN')}
                                            </p>
                                        </div>
                                    </div>
                                    <a 
                                        href={att.downloadUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-blue-600 
                                        hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                        title="Download / View"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic p-6 bg-gray-50 rounded-lg border border-gray-100 border-dashed text-center flex flex-col items-center justify-center">
                            <Paperclip className="w-6 h-6 mb-2 opacity-20" />
                            No documents attached to this order.
                        </div>
                    )}
                </div>

                {(order.status === 'RECEIVING' || order.status === 'COMPLETED') && (
                  <div className="border-t border-gray-100 pt-6 print:hidden">
                      <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                              <QrCode className="w-4 h-4 text-blue-500" /> Generated Lot Labels (Barcodes)
                          </h3>
                          {lots.length > 0 && (
                            <button
                              onClick={handlePrintAllLots}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                            >
                              <Printer className="w-3.5 h-3.5" /> Print All Labels
                            </button>
                          )}
                      </div>
                      
                      {isLoadingLots ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                              <Loader2 className="w-4 h-4 animate-spin" /> Loading generated lots...
                          </div>
                      ) : lots.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {lots.map(lot => (
                                  <div key={lot.lotCode} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-white hover:border-blue-200 transition-colors group">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded flex items-center justify-center flex-shrink-0">
                                              <QrCode className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                              <p className="text-sm font-mono font-bold text-gray-900 truncate" title={lot.lotCode}>{lot.lotCode}</p>
                                              <p className="text-xs text-gray-500 truncate">
                                                {lot.component?.componentName} • Qty: {lot.quantity}
                                              </p>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => handlePrintLot(lot)}
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                          title="Print Label"
                                      >
                                          <Printer className="w-4 h-4" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-sm text-gray-500 italic p-6 bg-gray-50 rounded-lg border border-gray-100 border-dashed text-center flex flex-col items-center justify-center">
                              <QrCode className="w-6 h-6 mb-2 opacity-20" />
                              No lot labels generated for this order.
                          </div>
                      )}
                  </div>
                )}

            </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-lg">
          <button 
            onClick={handlePrint} 
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          
          {(hasPermission("PO_APPROVE") && order.status === 'PENDING') && (
            <button 
              onClick={onApprove}
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-500 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <CheckCircle className="w-4 h-4" /> Approve Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
};