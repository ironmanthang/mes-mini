import { 
  PackageCheck, Search, Building2, Calendar, User, 
  MapPin, CheckCircle, UploadCloud, X, Loader2, FileText, Paperclip
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
  qcCheck: 'PASS' | 'FAIL';
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
        details.details?.forEach(item => {
          const remaining = item.quantityOrdered - item.quantityReceived;
          if (remaining > 0) {
            initialItems[item.componentId] = {
              componentId: item.componentId,
              remainingQty: remaining,
              receivingQty: remaining,
              qcCheck: 'PASS'
            };
          }
        });
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

  const handleQcChange = (componentId: number, status: 'PASS' | 'FAIL') => {
    setReceiptItems(prev => ({
      ...prev,
      [componentId]: { ...prev[componentId], qcCheck: status }
    }));
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

      const payload = {
        items: itemsToReceive.map(item => ({
          componentId: item.componentId,
          quantity: item.receivingQty,
          warehouseId: Number(selectedWarehouseId)
        }))
      };

      await purchaseOrderService.receiveGoods(poId, payload);

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
          } catch (fileErr) {
            console.error(`Lỗi upload file ${file.name}:`, fileErr);
          }
        }
      }

      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedPoId("");
        setPoDetails(null);
        setAttachedFiles([]);
        setNote("");
        purchaseOrderService.getAllPOs({ limit: 1000 }).then(res => {
           setValidPOs((res.data || []).filter(po => po.status === 'ORDERED' || po.status === 'RECEIVING'));
        });
      }, 2000);

    } catch (error: any) {
      alert(error?.response?.data?.message || "Lỗi khi nhập kho.");
    } finally {
      setIsSubmitting(false);
    }
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
                            <th className="p-4 text-center w-36">QC Check</th>
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
                                    <td className="p-4">
                                        <select 
                                            value={state.qcCheck}
                                            onChange={(e) => handleQcChange(item.componentId, e.target.value as any)}
                                            className={`w-full p-2 border rounded text-xs font-bold outline-none cursor-pointer ${
                                                state.qcCheck === 'PASS' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'
                                            }`}
                                        >
                                            <option value="PASS">✓ PASS</option>
                                            <option value="FAIL">✕ FAIL</option>
                                        </select>
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
    </div>
  );
};