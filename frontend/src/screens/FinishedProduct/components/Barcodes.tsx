import { 
  Search, 
  ScanBarcode, 
  Package, 
  Loader2,
  Box
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { ProductServices, type Product } from "../../../services/productServices";
import { GetBarcodeModal } from "./GetBarcodeModal";

export const Barcodes = (): JSX.Element => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await ProductServices.getAllProducts();
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      setProducts(dataArray);
    } catch (error) {
      console.error("Failed to load products for barcodes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Filtering ---
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

  const handleGetBarcode = (id: number) => {
    setSelectedProductId(id);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ScanBarcode className="w-6 h-6 text-blue-600" />
              Product Barcodes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Generate and print barcodes for your registered products.</p>
          </div>
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
                  <th className="p-4 border-b border-gray-200 w-16 text-center">Icon</th>
                  <th className="p-4 border-b border-gray-200">Product Code</th>
                  <th className="p-4 border-b border-gray-200">Product Name</th>
                  <th className="p-4 border-b border-gray-200">Category</th>
                  <th className="p-4 border-b border-gray-200 text-center">Unit</th>
                  <th className="p-4 border-b border-gray-200 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-center">
                        <div className="w-8 h-8 rounded bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
                          <Package className="w-4 h-4 text-blue-500" />
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-gray-700">{product.code}</td>
                      <td className="p-4 font-bold text-gray-900">{product.productName}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md border border-gray-200">
                          {product.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-medium text-gray-600">
                        {product.unit}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleGetBarcode(product.productId)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 font-medium rounded hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                        >
                          <ScanBarcode className="w-4 h-4" /> Get Barcode
                        </button>
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

      <GetBarcodeModal
        isOpen={selectedProductId !== null}
        onClose={() => setSelectedProductId(null)}
        productId={selectedProductId}
      />
    </div>
  );
};