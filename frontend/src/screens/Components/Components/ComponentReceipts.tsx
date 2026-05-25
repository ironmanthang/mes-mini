import { 
  PackageCheck, Search, Building2, Calendar, User, 
  MapPin, CheckCircle, UploadCloud, X, Loader2, FileText, Paperclip,
  Printer
} from "lucide-react";
import { useState, useEffect, useRef, type JSX } from "react";
import { purchaseOrderService, type PurchaseOrder } from "../../../services/purchaseOrderServices";
import { WarehouseServices, type Warehouse } from "../../../services/warehouseServices";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";

interface ReceiptItem {
  componentId: number;
  remainingQty: number;
  receivingQty: number;
}

export const ComponentReceipts = (): JSX.Element => {
  const [validPOs, setValidPOs] = useState<PurchaseOrder[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  
  const [selectedPoId, setSelectedPoId] = useState<number | "">("");
  const [poDetails, setPoDetails] = useState<PurchaseOrder | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | "">("");
  
  const [receiptItems, setReceiptItems] = useState<Record<number, ReceiptItem>>({});
  const [note, setNote] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoadingInit, setIsLoadingInit] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showWarning, setShowWarning] = useState(false);
  const [messageWarning, setMessageWarning] = useState("");

  const [receivedLots, setReceivedLots] = useState<{
    lotCode: string;
    componentId: number;
    initialQuantity: number;
    componentName?: string;
    componentCode?: string;
  }[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{"fullName": "Current User"}');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [poRes, whRes] = await Promise.all([
          purchaseOrderService.getAllPOs({ limit: 1000 }),
          WarehouseServices.getAllWarehouse({ type: 'COMPONENT' })
        ]);

        const filteredPOs = (poRes.data || []).filter(po => 
          po.status === 'ORDERED' || po.status === 'RECEIVING'
        );
        setValidPOs(filteredPOs);
        setWarehouses((whRes as any).data || whRes || []);
      } catch (error) {
        console.error("Failed to init data:", error);
      } finally {
        setIsLoadingInit(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchPODetails = async () => {
      if (!selectedPoId) {
        setPoDetails(null);
        setReceiptItems({});
        return;
      }

      setIsLoadingDetails(true);
      try {
        const details = await purchaseOrderService.getPOById(Number(selectedPoId));
        setPoDetails(details);
        
        if (details.warehouseId) {
            setSelectedWarehouseId(details.warehouseId);
        }

        const initialItems: Record<number, ReceiptItem> = {};
        if (details.details?.forEach(item => {
          const remaining = item.quantityOrdered - item.quantityReceived;
          if (remaining > 0) {
            initialItems[item.componentId] = {
              componentId: item.componentId,
              remainingQty: remaining,
              receivingQty: remaining,
            };
          }
        })) {
        }
        setReceiptItems(initialItems);

      } catch (error) {
        console.error("Failed to fetch PO details", error);
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchPODetails();
  }, [selectedPoId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWarning(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [showWarning]);


  const handleQuantityChange = (componentId: number, value: string) => {
    const qty = parseInt(value) || 0;
    
    setReceiptItems(prev => {
      const item = prev[componentId];
      let validQty = Math.max(0, qty);
      validQty = Math.min(validQty, item.remainingQty);

      return { ...prev, [componentId]: { ...item, receivingQty: validQty } };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const uniqueFiles = newFiles.filter(nf => 
        !attachedFiles.some(ef => ef.name === nf.name && ef.size === nf.size)
      );
      setAttachedFiles(prev => [...prev, ...uniqueFiles]);
      e.target.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedWarehouseId) {
      {
        setShowWarning(true);
        setMessageWarning("Please select a destination warehouse");
        return;
      }
    }

    const itemsToReceive = Object.values(receiptItems).filter(i => i.receivingQty > 0);
    
    if (itemsToReceive.length === 0) {
      {
        setShowWarning(true);
        setMessageWarning("No products were received. Please check the Receiving Quantity.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const poId = Number(selectedPoId);

      // 1. Upload and register all attachments first while PO is still in ORDERED/RECEIVING status
      const uploadedAttachments: { fileKey: string; fileName: string }[] = [];
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          try {
            const reqRes = await purchaseOrderService.requestAttachmentUpload(poId, {
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              category: "OTHER"
            });
            await purchaseOrderService.uploadFileToR2(reqRes.uploadUrl, file);
            await purchaseOrderService.confirmAttachmentUpload(poId, {
              fileKey: reqRes.fileKey,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              category: "OTHER"
            });
            uploadedAttachments.push({ fileKey: reqRes.fileKey, fileName: file.name });
          } catch (fileErr) {
            console.error(`Lỗi upload file ${file.name}:`, fileErr);
            throw new Error(`Failed to upload evidence attachment: ${file.name}. Goods receipt aborted.`);
          }
        }
      }

      // 2. Once all attachments are successfully registered, proceed to confirm receipt
      const payload = {
        items: itemsToReceive.map(item => ({
          componentId: item.componentId,
          initialQuantity: item.receivingQty,
          warehouseId: Number(selectedWarehouseId)
        }))
      };

      const res = await purchaseOrderService.receiveGoods(poId, payload);

      const lotsWithDetails = res.generatedLots.map(lot => {
        const detailItem = poDetails?.details?.find(d => d.componentId === lot.componentId);
        return {
          lotCode: lot.lotCode,
          componentId: lot.componentId,
          initialQuantity: lot.quantity,
          componentName: detailItem?.component?.componentName || `Component #${lot.componentId}`,
          componentCode: detailItem?.component?.code || `COMP-${lot.componentId}`
        };
      });

      setReceivedLots(lotsWithDetails);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setShowPrintModal(true); // Open print modal instead of resetting immediately
      }, 1500);

    } catch (error: any) {
      alert(error.message || error?.response?.data?.message || "Lỗi khi nhập kho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClosePrintModal = () => {
    setShowPrintModal(false);
    setReceivedLots([]);
    setSelectedPoId("");
    setPoDetails(null);
    setAttachedFiles([]);
    setNote("");
    purchaseOrderService.getAllPOs({ limit: 1000 }).then(res => {
       setValidPOs((res.data || []).filter(po => po.status === 'ORDERED' || po.status === 'RECEIVING'));
    });
  };

  const handlePrintLabels = () => {
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép popup để sử dụng tính năng in.");
      return;
    }

    const labelsHTML = receivedLots.map(lot => `
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


  if (isLoadingInit) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="space-y-6 pb-12 fade-in">
      
      <div className="mb-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
           <PackageCheck className="w-6 h-6 text-blue-600" /> Component Goods Receipt
        </h2>
        <p className="text-sm text-gray-500 mt-1">Process incoming shipments and register them into inventory.</p>
      </div>

      <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
        <label className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-gray-400" /> Select Purchase Order
        </label>
        <select 
            value={selectedPoId} 
            onChange={(e) => setSelectedPoId(Number(e.target.value))}
            className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-gray-50"
        >
            <option value="">-- Search or Select an Ordered PO --</option>
            {validPOs.map(po => (
                <option key={po.purchaseOrderId} value={po.purchaseOrderId}>
                    {po.code} - {po.supplier?.supplierName} (Status: {po.status})
                </option>
            ))}
        </select>
        {validPOs.length === 0 && (
            <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">
                No orders are currently expecting delivery.
            </p>
        )}
      </div>

      {isLoadingDetails ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500"/></div>
      ) : poDetails ? (
        <>
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-3 mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500"/> Receipt Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">PO Code</label>
                        <p className="text-sm font-bold text-gray-900 mt-1">{poDetails.code}</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Order Date</label>
                        <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(poDetails.orderDate).toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Supplier</label>
                        <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {poDetails.supplier?.supplierName || "N/A"}
                        </p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Receiver (Staff)</label>
                        <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-gray-400" />
                            {currentUser.fullName}
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5 mb-2">
                        <MapPin className="w-4 h-4" /> Destination Warehouse <span className="text-red-500">*</span>
                    </label>
                    <select 
                        value={selectedWarehouseId}
                        onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer bg-white"
                    >
                        <option value="">-- Select Storage Location --</option>
                        {warehouses.map(wh => (
                            <option key={wh.warehouseId} value={wh.warehouseId}>{wh.warehouseName}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                 <h3 className="text-sm font-bold text-gray-900">Items Expected</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <tr>
                            <th className="p-4">Component Name</th>
                            <th className="p-4 text-center">Unit</th>
                            <th className="p-4 text-center text-blue-600">Ordered</th>
                            <th className="p-4 text-center text-green-600">Received</th>
                            <th className="p-4 text-center text-orange-600">Remaining</th>
                            <th className="p-4 text-center bg-blue-50 w-40">Receiving Qty</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                        {poDetails.details?.map(item => {
                            const remaining = item.quantityOrdered - item.quantityReceived;
                            if (remaining <= 0) return null;
    const state = receiptItems[item.componentId];
                            if (!state) return null;

                            return (
                                <tr key={item.componentId} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{item.component?.componentName}</p>
                                        <p className="text-xs text-gray-500">{item.component?.code}</p>
                                    </td>
                                    <td className="p-4 text-center text-gray-600">{item.component?.unit}</td>
                                    <td className="p-4 text-center font-medium text-gray-900">{item.quantityOrdered}</td>
                                    <td className="p-4 text-center font-medium text-gray-900">{item.quantityReceived}</td>
                                    <td className="p-4 text-center font-bold text-orange-600">{remaining}</td>
                                    <td className="p-4 bg-blue-50/30">
                                        <input 
                                            type="number"
                                            min="0"
                                            max={remaining}
                                            value={state.receivingQty}
                                            onChange={(e) => handleQuantityChange(item.componentId, e.target.value)}
                                            className="w-full p-2 border border-blue-200 rounded text-center font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="space-y-4">
                 <div>
                    <label className="text-sm font-bold text-gray-800 block mb-2">Receipt Note</label>
                    <textarea 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Enter delivery docket number, driver info, or reasons for damaged goods..."
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none h-28"
                    />
                 </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-gray-500" /> Evidence Attachments
                    </label>
                    <input 
                        type="file" multiple 
                        ref={fileInputRef} onChange={handleFileChange} className="hidden" 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700
                        text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                        + Upload File
                    </button>
                 </div>
                 
                 <div className="border border-dashed border-gray-300 rounded-lg p-3 h-28 overflow-y-auto bg-gray-50">
                    {attachedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <UploadCloud className="w-6 h-6 mb-1 opacity-50" />
                            <span className="text-xs">No files attached</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {attachedFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 shadow-sm">
                                    <span className="text-xs font-medium text-gray-700 truncate w-3/4">{file.name}</span>
                                    <button 
                                        onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                                    ><X className="w-3.5 h-3.5"/></button>
                                </div>
                            ))}
                        </div>
                    )}
                 </div>
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-100 flex justify-end gap-4">
                  <button 
                    onClick={() => setSelectedPoId("")}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 
                    rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold 
                    hover:bg-blue-500 shadow-md transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle className="w-5 h-5" />}
                    {isSubmitting ? "Processing..." : "Confirm Receipt"}
                  </button>
              </div>
          </div>
        </>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-gray-400">
            <PackageCheck className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">Please select an order to begin receiving</p>
        </div>
      )}

      <SuccessNotification isVisible={showSuccess} message="Goods received successfully!"/>
      <WarningNotification isVisible={showWarning} message={messageWarning} onClose={() => setShowWarning(false)}/>

      {/* Print Barcode Lots Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white w-[550px] p-6 rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-3 bg-white rounded-t-lg">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-600" /> Print Component Lot Labels
              </h3>
              <button 
                onClick={handleClosePrintModal} 
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-gray-600">
              <p>Receipt completed! Print the generated **Internal Lot Labels** to label the received boxes for scanning traceability.</p>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="p-3">Lot Code</th>
                    <th className="p-3">Component</th>
                    <th className="p-3 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {receivedLots.map((lot, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 font-mono text-blue-600 font-bold">{lot.lotCode}</td>
                      <td className="p-3">
                        <p className="font-bold text-gray-900">{lot.componentName}</p>
                        <p className="text-xs text-gray-500">{lot.componentCode}</p>
                      </td>
                      <td className="p-3 text-right font-black">{lot.initialQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button 
                onClick={handleClosePrintModal} 
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Close & Finish
              </button>
              <button 
                onClick={handlePrintLabels} 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Barcode Labels
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};