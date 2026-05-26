import {
  Tag, Search, Plus, Edit, Trash2, X, Loader2, CheckCircle, Info, Package
} from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import {
  ProductCategoryServices,
  type ProductCategory
} from "../../../services/productCategoryServices";

export const ProductCategories = (): JSX.Element => {
  // --- STATE ---
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal control
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form fields
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");

  // ==========================================
  // 1. DATA FETCHING
  // ==========================================
  const fetchCategories = async (autoSelectId?: number) => {
    setIsLoadingList(true);
    try {
      const data = await ProductCategoryServices.getAllCategories();
      const cleanArray = Array.isArray(data) ? data : (data as any).data || [];
      setCategories(cleanArray);

      if (autoSelectId) {
        const found = cleanArray.find((c: ProductCategory) => c.categoryId === autoSelectId);
        if (found) setSelectedCategory(found);
      } else if (selectedCategory) {
        const found = cleanArray.find((c: ProductCategory) => c.categoryId === selectedCategory.categoryId);
        setSelectedCategory(found ?? null);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ==========================================
  // 2. MUTATIONS
  // ==========================================
  const handleOpenCreateModal = () => {
    setCategoryName("");
    setDescription("");
    setShowCreateModal(true);
  };

  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return alert("Category Name is required");
    setIsSubmitting(true);
    try {
      const response = await ProductCategoryServices.createCategory({
        categoryName: categoryName.trim(),
        description: description.trim() || undefined
      });
      alert("✅ Category created successfully!");
      setShowCreateModal(false);
      await fetchCategories(response.categoryId);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to create category";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedCategory) return;
    setCategoryName(selectedCategory.categoryName);
    setDescription(selectedCategory.description || "");
    setShowEditModal(true);
  };

  const handleEditCategory = async () => {
    if (!selectedCategory) return;
    if (!categoryName.trim()) return alert("Category Name is required");
    setIsSubmitting(true);
    try {
      await ProductCategoryServices.updateCategory(selectedCategory.categoryId, {
        categoryName: categoryName.trim(),
        description: description.trim() || undefined
      });
      alert("✅ Category updated successfully!");
      setShowEditModal(false);
      await fetchCategories(selectedCategory.categoryId);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to update category";
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    const confirmDelete = window.confirm(
      `Delete category "${selectedCategory.categoryName}"?\nProducts in this category will become uncategorized.`
    );
    if (!confirmDelete) return;

    setIsSubmitting(true);
    try {
      await ProductCategoryServices.deleteCategory(selectedCategory.categoryId);
      alert("✅ Category deleted successfully!");
      setSelectedCategory(null);
      await fetchCategories();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.message || "Failed to delete category";
      alert(`❌ Deletion Guard Blocked:\n${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 3. RENDERS
  // ==========================================
  const filteredList = categories.filter(item =>
    item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] animate-in fade-in duration-300 relative w-full">

      {/* MASTER PANEL: LEFT COLUMN */}
      <div className="flex-[3] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-w-0">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-600" /> Categories
            </h2>
            <p className="text-xs text-gray-500 mt-1">Product Category Master Data</p>
          </div>
          {isLoadingList && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>

        <div className="p-4 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
            />
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-sm"
            title="Create Category"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredList.map(item => {
            const isSelected = selectedCategory?.categoryId === item.categoryId;
            return (
              <div
                key={item.categoryId}
                onClick={() => setSelectedCategory(item)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-400"
                    : "bg-white border-gray-200 hover:border-blue-200 hover:bg-gray-50 hover:shadow-sm"
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="font-bold text-sm text-gray-900 line-clamp-1">{item.categoryName}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 whitespace-nowrap">
                    ID: {item.categoryId}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {item.description || "No description provided."}
                </p>
              </div>
            );
          })}
          {!isLoadingList && filteredList.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">No categories found.</p>
          )}
        </div>
      </div>

      {/* DETAIL PANEL: RIGHT COLUMN */}
      {selectedCategory ? (
        <div className="flex-[7] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden min-w-0 animate-in fade-in slide-in-from-right-3 duration-200">

          {/* Header */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-gray-900">{selectedCategory.categoryName}</h3>
                <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-black">
                  ID: {selectedCategory.categoryId}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                Created: {new Date(selectedCategory.createdAt).toLocaleString()} | Updated: {new Date(selectedCategory.updatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenEditModal}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm bg-white"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 border border-red-200 text-red-700 text-xs font-bold rounded-lg hover:bg-red-50 cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm bg-white"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 bg-gray-50/30 border-b border-gray-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</p>
              <p className="text-sm text-gray-700 mt-0.5">
                {selectedCategory.description || "No description provided for this category."}
              </p>
            </div>
          </div>

          {/* Info block */}
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-blue-300" />
            </div>
            <p className="font-bold text-gray-600 text-base">"{selectedCategory.categoryName}"</p>
            <p className="text-sm text-gray-400 mt-2 text-center max-w-xs">
              Products assigned to this category will display this name in the Products Directory and all dropdowns.
            </p>
            <p className="text-xs text-gray-400 mt-4 font-mono bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
              To assign products → Edit a product and select this category from the dropdown.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Tag className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold text-lg">Product Category Manager</p>
          <p className="text-gray-400 text-sm mt-1">Select a category from the list to view details, or add a new one.</p>
        </div>
      )}

      {/* ==========================================
          MODALS
          ========================================== */}

      {/* MODAL: Create Category */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white w-[480px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-600" /> Create Product Category
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
                <label className="text-sm font-bold text-gray-700">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Laptops & Computers"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  placeholder="Brief description of this product category..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
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
                onClick={handleCreateCategory}
                disabled={isSubmitting || !categoryName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSubmitting ? "Creating..." : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Edit Category */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
          <div className="bg-white w-[480px] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> Edit Category
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
                <label className="text-sm font-bold text-gray-700">Category Name *</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
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
                onClick={handleEditCategory}
                disabled={isSubmitting || !categoryName.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
