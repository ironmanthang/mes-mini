import {
  CheckCircle2, XCircle, Search, AlertTriangle,
  Save, Camera, Upload, ArrowRightCircle, Check, X, FileText, LayoutList, Loader2
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductInstanceServices, type ProductInstanceListItem } from "../../../services/productInstanceServices";
import { QualityCheckServices, type CreateCheckData } from "../../../services/qualityCheckServices";
import { QualityChecklistServices, type InspectionPoint } from "../../../services/qualityChecklistServices";

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
  // --- ZONE A STATE (LEFT COLUMN - LIST) ---
  const [pendingList, setPendingList] = useState<ProductInstanceListItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInstance, setSelectedInstance] = useState<ProductInstanceListItem | null>(null);

  // --- ZONE B STATE (MIDDLE COLUMN - CHECKLIST FROM API) ---
  const [inspectionPoints, setInspectionPoints] = useState<InspectionPoint[]>([]);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);

  // --- EVALUATION & RESULT STATE ---
  const [evaluations, setEvaluations] = useState<Record<number, 'PASS' | 'FAIL'>>({});
  const [defectType, setDefectType] = useState("");
  const [inspectorNotes, setInspectorNotes] = useState("");
  const [evidenceImages, setEvidenceImages] = useState<string[]>([]);

  // UI State
  const [showToast, setShowToast] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 1. FETCH PENDING INSPECTION LIST (LEFT COLUMN)
  // ==========================================
  const fetchPendingInstances = async () => {
    setIsLoadingList(true);
    try {
      const response = await ProductInstanceServices.getAllProductInstances({
        status: 'PENDING_QC',
        limit: 500
      });
      setPendingList(response.data || []);
    } catch (error) {
      console.error("Failed to fetch pending QC list:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPendingInstances();
  }, []);

  // ==========================================
  // 2. FETCH INSPECTION CHECKLIST (MIDDLE COLUMN) & SAVE DRAFT
  // ==========================================
  useEffect(() => {
    if (selectedInstance) {
      setIsLoadingChecklist(true);

      QualityChecklistServices.getAllChecklists()
        .then(checklists => {
          const activeChecklist = checklists.length > 0 ? checklists[0] : null;
          setInspectionPoints(activeChecklist?.inspectionPoints || []);

          // Restore previous draft if available
          const draftKey = `qc_draft_${selectedInstance.serialNumber}`;
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
        })
        .catch(err => {
          console.error("Error fetching inspection checklist:", err);
          setInspectionPoints([]);
          resetForm();
        })
        .finally(() => {
          setIsLoadingChecklist(false);
        });
    } else {
      setInspectionPoints([]);
      resetForm();
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

  // --- EVALUATION LOGIC (ZONE B) ---
  const handleEvaluate = (pointId: number, result: 'PASS' | 'FAIL') => {
    setEvaluations(prev => {
      const next = { ...prev, [pointId]: result };
      // Automatically reset Defect Type if no more failures
      if (result === 'PASS' && !Object.values(next).includes('FAIL')) {
        setDefectType("");
      }
      return next;
    });
  };

  const evaluatedCount = Object.keys(evaluations).length;
  const totalPoints = inspectionPoints.length;
  const progressPercent = totalPoints > 0 ? Math.round((evaluatedCount / totalPoints) * 100) : 0;
  const hasFail = Object.values(evaluations).includes('FAIL');
  const allPass = totalPoints > 0 && evaluatedCount === totalPoints && !hasFail;

  // --- BUTTON UNLOCK CONDITIONS (CROSS VALIDATION) ---
  const isDirty = evaluatedCount > 0 || defectType !== "" || inspectorNotes !== "";
  const canSaveDraft = isDirty;
  const canFail = hasFail && defectType !== "";
  const canPass = allPass;

  // --- ACTIONS ---
  const handleSaveDraft = () => {
    if (!selectedInstance) return;
    const draftKey = `qc_draft_${selectedInstance.serialNumber}`;
    const draftData = { evaluations, defectType, inspectorNotes, evidenceImages };

    localStorage.setItem(draftKey, JSON.stringify(draftData));
    triggerToast("Inspection progress saved (Draft).");
  };

  const handleMockImageUpload = () => {
    setEvidenceImages([...evidenceImages, `mock_image_${Date.now()}.png`]);
  };

  // ==========================================
  // 3. SUBMIT TRANSACTION TO BACKEND
  // ==========================================
  const handleSubmit = async (finalResult: 'PASS' | 'FAIL') => {
    if (!selectedInstance) return;
    setIsSubmitting(true);

    try {
      const finalNote = finalResult === 'FAIL' ? `[${defectType}] - ${inspectorNotes}` : inspectorNotes;

      // Match BE CreateCheckData Payload
      const payload: CreateCheckData = {
        serialNumber: selectedInstance.serialNumber,
        notes: finalNote,
        inspectionResults: Object.entries(evaluations).map(([pointId, res]) => ({
          inspectionPointId: Number(pointId),
          passed: res === 'PASS'
        }))
      };

      await QualityCheckServices.createCheck(payload);

      // Success: Clear Draft, Remove from List, Close Form
      localStorage.removeItem(`qc_draft_${selectedInstance.serialNumber}`);
      setPendingList(prev => prev.filter(item => item.productInstanceId !== selectedInstance.productInstanceId));
      setSelectedInstance(null);
      triggerToast(`QC result finalized as [${finalResult}].`);

    } catch (error: any) {
      console.error(error);
      alert(error?.response?.data?.message || "Error recording QC result on server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- MAIN RENDER ---
  const filteredList = pendingList.filter(item => item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex gap-5 h-[calc(100vh-120px)] animate-in fade-in duration-300 relative w-full">

      {/* ZONE A (30%): PENDING INSPECTION LIST */}
      <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-w-0">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <LayoutList className="w-5 h-5 text-blue-600" /> Pending Inspection
            </h2>
            <p className="text-xs text-gray-500 mt-1">Pending inspection list (PENDING_QC)</p>
          </div>
          {isLoadingList && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search by Serial Number..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredList.map(item => (
            <div
              key={item.productInstanceId}
              onClick={() => setSelectedInstance(item)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedInstance?.productInstanceId === item.productInstanceId ? 'bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-mono font-black text-sm text-blue-800 tracking-wide">{item.serialNumber}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 uppercase border border-yellow-200">Pending</span>
              </div>
              <p className="text-sm text-gray-800 font-bold">{item.product.productName}</p>
              <p className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> Batch: {item.productionBatch.batchCode}</p>
            </div>
          ))}
          {!isLoadingList && filteredList.length === 0 && <p className="text-center text-sm text-gray-400 py-10">No products pending inspection.</p>}
        </div>
      </div>

      {selectedInstance ? (
        <>
          {/* ZONE B (40%): INSPECTION CHECKLIST */}
          <div className="flex-[4] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-w-0">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-900">Inspection Checklist</h3>
                <p className="text-xs font-mono text-gray-500 mt-0.5">SN: {selectedInstance.serialNumber}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-blue-600 block">{progressPercent}%</span>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-2 flex justify-between items-center border-b border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase">Inspection Progress</span>
              <span className="text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">Checked {evaluatedCount}/{totalPoints} criteria</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200">
              <div className={`h-full transition-all duration-500 ${hasFail ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {isLoadingChecklist ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className="text-sm">Loading checklist from server...</p>
                </div>
              ) : inspectionPoints.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <AlertTriangle className="w-8 h-8 text-orange-400 mb-2" />
                  <p className="text-sm">No inspection criteria found.</p>
                </div>
              ) : (
                inspectionPoints.map((item, index) => {
                  const evalState = evaluations[item.inspectionPointId];
                  return (
                    <div key={item.inspectionPointId} className={`p-4 rounded-xl border transition-all duration-200 ${evalState === 'PASS' ? 'bg-green-50/50 border-green-200 shadow-sm' : evalState === 'FAIL' ? 'bg-red-50/50 border-red-200 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <p className="text-sm font-bold text-gray-800 mb-1">{index + 1}. {item.pointName}</p>
                      {item.description && <p className="text-xs text-gray-500 mb-3">{item.description}</p>}

                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleEvaluate(item.inspectionPointId, 'PASS')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer border
                              ${evalState === 'PASS'
                              ? 'bg-green-600 text-white border-green-600'
                              : evalState === 'FAIL'
                                ? 'bg-gray-50 text-gray-300 border-gray-200'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-green-50 hover:border-green-500'}`}
                        >
                          <Check className="w-4 h-4" /> PASS
                        </button>
                        <button
                          onClick={() => handleEvaluate(item.inspectionPointId, 'FAIL')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer border
                              ${evalState === 'FAIL'
                              ? 'bg-red-600 text-white border-red-600'
                              : evalState === 'PASS'
                                ? 'bg-gray-50 text-gray-300 border-gray-200'
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-red-50 hover:border-red-500'}`}
                        >
                          <X className="w-4 h-4" /> FAIL
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* ZONE C (30%): RESULT & EVIDENCE */}
          <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-w-0">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900">Result & Evidence</h3>
              <p className="text-xs text-gray-500 mt-0.5">Confirm evidence and finalize results</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              <div className={`space-y-2 transition-opacity duration-300 ${hasFail ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 ${hasFail ? 'text-red-500' : 'text-gray-400'}`} />
                  Defect Type {hasFail && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={defectType} onChange={e => setDefectType(e.target.value)}
                  disabled={!hasFail}
                  className={`w-full p-2.5 border rounded-lg text-sm font-medium outline-none transition-all cursor-pointer ${hasFail && !defectType ? 'border-red-400 ring-2 ring-red-50 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white'}`}
                >
                  <option value="">-- Select defect code (Required) --</option>
                  {DEFECT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Inspector Notes
                </label>
                <textarea
                  value={inspectorNotes} onChange={e => setInspectorNotes(e.target.value)}
                  placeholder="Detailed status description..." rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none resize-none transition-all focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-500" /> Evidence Images
                </label>
                <div className="flex gap-3">
                  <button onClick={handleMockImageUpload} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-gray-600 bg-gray-50">
                    <Camera className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Capture</span>
                  </button>
                  <button onClick={handleMockImageUpload} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors cursor-pointer text-gray-600 bg-gray-50">
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wide">Upload</span>
                  </button>
                </div>
                {evidenceImages.length > 0 && (
                  <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                    {evidenceImages.map((_img, i) => (
                      <div key={i} className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center flex-shrink-0 relative group">
                        <span className="text-[8px] text-gray-500 text-center font-bold">IMAGE<br />{i + 1}</span>
                        <button className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 hidden group-hover:block cursor-pointer shadow-md" onClick={() => setEvidenceImages(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border flex items-center gap-3 bg-gray-50 border-gray-200 shadow-inner">
                <ArrowRightCircle className={`w-8 h-8 ${allPass ? 'text-green-500' : hasFail ? 'text-red-500' : 'text-gray-300'}`} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Estimated Routing</p>
                  <p className={`text-sm font-black ${allPass ? 'text-green-700' : hasFail ? 'text-red-700' : 'text-gray-700'}`}>
                    {allPass ? "Sales Warehouse (WH-FG)" : hasFail ? "Defect Warehouse (WH-DEFECT)" : "Waiting for evaluation..."}
                  </p>
                </div>
              </div>
            </div>

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
                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale cursor-pointer shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} FAIL
                </button>
                <button
                  onClick={() => handleSubmit('PASS')}
                  disabled={!canPass || isSubmitting}
                  className="flex-1 py-3 flex items-center justify-center gap-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-40 disabled:grayscale cursor-pointer shadow-sm"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} PASS
                </button>
              </div>
            </div>
          </div>

        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold text-lg">Quality Control Station (QC)</p>
          <p className="text-gray-400 text-sm mt-1">Select a product from the list on the left to start the inspection checklist.</p>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <span className="text-sm font-bold tracking-wide">{showToast}</span>
        </div>
      )}

    </div>
  );
};