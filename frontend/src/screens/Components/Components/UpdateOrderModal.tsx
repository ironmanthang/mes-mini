import { X, Save, Edit, Loader2, Paperclip, Plus, Trash2, FileText, Lock } from "lucide-react";
import { useState, useEffect, type JSX, useRef } from "react";
import { purchaseOrderService, type UpdatePORequest, type Attachment } from "../../../services/purchaseOrderServices";

interface UpdateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
  onSuccess: () => void;
}

export const UpdateOrderModal = ({ isOpen, onClose, orderId, onSuccess }: UpdateOrderModalProps): JSX.Element | null => {
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [taxRate, setTaxRate] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [deliveryTerms, setDeliveryTerms] = useState("FOB - Free On Board");
  const [priority, setPriority] = useState("NORMAL");
  const [note, setNote] = useState("");
  
  const [poStatus, setPoStatus] = useState<string>("DRAFT");

  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (isOpen && orderId) {
      setIsLoading(true);
      setNewFiles([]); 

      Promise.all([
        purchaseOrderService.getPOById(orderId),
        purchaseOrderService.getAttachmentsByPO(orderId).catch(() => []) 
      ])
        .then(([data, atts]) => {
          if (!isMounted) return;
          
          const dateStr = data.expectedDeliveryDate ? data.expectedDeliveryDate.split('T')[0] : "";
          setExpectedDeliveryDate(dateStr);
          setTaxRate(Number(data.taxRate) || 0);
          setShippingCost(Number(data.shippingCost) || 0);
          setPaymentTerms(data.paymentTerms || "Net 30");
          setDeliveryTerms(data.deliveryTerms || "FOB - Free On Board");
          setPriority(data.priority || "NORMAL");
          setNote(data.note || "");
          
          setPoStatus(data.status);
          setExistingAttachments(atts);
        })
        .catch(err => console.error("Failed to load data", err))
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }

    return () => { isMounted = false; };
  }, [isOpen, orderId]);

  const triggerFileUpload = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selected = Array.from(event.target.files);
      const uniqueNewFiles = selected.filter(newFile => 
        !newFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
      );
      setNewFiles(prev => [...prev, ...uniqueNewFiles]);
      event.target.value = '';
    }
  };

  const handleRemoveNewFile = (indexToRemove: number) => {
    setNewFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDeleteExistingAttachment = async (attachmentId: number) => {
    if (!orderId) return;
    if (!window.confirm("Are you sure you want to delete this attachment? This cannot be undone.")) return;

    try {
      await purchaseOrderService.deleteAttachment(orderId, attachmentId);
      setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to delete attachment.");
    }
  };

  const handleSubmit = async () => {
    if (!orderId) return;

    setIsSubmitting(true);
    try {
      const payload: UpdatePORequest = {
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        note
      };

      if (poStatus === 'DRAFT' || poStatus === 'PENDING') {
        payload.priority = priority;
      }

      if (poStatus === 'DRAFT') {
        payload.taxRate = taxRate;
        payload.shippingCost = shippingCost;
        payload.paymentTerms = paymentTerms;
        payload.deliveryTerms = deliveryTerms;
      }

      await purchaseOrderService.updatePO(orderId, payload);

      if (newFiles.length > 0) {
        for (const file of newFiles) {
          try {
            const category = "OTHER";
            const reqRes = await purchaseOrderService.requestAttachmentUpload(orderId, {
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              category
            });

            await purchaseOrderService.uploadFileToR2(reqRes.uploadUrl, file);

            await purchaseOrderService.confirmAttachmentUpload(orderId, {
              fileKey: reqRes.fileKey,
              fileName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              category
            });
          } catch (fileError) {
            console.error(`Failed to upload ${file.name}:`, fileError);
          }
        }
      }
      
      alert("Purchase Order updated successfully!");
      onSuccess(); 
      onClose();   
    } catch (error: any) {
      const msg = error.response?.data?.message || "Error updating Purchase Order.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isFinancialLocked = poStatus !== 'DRAFT';
  const isPriorityLocked = poStatus === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] py-10">
      <div className="bg-white w-[700px] max-h-full flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" /> Update Purchase Order
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-mono text-gray-500">Order ID: {orderId}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold border 
                ${poStatus === 'DRAFT' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                {poStatus}
              </span>
            </div>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 rounded-full 
          hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {isFinancialLocked && (
                 <div className="bg-blue-50 text-blue-700 p-3 rounded-lg text-sm flex items-start gap-2 border border-blue-100">
                   <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                   <p>This order is currently in <b>{poStatus}</b> status. Financial fields (Tax, Shipping, Terms) are locked to prevent changes during manager review.</p>
                 </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Expected Delivery Date</label>
                    <input 
                        type="date" 
                        value={expectedDeliveryDate} 
                        onChange={e => setExpectedDeliveryDate(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                      Priority
                      {isPriorityLocked && <Lock className="w-3 h-3 text-gray-400" />}
                    </label>
                    <select 
                        value={priority} 
                        onChange={e => setPriority(e.target.value)}
                        disabled={isSubmitting || isPriorityLocked}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="URGENT">High (Urgent)</option>
                        <option value="NORMAL">Medium (Normal)</option>
                        <option value="LOW">Low</option>
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                      Tax Rate (%)
                      {isFinancialLocked && <Lock className="w-3 h-3 text-gray-400" />}
                    </label>
                    <input 
                        type="number" min="0"
                        value={taxRate} 
                        onChange={e => setTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        disabled={isSubmitting || isFinancialLocked}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right disabled:bg-gray-100 disabled:text-gray-500" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                      Shipping Cost ($)
                      {isFinancialLocked && <Lock className="w-3 h-3 text-gray-400" />}
                    </label>
                    <input 
                        type="number" min="0"
                        value={shippingCost} 
                        onChange={e => setShippingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        disabled={isSubmitting || isFinancialLocked}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right disabled:bg-gray-100 disabled:text-gray-500" 
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                      Payment Terms
                      {isFinancialLocked && <Lock className="w-3 h-3 text-gray-400" />}
                    </label>
                    <select 
                        value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}
                        disabled={isSubmitting || isFinancialLocked}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="Net 30">Net 30</option>
                        <option value="Due upon receipt">Due upon receipt</option>
                        <option value="50% Advance">50% Advance</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center justify-between">
                      Delivery Terms
                      {isFinancialLocked && <Lock className="w-3 h-3 text-gray-400" />}
                    </label>
                    <select 
                        value={deliveryTerms} onChange={e => setDeliveryTerms(e.target.value)}
                        disabled={isSubmitting || isFinancialLocked}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:bg-gray-100 disabled:text-gray-500"
                    >
                        <option value="FOB - Free On Board">FOB - Free On Board</option>
                        <option value="CIF - Cost, Insurance and Freight">CIF - Cost, Insurance and Freight</option>
                        <option value="DDP - Delivered Duty Paid">DDP - Delivered Duty Paid</option>
                        <option value="EXW - Ex Works">EXW - Ex Works</option>
                    </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Internal Note</label>
                <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    disabled={isSubmitting}
                    rows={2}
                    placeholder="Add specific instructions or notes..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                      <div>
                          <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                              <Paperclip className="w-4 h-4 text-blue-500" /> Manage Attachments
                          </label>
                          <p className="text-xs text-gray-500 mt-0.5">View, remove, or add new supporting documents.</p>
                      </div>
                      <input 
                          type="file" 
                          multiple 
                          ref={fileInputRef} 
                          onChange={handleFileChange}
                          className="hidden" 
                      />
                      <button 
                          type="button"
                          onClick={triggerFileUpload}
                          disabled={isSubmitting}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                      >
                          <Plus className="w-4 h-4" /> Add Files
                      </button>
                  </div>

                  {existingAttachments.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-2">
                          <p className="text-xs font-semibold text-gray-500 uppercase">Saved Files</p>
                          {existingAttachments.map((att) => (
                              <div key={att.id} className="flex items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded flex items-center justify-center flex-shrink-0">
                                          <FileText className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                          <span className="text-sm text-gray-700 font-medium truncate" title={att.fileName}>{att.fileName}</span>
                                          <span className="text-xs text-gray-400">Uploaded {new Date(att.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                  </div>
                                  <button 
                                      type="button"
                                      onClick={() => handleDeleteExistingAttachment(att.id)}
                                      disabled={isSubmitting}
                                      className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                      title="Delete from server"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  {newFiles.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 pt-2">
                          <p className="text-xs font-semibold text-green-600 uppercase">To be Uploaded</p>
                          {newFiles.map((file, index) => (
                              <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 bg-green-50 p-2.5 rounded-lg border border-green-100">
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <div className="w-8 h-8 bg-green-200 text-green-800 rounded flex items-center justify-center flex-shrink-0">
                                          <Plus className="w-4 h-4" />
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                          <span className="text-sm text-gray-700 font-medium truncate" title={file.name}>{file.name}</span>
                                          <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB (Pending)</span>
                                      </div>
                                  </div>
                                  <button 
                                      type="button"
                                      onClick={() => handleRemoveNewFile(index)}
                                      disabled={isSubmitting}
                                      className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                      title="Remove"
                                  >
                                      <X className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

            </>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose} 
            disabled={isSubmitting || isLoading} 
            className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoading} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-colors shadow-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} 
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};