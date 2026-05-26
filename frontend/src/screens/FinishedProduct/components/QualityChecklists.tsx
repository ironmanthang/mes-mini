import {
  ClipboardList, Search, Plus, Edit, Trash2, X, Loader2,
  ArrowUp, ArrowDown, AlertCircle, CheckCircle, Info, SlidersHorizontal
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import {
  QualityChecklistServices,
  type QualityChecklist,
  type InspectionPoint,
  type InspectionType,
  type PointDataInput
} from "../../../services/qualityChecklistServices";

export const QualityChecklists = (): JSX.Element => {
  // --- STATE ---
  const [checklists, setChecklists] = useState<QualityChecklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<QualityChecklist | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal control states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddPointModal, setShowAddPointModal] = useState(false);
  const [showEditPointModal, setShowEditPointModal] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<InspectionPoint | null>(null);

  // Form states - Checklist
  const [checklistName, setChecklistName] = useState("");
  const [checklistDescription, setChecklistDescription] = useState("");

  // Form states - Inspection Point
  const [pointName, setPointName] = useState("");
  const [pointDescription, setPointDescription] = useState("");
  const [pointType, setPointType] = useState<InspectionType>("BINARY");
  const [minValue, setMinValue] = useState<number | "">("");
  const [maxValue, setMaxValue] = useState<number | "">("");
  const [unit, setUnit] = useState("");
  const [sortOrder, setSortOrder] = useState<number>(0);

  // ==========================================
  // 1. DATA FETCHING
  // ==========================================
  const fetchChecklists = async (autoSelectId?: number) => {
    setIsLoadingList(true);
    try {
      const data = await QualityChecklistServices.getAllChecklists();
      const cleanArray: QualityChecklist[] = Array.isArray(data) ? data : (data as any).data || [];
      setChecklists(cleanArray);

      // Manage details selection state
      if (autoSelectId) {
        const found = cleanArray.find(c => c.checklistId === autoSelectId);
        if (found) setSelectedChecklist(found);
      } else if (selectedChecklist) {
        const found = cleanArray.find(c => c.checklistId === selectedChecklist.checklistId);
        if (found) setSelectedChecklist(found);
        else setSelectedChecklist(null);
      }
    } catch (error) {
      console.error("Failed to load checklists:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  // ==========================================
  // 2. CHECKLIST MUTATIONS
  // ==========================================
  const handleOpenCreateModal = () => {
    setChecklistName("");
    setChecklistDescription("");
    setShowCreateModal(true);
  };

  const handleCreateChecklist = async () => {
    if (!checklistName.trim()) return alert("Checklist Name is required");
    setIsSubmitting(true);
    try {
      const response = await QualityChecklistServices.createChecklist({
        checklistName: checklistName.trim(),
        description: checklistDescription.trim() || undefined
      });
      alert("✅ Checklist created successfully!");
      setShowCreateModal(false);
      await fetchChecklists(response.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to create checklist";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedChecklist) return;
    setChecklistName(selectedChecklist.checklistName);
    setChecklistDescription(selectedChecklist.description || "");
    setShowEditModal(true);
  };

  const handleEditChecklist = async () => {
    if (!selectedChecklist) return;
    if (!checklistName.trim()) return alert("Checklist Name is required");
    setIsSubmitting(true);
    try {
      await QualityChecklistServices.updateChecklist(selectedChecklist.checklistId, {
        checklistName: checklistName.trim(),
        description: checklistDescription.trim() || undefined
      });
      alert("✅ Checklist updated successfully!");
      setShowEditModal(false);
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update checklist";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChecklist = async () => {
    if (!selectedChecklist) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete checklist "${selectedChecklist.checklistName}"?\nThis cannot be undone.`
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await QualityChecklistServices.deleteChecklist(selectedChecklist.checklistId);
      alert("✅ Checklist deleted successfully!");
      setSelectedChecklist(null);
      await fetchChecklists();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to delete checklist";
      alert(`❌ Deletion Guard Blocked:\n${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 3. INSPECTION POINT MUTATIONS
  // ==========================================
  const resetPointForm = () => {
    setPointName("");
    setPointDescription("");
    setPointType("BINARY");
    setMinValue("");
    setMaxValue("");
    setUnit("");
    setSortOrder(0);
  };

  const handleOpenAddPointModal = () => {
    resetPointForm();
    // Default sortOrder to the next index
    if (selectedChecklist && selectedChecklist.inspectionPoints.length > 0) {
      const maxSort = Math.max(...selectedChecklist.inspectionPoints.map(p => p.sortOrder));
      setSortOrder(maxSort + 1);
    } else {
      setSortOrder(1);
    }
    setShowAddPointModal(true);
  };

  const handleAddInspectionPoint = async () => {
    if (!selectedChecklist) return;
    if (!pointName.trim()) return alert("Inspection Point Name is required");

    setIsSubmitting(true);
    try {
      const payload: PointDataInput = {
        pointName: pointName.trim(),
        description: pointDescription.trim() || undefined,
        pointType,
        sortOrder: Number(sortOrder) || 0
      };

      if (pointType === "MEASUREMENT") {
        if (minValue !== "") payload.minValue = Number(minValue);
        if (maxValue !== "") payload.maxValue = Number(maxValue);
        if (unit.trim()) payload.unit = unit.trim();
      }

      await QualityChecklistServices.addInspectionPoint(selectedChecklist.checklistId, payload);
      alert("✅ Inspection point added successfully!");
      setShowAddPointModal(false);
      resetPointForm();
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to add inspection point";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditPointModal = (point: InspectionPoint) => {
    setSelectedPoint(point);
    setPointName(point.pointName);
    setPointDescription(point.description || "");
    setPointType(point.pointType as InspectionType);
    setMinValue(point.minValue !== null ? point.minValue : "");
    setMaxValue(point.maxValue !== null ? point.maxValue : "");
    setUnit(point.unit || "");
    setSortOrder(point.sortOrder);
    setShowEditPointModal(true);
  };

  const handleEditInspectionPoint = async () => {
    if (!selectedChecklist || !selectedPoint) return;
    if (!pointName.trim()) return alert("Inspection Point Name is required");

    setIsSubmitting(true);
    try {
      const payload: Partial<PointDataInput> = {
        pointName: pointName.trim(),
        description: pointDescription.trim() || undefined,
        pointType,
        sortOrder: Number(sortOrder) || 0,
        // Send values if measurement type, send undefined/null to reset if binary/selection
        minValue: pointType === "MEASUREMENT" && minValue !== "" ? Number(minValue) : undefined,
        maxValue: pointType === "MEASUREMENT" && maxValue !== "" ? Number(maxValue) : undefined,
        unit: pointType === "MEASUREMENT" && unit.trim() ? unit.trim() : undefined
      };

      await QualityChecklistServices.updateInspectionPoint(selectedPoint.inspectionPointId, payload);
      alert("✅ Inspection point updated successfully!");
      setShowEditPointModal(false);
      resetPointForm();
      setSelectedPoint(null);
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update inspection point";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInspectionPoint = async (point: InspectionPoint) => {
    if (!selectedChecklist) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete point "${point.pointName}"?`);
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await QualityChecklistServices.deleteInspectionPoint(point.inspectionPointId);
      alert("✅ Inspection point deleted successfully!");
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to delete inspection point";
      alert(`❌ Deletion Guard Blocked:\n${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMovePoint = async (currentIndex: number, direction: "UP" | "DOWN") => {
    if (!selectedChecklist) return;
    const points = [...selectedChecklist.inspectionPoints];
    const targetIndex = direction === "UP" ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= points.length) return;

    const currentPoint = points[currentIndex];
    const targetPoint = points[targetIndex];

    setIsSubmitting(true);
    try {
      // Swap their sort orders
      const currentSort = currentPoint.sortOrder;
      const targetSort = targetPoint.sortOrder;

      // If they are equal, force distinct ones
      const nextCurrentSort = targetSort === currentSort ? currentSort + (direction === "UP" ? -1 : 1) : targetSort;
      const nextTargetSort = currentSort;

      await Promise.all([
        QualityChecklistServices.updateInspectionPoint(currentPoint.inspectionPointId, { sortOrder: nextCurrentSort }),
        QualityChecklistServices.updateInspectionPoint(targetPoint.inspectionPointId, { sortOrder: nextTargetSort })
      ]);

      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error) {
      console.error("Failed to reorder inspection points:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 4. RENDERS
  // ==========================================
  const filteredList = checklists.filter(item =>
    item.checklistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-300 relative w-full">

      {/* MASTER PANEL: LEFT COLUMN (30% WIDTH) */}
      <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-w-0">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" /> QC Templates
            </h2>
            <p className="text-xs text-gray-500 mt-1">Master Quality Checklists</p>
          </div>
          {isLoadingList && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search checklists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
            title="Create Checklist"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredList.map(item => {
            const isSelected = selectedChecklist?.checklistId === item.checklistId;
            return (
              <div
                key={item.checklistId}
                onClick={() => setSelectedChecklist(item)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-400"
                    : "bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900 line-clamp-1">{item.checklistName}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                    {item.inspectionPoints?.length || 0} pts
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.description || "No description provided."}
                </p>
              </div>
            );
          })}
          {!isLoadingList && filteredList.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">No quality checklists found.</p>
          )}
        </div>
      </div>

      {/* DETAIL PANEL: RIGHT COLUMN (70% WIDTH) */}
      {selectedChecklist ? (
        <div className="flex-[7] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-w-0 animate-in fade-in slide-in-from-right-3 duration-200">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">{selectedChecklist.checklistName}</h3>
                <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-black">
                  ID: {selectedChecklist.checklistId}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Created: {new Date(selectedChecklist.createdAt).toLocaleString()} | Updated: {new Date(selectedChecklist.updatedAt).toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditModal}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm bg-white"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Info
              </button>
              <button
                onClick={handleDeleteChecklist}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm bg-white"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* Description Section */}
          <div className="px-6 py-4 bg-gray-50/30 border-b border-gray-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Template Description</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {selectedChecklist.description || "No description provided for this template."}
              </p>
            </div>
          </div>

          {/* Inspection Points Sublist Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-black text-gray-900">Inspection Criteria</span>
              <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                {selectedChecklist.inspectionPoints?.length || 0} Points Defined
              </span>
            </div>
            <button
              onClick={handleOpenAddPointModal}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Criteria
            </button>
          </div>

          {/* Points List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedChecklist.inspectionPoints && selectedChecklist.inspectionPoints.length > 0 ? (
              selectedChecklist.inspectionPoints.map((point, index) => {
                const isFirst = index === 0;
                const isLast = index === (selectedChecklist.inspectionPoints.length - 1);
                
                return (
                  <div
                    key={point.inspectionPointId}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                          Sort: {point.sortOrder}
                        </span>
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{point.pointName}</h4>
                        
                        {/* Type Badge */}
                        {point.pointType === "BINARY" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                            BINARY (Pass/Fail)
                          </span>
                        )}
                        {point.pointType === "MEASUREMENT" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            MEASUREMENT
                          </span>
                        )}
                        {point.pointType === "SELECTION" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                            SELECTION
                          </span>
                        )}
                      </div>

                      {point.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{point.description}</p>
                      )}

                      {/* Display Range Specs for MEASUREMENT points */}
                      {point.pointType === "MEASUREMENT" && (
                        <div className="text-xs font-mono bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center gap-4 text-gray-600 w-fit">
                          {point.minValue !== null && (
                            <span>Min: <strong className="text-gray-900">{point.minValue}</strong></span>
                          )}
                          {point.maxValue !== null && (
                            <span>Max: <strong className="text-gray-900">{point.maxValue}</strong></span>
                          )}
                          {point.unit && (
                            <span>Unit: <strong className="text-gray-900">{point.unit}</strong></span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Panel (Sort and Edit/Delete) */}
                    <div className="flex items-center gap-3 shrink-0">
                      
                      {/* Sort arrows */}
                      <div className="flex flex-col gap-0.5 bg-gray-50 border border-gray-150 p-1 rounded-lg">
                        <button
                          onClick={() => handleMovePoint(index, "UP")}
                          disabled={isFirst || isSubmitting}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleMovePoint(index, "DOWN")}
                          disabled={isLast || isSubmitting}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>

                      {/* Editing Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditPointModal(point)}
                          disabled={isSubmitting}
                          className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors cursor-pointer"
                          title="Edit Point"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInspectionPoint(point)}
                          disabled={isSubmitting}
                          className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Point"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <AlertCircle className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-sm font-bold">No Inspection Points Defined</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[280px] text-center">
                  Add criteria points to this checklist to define what will be inspected during Quality Checks.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold text-lg">Checklist Master Data Manager</p>
          <p className="text-gray-400 text-sm mt-1">Select a checklist template from the list on the left to start configuring.</p>
        </div>
      )}

      {/* ==========================================
          5. MODALS & FORMS
          ========================================== */}
      
      {/* MODAL: Create Checklist */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white w-[500px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" /> Create Quality Checklist
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Checklist Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Electronics QC"
                  value={checklistName}
                  onChange={e => setChecklistName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  placeholder="Describe the application of this quality template..."
                  value={checklistDescription}
                  onChange={e => setChecklistDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChecklist}
                disabled={isSubmitting || !checklistName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSubmitting ? "Creating..." : "Create Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Checklist */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white w-[500px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> Edit Checklist Info
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Checklist Template Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Standard Electronics QC"
                  value={checklistName}
                  onChange={e => setChecklistName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  placeholder="Describe the application of this quality template..."
                  value={checklistDescription}
                  onChange={e => setChecklistDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={4}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={isSubmitting}
                className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditChecklist}
                disabled={isSubmitting || !checklistName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Inspection Point */}
      {(showAddPointModal || showEditPointModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white w-[520px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[95vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-blue-600" />
                {showAddPointModal ? "Add Inspection Criteria" : "Edit Inspection Criteria"}
              </h2>
              <button
                onClick={() => {
                  setShowAddPointModal(false);
                  setShowEditPointModal(false);
                  setSelectedPoint(null);
                }}
                disabled={isSubmitting}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Point/Criteria Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Power On Self-Test"
                  value={pointName}
                  onChange={e => setPointName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  placeholder="Describe the instructions for this criteria..."
                  value={pointDescription}
                  onChange={e => setPointDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={2}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Inspection Type *</label>
                  <select
                    value={pointType}
                    onChange={e => setPointType(e.target.value as InspectionType)}
                    disabled={isSubmitting}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="BINARY">BINARY (Pass/Fail)</option>
                    <option value="MEASUREMENT">MEASUREMENT (Numerical Range)</option>
                    <option value="SELECTION">SELECTION</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Sort Order *</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={e => setSortOrder(Number(e.target.value))}
                    disabled={isSubmitting}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Conditional parameters fields for MEASUREMENT type */}
              {pointType === "MEASUREMENT" && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Measurement Rules</p>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">Min Expected Value</label>
                      <input
                        type="number"
                        placeholder="None"
                        step="any"
                        value={minValue}
                        onChange={e => setMinValue(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={isSubmitting}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">Max Expected Value</label>
                      <input
                        type="number"
                        placeholder="None"
                        step="any"
                        value={maxValue}
                        onChange={e => setMaxValue(e.target.value === "" ? "" : Number(e.target.value))}
                        disabled={isSubmitting}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-600">Unit of Measurement</label>
                      <input
                        type="text"
                        placeholder="e.g. V, mm, Ohm"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPointModal(false);
                  setShowEditPointModal(false);
                  setSelectedPoint(null);
                }}
                disabled={isSubmitting}
                className="px-5 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={showAddPointModal ? handleAddInspectionPoint : handleEditInspectionPoint}
                disabled={isSubmitting || !pointName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSubmitting ? "Saving..." : "Save Criteria"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
