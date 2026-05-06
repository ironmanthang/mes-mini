import { 
  CheckCircle2, XCircle, Search, AlertTriangle, 
  Save, Camera, Upload, ArrowRightCircle, Check, X, FileText, LayoutList
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";

// --- MOCK DATA ---
interface ProductInstance {
  id: number;
  serialNumber: string;
  productName: string;
  status: 'PENDING_QC';
}

const mockInstances: ProductInstance[] = [
  { id: 1001, serialNumber: "SN-2026-98765", productName: "Smart Watch V1", status: "PENDING_QC" },
  { id: 1002, serialNumber: "SN-2026-98766", productName: "Smart Watch V1", status: "PENDING_QC" },
  { id: 1003, serialNumber: "SN-2026-98767", productName: "Bluetooth Earbuds", status: "PENDING_QC" },
];

const mockChecklist = [
  { id: "C1", criteria: "Visual Inspection (No scratches, dents)" },
  { id: "C2", criteria: "Power Check (Normal startup)" },
  { id: "C3", criteria: "Display/Screen Check (No dead pixels)" },
  { id: "C4", criteria: "Connectivity Check (Stable Bluetooth, Wifi)" },
  { id: "C5", criteria: "Packaging & Accessories Check (Full cable, manual)" }
];

const DEFECT_TYPES = [
  "Scratches / Dents",
  "Cracks / Broken Glass",
  "No Power / Boot Failure",
  "Charging Failure / Battery Drain",
  "Display / Screen Defects",
  "Keyboard / Touchpad Malfunction",
  "Port / Connectivity Error",
  "Audio / Speaker / Mic Failure",
  "Overheating",
  "Missing Accessories / Wrong Label"
];

export const QualityChecks = (): JSX.Element => {
  // --- STATE VÙNG 1 (DANH SÁCH) ---
  const [pendingList, setPendingList] = useState<ProductInstance[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<ProductInstance | null>(null);

  // --- STATE VÙNG 2 & 3 (ĐÁNH GIÁ & KẾT QUẢ) ---
  const [evaluations, setEvaluations] = useState<Record<string, 'PASS' | 'FAIL'>>({});
  const [defectType, setDefectType] = useState("");
  const [inspectorNotes, setInspectorNotes] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);
  
  // UI State
  const [showToast, setShowToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Khởi tạo data
  useEffect(() => {
    setPendingList(mockInstances);
  }, []);

  // LOGIC LOCAL STORAGE (LƯU NHÁP)
  useEffect(() => {
    if (selectedInstance) {
      const draftKey = `qc_draft_${selectedInstance.id}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setEvaluations(parsed.evaluations || {});
          setDefectType(parsed.defectType || "");
          setInspectorNotes(parsed.inspectorNotes || "");
          setEvidenceImages(parsed.evidenceImages || []);
          triggerToast("Previous draft restored.");
        } catch (e) {
          resetForm();
        }
      } else {
        resetForm();
      }
    }
  }, [selectedInstance]);

  const resetForm = () => {
    setEvaluations({});
    setDefectType("");
    setInspectorNotes("");
    setEvidenceImages([]);
  };

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(""), 3000);
  };

  // --- LOGIC ĐÁNH GIÁ (VÙNG 2) ---
  const handleEvaluate = (id: string, result: 'PASS' | 'FAIL') => {
    setEvaluations(prev => {
      const next = { ...prev, [id]: result };
      // Nếu đổi từ Fail -> Pass và không còn Fail nào, reset Defect Type
      if (result === 'PASS' && !Object.values(next).includes('FAIL')) {
        setDefectType(""); 
      }
      return next;
    });
  };

  const progressPercent = Math.round((Object.keys(evaluations).length / mockChecklist.length) * 100);
  const hasFail = Object.values(evaluations).includes('FAIL');
  const allPass = Object.keys(evaluations).length === mockChecklist.length && !hasFail;

  // --- ĐIỀU KIỆN MỞ KHÓA NÚT BẤM (SAFETY LOCKS) ---
  const isDirty = Object.keys(evaluations).length > 0 || defectType !== "" || inspectorNotes !== "";
  const canSaveDraft = isDirty;
  const canFail = hasFail && defectType !== "" && inspectorNotes.trim() !== "";
  const canPass = allPass;

  // --- ACTIONS ---
  const handleSaveDraft = () => {
    if (!selectedInstance) return;
    const draftKey = `qc_draft_${selectedInstance.id}`;
    const draftData = { evaluations, defectType, inspectorNotes, evidenceImages };
    
    // Chỉ lưu LocalStorage, không gọi BE
    localStorage.setItem(draftKey, JSON.stringify(draftData));
    triggerToast("Inspection progress saved as draft.");
  };

  const handleMockImageUpload = () => {
    setEvidenceImages([...evidenceImages, `mock_image_${Date.now()}.png`]);
  };

  const handleSubmit = async (finalResult: 'PASS' | 'FAIL') => {
    if (!selectedInstance) return;
    setIsSubmitting(true);

    try {
      // Chuẩn bị Payload theo thiết kế
      const finalNote = finalResult === 'FAIL' ? `[${defectType}] - ${inspectorNotes}` : inspectorNotes;
      const payload = {
        productInstanceId: selectedInstance.id,
        result: finalResult,
        notes: finalNote,
        evaluations: evaluations // Chi tiết từng tiêu chí
      };

      console.log("Submitting QC Result to Backend:", payload);
      // Giả lập API Delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Thành công: Xóa Local Storage, Xóa khỏi danh sách chờ, Đóng form
      localStorage.removeItem(`qc_draft_${selectedInstance.id}`);
      setPendingList(prev => prev.filter(item => item.id !== selectedInstance.id));
      setSelectedInstance(null);
      triggerToast(`QC result [${finalResult}] recorded.`);
      
    } catch (error) {
      alert("Error recording QC result.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER CHÍNH ---
  const filteredList = pendingList.filter(item => item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] animate-in fade-in duration-300 relative">
      
      {/* ========================================== */}
      {/* VÙNG A (TRÁI): DANH SÁCH CHỜ KIỂM ĐỊNH */}
      {/* ========================================== */}
      <div className="w-1/4 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <LayoutList className="w-5 h-5 text-blue-600" /> Pending Inspection
          </h2>
          <p className="text-xs text-gray-500 mt-1">List of products pending QC</p>
        </div>
        
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search Serial Number..." 
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredList.map(item => (
            <div 
              key={item.id}
              onClick={() => setSelectedInstance(item)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedInstance?.id === item.id ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono font-bold text-sm text-blue-700">{item.serialNumber}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase">Pending</span>
              </div>
              <p className="text-xs text-gray-600 font-medium">{item.productName}</p>
            </div>
          ))}
          {filteredList.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No products pending inspection.</p>}
        </div>
      </div>

      {/* ========================================== */}
      {/* VÙNG B & C: KHU VỰC ĐÁNH GIÁ CHI TIẾT */}
      {/* ========================================== */}
      {selectedInstance ? (
        <div className="flex-1 flex gap-6 overflow-hidden">
          
          {/* VÙNG B (GIỮA): INSPECTION CHECKLIST */}
          <div className="w-1/2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <div>
                  <h3 className="text-base font-bold text-gray-900">Inspection Checklist</h3>
                  <p className="text-xs font-mono text-gray-500 mt-0.5">SN: {selectedInstance.serialNumber}</p>
               </div>
               <div className="text-right">
                  <span className="text-2xl font-black text-blue-600">{progressPercent}%</span>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-200">
               <div className={`h-full transition-all duration-500 ${hasFail ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
               {mockChecklist.map((item, index) => {
                 const evalState = evaluations[item.id];
                 return (
                   <div key={item.id} className={`p-4 rounded-xl border transition-all ${evalState === 'PASS' ? 'bg-green-50/50 border-green-200' : evalState === 'FAIL' ? 'bg-red-50/50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <p className="text-sm font-bold text-gray-800 mb-3">{index + 1}. {item.criteria}</p>
                      <div className="flex items-center gap-3">
                         <button 
                            onClick={() => handleEvaluate(item.id, 'PASS')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${evalState === 'PASS' ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50'}`}
                         >
                            <Check className="w-4 h-4" /> PASS
                         </button>
                         <button 
                            onClick={() => handleEvaluate(item.id, 'FAIL')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer border ${evalState === 'FAIL' ? 'bg-red-600 text-white border-red-600 shadow-md' : 'bg-white text-gray-600 border-gray-300 hover:bg-red-50'}`}
                         >
                            <X className="w-4 h-4" /> FAIL
                         </button>
                      </div>
                   </div>
                 )
               })}
            </div>
          </div>

          {/* VÙNG C (PHẢI): RESULT & EVIDENCE */}
          <div className="w-1/2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
               <h3 className="text-base font-bold text-gray-900">Result & Evidence</h3>
               <p className="text-xs text-gray-500 mt-0.5">Confirm defects and warehouse routing</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               
               {/* 1. Defect Type (Bắt buộc nếu có Lỗi) */}
               <div className={`space-y-2 transition-opacity ${hasFail ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                     <AlertTriangle className={`w-4 h-4 ${hasFail ? 'text-red-500' : 'text-gray-400'}`} /> 
                     Defect Type (Phân loại lỗi) {hasFail && <span className="text-red-500">*</span>}
                  </label>
                  <select 
                     value={defectType} onChange={e => setDefectType(e.target.value)}
                     className={`w-full p-2.5 border rounded-lg text-sm outline-none transition-all ${hasFail && !defectType ? 'border-red-400 ring-2 ring-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                  >
                     <option value="">-- Select defect code --</option>
                     {DEFECT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
               </div>

               {/* 2. Inspector Notes */}
               <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                     <FileText className="w-4 h-4 text-blue-500" /> 
                     Inspector Notes {hasFail && <span className="text-red-500">*</span>}
                  </label>
                  <textarea 
                     value={inspectorNotes} onChange={e => setInspectorNotes(e.target.value)}
                     placeholder="Detailed status description..." rows={3}
                     className={`w-full p-3 border rounded-lg text-sm outline-none resize-none transition-all ${hasFail && !inspectorNotes.trim() ? 'border-red-400 ring-2 ring-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                  />
               </div>

               {/* 3. Evidence Camera/Upload */}
               <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                     <Camera className="w-4 h-4 text-blue-500" /> Evidence Upload
                  </label>
                  <div className="flex gap-3">
                     <button onClick={handleMockImageUpload} className="flex-1 flex flex-col items-center justify-center gap-1 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-gray-500">
                        <Camera className="w-5 h-5" />
                        <span className="text-xs font-bold">Capture</span>
                     </button>
                     <button onClick={handleMockImageUpload} className="flex-1 flex flex-col items-center justify-center gap-1 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-gray-500">
                        <Upload className="w-5 h-5" />
                        <span className="text-xs font-bold">Upload</span>
                     </button>
                  </div>
                  {evidenceImages.length > 0 && (
                     <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {evidenceImages.map((img, i) => (
                           <div key={i} className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 relative group">
                              <span className="text-[8px] text-gray-500 text-center">Image<br/>{i+1}</span>
                              <button className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hidden group-hover:block" onClick={() => setEvidenceImages(prev => prev.filter((_, idx) => idx !== i))}>
                                <X className="w-3 h-3" />
                              </button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>

               {/* 4. Routing Preview */}
               <div className="p-4 rounded-xl border flex items-center gap-3 bg-gray-50 border-gray-200">
                  <ArrowRightCircle className={`w-6 h-6 ${allPass ? 'text-green-500' : hasFail ? 'text-red-500' : 'text-gray-400'}`} />
                  <div>
                     <p className="text-[10px] font-bold text-gray-500 uppercase">Routing Destination</p>
                     <p className={`text-sm font-bold ${allPass ? 'text-green-700' : hasFail ? 'text-red-700' : 'text-gray-700'}`}>
                        {allPass ? "WH-FG (Sales Warehouse)" : hasFail ? "WH-DEFECT (Error Warehouse)" : "Pending evaluation..."}
                     </p>
                  </div>
               </div>

            </div>

            {/* 5. Vùng Footer Actions */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
               <button 
                  onClick={handleSaveDraft}
                  disabled={!canSaveDraft || isSubmitting}
                  className="w-full py-2.5 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
               >
                  <Save className="w-4 h-4" /> Save Progress (Draft)
               </button>
               
               <div className="flex gap-3">
                  <button 
                     onClick={() => handleSubmit('FAIL')}
                     disabled={!canFail || isSubmitting}
                     className="flex-1 py-3 flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale cursor-pointer shadow-md"
                     title={hasFail && !canFail ? "Please select defect type and enter notes" : ""}
                  >
                     <XCircle className="w-4 h-4" /> FAIL - Move to Defect
                  </button>
                  <button 
                     onClick={() => handleSubmit('PASS')}
                     disabled={!canPass || isSubmitting}
                     className="flex-1 py-3 flex items-center justify-center gap-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale cursor-pointer shadow-md"
                  >
                     <CheckCircle2 className="w-4 h-4" /> PASS - Move to Sales
                  </button>
               </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
           <CheckCircle2 className="w-16 h-16 text-gray-300 mb-4" />
           <p className="text-gray-500 font-medium text-lg">Select a product from the list on the left to start inspection.</p>
        </div>
      )}

      {/* TOAST THÔNG BÁO LƯU NHÁP */}
      {showToast && (
         <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium">{showToast}</span>
         </div>
      )}

    </div>
  );
};