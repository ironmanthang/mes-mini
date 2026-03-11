import { 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Package, 
  Loader2,
  Calendar,
  Box
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { ProductServices, type Product } from "../../../services/productServices";
import { CreateNewProductModal } from "./CreateNewProductModal";
import { ProductDetailModal } from "./ProductDetailModal";
import { UpdateProductModal } from "./UpdateProductModal";
import { SuccessNotification } from "../../UserAndSystem/components/SuccessNotification";
import { DeleteProductModal } from "./DeleteProductModal";

export const Information = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedViewId, setSelectedViewId] = useState<number | null>(null);
  const [selectedUpdateId, setSelectedUpdateId] = useState<number | null>(null);
  const [productToDelete, setProductToDelete] = useState<{id: number, name: string} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await ProductServices.getAllProducts();
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      setProducts(dataArray);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const searchLower = searchQuery.toLowerCase();
      return (
        product.productName?.toLowerCase().includes(searchLower) || 
        product.code?.toLowerCase().includes(searchLower) ||
        (product.category && product.category.toLowerCase().includes(searchLower))
      );
    });
  }, [products, searchQuery]);

  const handleCreateNew = () => {
    setIsNewModalOpen(true);
  };

  const handleViewDetails = (id: number) => {
    setSelectedViewId(id);
  };

  const handleUpdate = (id: number) => {
    setSelectedUpdateId(id);
  };

  const handleDelete = (id: number, name: string) => {
    setProductToDelete({ id, name });
  };

  // --- UI Helpers ---
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              Products Directory
            </h2>
            <p className="text-sm text-gray-500 mt-1">Manage master data for all finished goods and products in the system.</p>
          </div>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Product
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search Product Code, Name or Category..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow" 
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0">
                <tr>
                  <th className="p-4 border-b border-gray-200">Product Code</th>
                  <th className="p-4 border-b border-gray-200">Product Name</th>
                  <th className="p-4 border-b border-gray-200">Category</th>
                  <th className="p-4 border-b border-gray-200 text-center">Unit</th>
                  <th className="p-4 border-b border-gray-200">Created At</th>
                  <th className="p-4 border-b border-gray-200 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-gray-700">{product.code}</td>
                      <td className="p-4 font-bold text-blue-600">{product.productName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium text-gray-600">
                        {product.unit}
                      </td>
                      <td className="p-4 text-gray-600 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" /> {formatDate(product.createdAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => handleViewDetails(product.productId)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer" 
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdate(product.productId)}
                            className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" 
                            title="Update Product"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(product.productId, product.productName)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" 
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Box className="w-8 h-8 mb-2 opacity-20" />
                        <p>No products found matching your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CreateNewProductModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => fetchProducts()} 
      />

      <ProductDetailModal
        isOpen={selectedViewId !== null}
        onClose={() => setSelectedViewId(null)}
        productId={selectedViewId}
      />

      <UpdateProductModal
        isOpen={selectedUpdateId !== null}
        onClose={() => setSelectedUpdateId(null)}
        productId={selectedUpdateId}
        onSuccess={() => fetchProducts()} 
      />

      <DeleteProductModal
        isOpen={productToDelete !== null}
        onClose={() => setProductToDelete(null)}
        productId={productToDelete?.id || null}
        productName={productToDelete?.name || ""}
        onSuccess={() => {
            setShowSuccess(true);
            fetchProducts();
            setProductToDelete(null);
            setTimeout(() => setShowSuccess(false), 3000);
        }}
      />

      <SuccessNotification isVisible={showSuccess}/>
    </div>
  );
};