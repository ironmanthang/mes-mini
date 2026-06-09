import {
  ClipboardList, Search, Plus, Edit, Trash2, X, Loader2,
  ArrowUp, ArrowDown, AlertCircle, CheckCircle, Info, SlidersHorizontal
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import {
  QualityChecklistServices,
  type QualityChecklist,
  type InspectionPoint,
  type PointDataInput
} from "../../../services/qualityChecklistServices";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { WarningNotification } from "../../Notification/WarningNotification";
import { hasPermission } from "../../../lib/auth";

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
  const [sortOrder, setSortOrder] = useState<number>(0);

  // Notification & Confirm States
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "primary" | "success" | "danger";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "primary",
    onConfirm: () => {},
  });

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSuccessMessage("");
    }, 2000);
  };

  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    setShowWarning(true);
  };

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
    if (!checklistName.trim()) return triggerWarning("Checklist Name is required");
    setIsSubmitting(true);
    try {
      const response = await QualityChecklistServices.createChecklist({
        checklistName: checklistName.trim(),
        description: checklistDescription.trim() || undefined
      });
      triggerSuccess("Checklist created successfully!");
      setShowCreateModal(false);
      await fetchChecklists(response.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to create checklist";
      triggerWarning(`Error: ${errorMsg}`);
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
    if (!checklistName.trim()) return triggerWarning("Checklist Name is required");
    setIsSubmitting(true);
    try {
      await QualityChecklistServices.updateChecklist(selectedChecklist.checklistId, {
        checklistName: checklistName.trim(),
        description: checklistDescription.trim() || undefined
      });
      triggerSuccess("Checklist updated successfully!");
      setShowEditModal(false);
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update checklist";
      triggerWarning(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChecklist = () => {
    if (!selectedChecklist) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Checklist",
      message: `Are you sure you want to delete checklist "${selectedChecklist.checklistName}"?\nThis cannot be undone.`,
      variant: "danger",
      onConfirm: executeDeleteChecklist,
    });
  };

  const executeDeleteChecklist = async () => {
    if (!selectedChecklist) return;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setIsSubmitting(true);
    try {
      await QualityChecklistServices.deleteChecklist(selectedChecklist.checklistId);
      triggerSuccess("Checklist deleted successfully!");
      setSelectedChecklist(null);
      await fetchChecklists();
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to delete checklist";
      triggerWarning(`Deletion Guard Blocked:\n${errorMsg}`);
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
    if (!pointName.trim()) return triggerWarning("Inspection Point Name is required");

    setIsSubmitting(true);
    try {
      const payload: PointDataInput = {
        pointName: pointName.trim(),
        description: pointDescription.trim() || undefined,
        sortOrder: Number(sortOrder) || 0
      };

      await QualityChecklistServices.addInspectionPoint(selectedChecklist.checklistId, payload);
      triggerSuccess("Inspection point added successfully!");
      setShowAddPointModal(false);
      resetPointForm();
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to add inspection point";
      triggerWarning(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditPointModal = (point: InspectionPoint) => {
    setSelectedPoint(point);
    setPointName(point.pointName);
    setPointDescription(point.description || "");
    setSortOrder(point.sortOrder);
    setShowEditPointModal(true);
  };

  const handleEditInspectionPoint = async () => {
    if (!selectedChecklist || !selectedPoint) return;
    if (!pointName.trim()) return triggerWarning("Inspection Point Name is required");

    setIsSubmitting(true);
    try {
      const payload: Partial<PointDataInput> = {
        pointName: pointName.trim(),
        description: pointDescription.trim() || undefined,
        sortOrder: Number(sortOrder) || 0
      };

      await QualityChecklistServices.updateInspectionPoint(selectedPoint.inspectionPointId, payload);
      triggerSuccess("Inspection point updated successfully!");
      setShowEditPointModal(false);
      resetPointForm();
      setSelectedPoint(null);
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update inspection point";
      triggerWarning(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInspectionPoint = (point: InspectionPoint) => {
    if (!selectedChecklist) return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Inspection Criteria",
      message: `Are you sure you want to delete point "${point.pointName}"?`,
      variant: "danger",
      onConfirm: () => executeDeleteInspectionPoint(point),
    });
  };

  const executeDeleteInspectionPoint = async (point: InspectionPoint) => {
    if (!selectedChecklist) return;
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setIsSubmitting(true);
    try {
      await QualityChecklistServices.deleteInspectionPoint(point.inspectionPointId);
      triggerSuccess("Inspection point deleted successfully!");
      await fetchChecklists(selectedChecklist.checklistId);
    } catch (error: any) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to delete inspection point";
      triggerWarning(`Deletion Guard Blocked:\n${errorMsg}`);
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
          {hasPermission("PRODUCT_UPDATE") && (
            <button
              onClick={handleOpenCreateModal}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
              title="Create Checklist"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredList.map(item => {
            const isSelected = selectedChecklist?.checklistId === item.checklistId;
            const canClick = hasPermission("PRODUCT_UPDATE");

            return (
              <div
                key={item.checklistId}
                onClick={() => canClick ? setSelectedChecklist(item) : undefined}
                className={`p-4 rounded-xl border ${canClick ? "cursor-pointer" : "cursor-not-allowed"}
                  transition-all duration-150 ${
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
              {hasPermission("PRODUCT_UPDATE") && (
                <button
                  onClick={handleOpenEditModal}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm bg-white"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Info
                </button>
              )}
              {hasPermission("PRODUCT_UPDATE") && (
                <button
                  onClick={handleDeleteChecklist}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm bg-white"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              )}
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
            {hasPermission("PRODUCT_UPDATE") && (
              <button
                onClick={handleOpenAddPointModal}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Criteria
              </button>
            )}
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
                      </div>

                      {point.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{point.description}</p>
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
                        {hasPermission("PRODUCT_UPDATE") && (
                          <button
                            onClick={() => handleOpenEditPointModal(point)}
                            disabled={isSubmitting}
                            className="p-2 hover:bg-blue-50 hover:text-blue-600 text-gray-400 rounded-lg transition-colors cursor-pointer"
                            title="Edit Point"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission("PRODUCT_UPDATE") && (
                          <button
                            onClick={() => handleDeleteInspectionPoint(point)}
                            disabled={isSubmitting}
                            className="p-2 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Point"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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

      {/* Notifications and Confirm Modals */}
      <SuccessNotification isVisible={showSuccess} message={successMessage} />
      
      <WarningNotification
        isVisible={showWarning}
        message={warningMessage}
        onClose={() => {
          setShowWarning(false);
          setWarningMessage("");
        }}
      />
      
      <ConfirmNotification
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
};
