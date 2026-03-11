import { 
  X, Package, ScanBarcode, Printer, 
  Loader2, Clipboard
} from "lucide-react";
import { useState, useEffect, useRef, type JSX } from "react";
import JsBarcode from "jsbarcode";
import { ProductServices, type ProductBarcode } from "../../../services/productServices";

interface GetBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
}

export const GetBarcodeModal = ({ isOpen, onClose, productId }: GetBarcodeModalProps): JSX.Element | null => {
  const [barcodeData, setBarcodeData] = useState<ProductBarcode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);


  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      ProductServices.getBarcodeById(productId)
        .then(response => {
          setBarcodeData(response);
        })
        .catch(err => console.error("Failed to load product barcode:", err))
        .finally(() => setIsLoading(false));
    } else {
      setBarcodeData(null);
    }
  }, [isOpen, productId]);

  useEffect(() => {
    if (barcodeData && barcodeData.barcode && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeData.barcode, {
          format: "CODE128", 
          lineColor: "#000",
          width: 2,           
          height: 100,        
          displayValue: false
        });
      } catch (error) {
        console.error("Lỗi khi tạo mã vạch:", error);
      }
    }
  }, [barcodeData]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (barcodeData?.barcode) {
      navigator.clipboard.writeText(barcodeData.barcode);
      alert("Đã sao chép chuỗi mã vạch!");
    }
  };

  if (!isOpen || !productId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px] p-4">
      <div className="bg-white w-[600px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ScanBarcode className="w-6 h-6 text-blue-600" />
              Tạo và In Mã Vạch
            </h2>
            <p className="text-sm font-mono text-gray-500 mt-1">{barcodeData?.productName || 'Đang tải...'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : barcodeData ? (
            <div className="space-y-6">
                
                {/* Product Area */}
                <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="w-16 h-16 bg-white rounded-lg border border-blue-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Package className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">{barcodeData.code}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mt-1 border border-blue-200">
                            {barcodeData.unit}
                        </span>
                    </div>
                </div>

                <div className="p-6 bg-white border-2 border-dashed border-gray-200 rounded-lg text-center shadow-sm">
                    <svg ref={barcodeRef} className="mx-auto"></svg>
                    <div className="mt-4 flex justify-center gap-2 text-sm text-gray-600">
                        <span className="font-mono">{barcodeData.barcode}</span>
                        <button onClick={handleCopy} title="Sao chép chuỗi mã vạch" className="text-gray-400 hover:text-blue-600 cursor-pointer transition-colors">
                            <Clipboard className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>
          ) : (
            <div className="text-center text-red-500 py-10">Error loading data.</div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-end gap-3 print:hidden"> {/* print:hidden để ẩn footer khi in */}
            <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"
            >
                <Printer className="w-4 h-4" /> Print Barcode
            </button>
            <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors shadow-sm cursor-pointer">
                Close
            </button>
        </div>
      </div>
    </div>
  );
};