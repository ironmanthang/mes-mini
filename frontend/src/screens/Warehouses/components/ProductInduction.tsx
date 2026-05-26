import { 
  ScanBarcode, Package, CheckCircle2, XCircle, AlertTriangle, X,
  Trash2, Loader2, Boxes, Check
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, type JSX, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { ProductInstanceServices } from "../../../services/productInstanceServices";

interface StagedProduct {
    productInstanceId: number;
    serialNumber: string;
    status: string;
    productId: number;
    productName: string;
    batchCode: string;
    warehouseName: string;
}

export const ProductInduction = (): JSX.Element => {
  const [searchParams, setSearchParams] = useSearchParams();
  const serialQuery = searchParams.get("search") || "";

  const [stagingList, setStagingList] = useState<StagedProduct[]>([]);
  const [currentScan, setCurrentScan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [feedbackMessage, setFeedbackMessage] = useState("");
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ==========================================
  // CORE LOGIC: SCAN PROCESSING
  // ==========================================
  
  const handleScanSubmit = async (snToProcess: string) => {
    const sn = snToProcess.trim();
    if (!sn || isLoading) return;

    setIsLoading(true);
    setScanStatus('IDLE');
    setFeedbackMessage("");

    // --- INTERNAL FE DUPLICATE PREVENTION LOGIC ---
    if (stagingList.some(item => item.serialNumber === sn)) {
        console.error("SOUND: Buzz (Duplicate)");
        setScanStatus('ERROR');
        setFeedbackMessage(`Serial [${sn}] is already in the staging list.`);
        setCurrentScan("");
        setIsLoading(false);
        inputRef.current?.focus();
        return;
    }

    try {
      const searchRes = await ProductInstanceServices.getAllProductInstances({ serialNumber: sn });
      if (!searchRes.data || searchRes.data.length === 0) {
          throw new Error("This serial number was not found in the system.");
      }

      const detail = await ProductInstanceServices.getProductInstanceById(searchRes.data[0].productInstanceId);

      if (detail.status !== 'PASSED_QC' && detail.status !== 'FAILED_QC') {
          throw new Error(`Product is not ready for warehouse induction. Current status: ${detail.status}`);
      }

      const validatedData: StagedProduct = {
          productInstanceId: detail.productInstanceId,
          serialNumber: detail.serialNumber,
          status: detail.status,
          productId: detail.product.productId,
          productName: detail.product.productName,
          batchCode: detail.productionBatch.batchCode,
          warehouseName: detail.warehouse?.warehouseName || "Unassigned"
      };

      // --- SUCCESS ---
      console.log("SOUND: Beep (Success)");
      setScanStatus('SUCCESS');
      
      // Add to Staging List
      setStagingList(prev => {
        if (prev.some(item => item.serialNumber === validatedData.serialNumber)) {
          return prev;
        }
        return [validatedData, ...prev];
      });
      
      // Reset input and keep focus
      setCurrentScan(""); 
      setFeedbackMessage(`Product was successfully staged: ${sn}`);

    } catch (error: any) {
      // --- FAILURE ---
      console.error("SOUND: Buzz (Error)");
      setScanStatus('ERROR');
      setFeedbackMessage(error?.response?.data?.message || error.message || "System error while validating the code.");
      setCurrentScan(""); 
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Capture Enter from the barcode scanner or physical keyboard.
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScanSubmit(currentScan);
    }
  };

  // Automatically submit scan when search query is passed in URL
  useEffect(() => {
    if (serialQuery) {
      if (!stagingList.some(item => item.serialNumber.toLowerCase() === serialQuery.toLowerCase())) {
        handleScanSubmit(serialQuery);
      }
      // Clean up search query parameter
      setSearchParams(
        prev => {
          prev.delete("search");
          return prev;
        },
        { replace: true }
      );
    }
  }, [serialQuery, stagingList, setSearchParams]);

  const stats = useMemo(() => {
    const passCount = stagingList.filter(i => i.status === 'PASSED_QC').length;
    const failCount = stagingList.filter(i => i.status === 'FAILED_QC').length;
    return {
        total: stagingList.length,
        pass: passCount,
        fail: failCount
    };
  }, [stagingList]);

  // Remove one product row from the temporary staging list.
  const removeFromStaging = (id: number) => {
      setStagingList(prev => prev.filter(item => item.productInstanceId !== id));
      inputRef.current?.focus();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm Induction action. This calls the backend to induct products.
  const handleConfirmInduction = async () => {
      if (stagingList.length === 0 || isSubmitting) return;

      setIsSubmitting(true);
      try {
          const serialNumbers = stagingList.map(item => item.serialNumber);
          await ProductInstanceServices.inductProducts(serialNumbers);
          alert(`Warehouse induction request for ${stagingList.length} item(s) completed successfully.`);
          setStagingList([]);
          setScanStatus('SUCCESS');
          setFeedbackMessage(`Induction completed for: ${serialNumbers.join(", ")}`);
          setTimeout(() => inputRef.current?.focus(), 50);
      } catch (error: any) {
          console.error(error);
          alert(error?.response?.data?.message || "Error during warehouse induction.");
          setScanStatus('ERROR');
          setFeedbackMessage(error?.response?.data?.message || "Induction failed.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const inputApiClasses = useMemo(() => {
    const base = "w-full pl-12 pr-12 py-3 border rounded-xl text-lg font-mono font-bold outline-none transition-all duration-150 shadow-inner";
    if (isLoading) return `${base} border-blue-300 bg-blue-50 text-blue-800 cursor-wait`;
    if (scanStatus === 'SUCCESS') return `${base} border-green-500 bg-green-50 text-green-900 focus:border-green-500`;
    if (scanStatus === 'ERROR') return `${base} border-red-500 bg-red-50 text-red-900 focus:border-red-500`;
    return `${base} border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
  }, [scanStatus, isLoading]);

  return (
    <div className="flex flex-col gap-5 h-[calc(100vh-120px)] animate-in fade-in duration-300">
      
      {/* AREA 1: PRODUCT INDUCTION SCANNING STATION */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-6 flex-shrink-0">
        
        {/* Input Area */}
        <div className="flex-1 space-y-2 relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <ScanBarcode className="w-4 h-4" /> Barcode Input (Scan with a physical scanner or enter SN and press Enter)
            </label>
            
            <div className="relative group">
                {isLoading ? (
                    <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                    <ScanBarcode className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 ${scanStatus === 'ERROR' ? 'text-red-500' : scanStatus === 'SUCCESS' ? 'text-green-500' : 'text-gray-400 group-focus-within:text-blue-500'}`} />
                )}
                
                <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Enter or scan the product barcode here..." 
                  value={currentScan}
                  onChange={(e) => setCurrentScan(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  disabled={isLoading}
                  className={inputApiClasses}
                />
            </div>
            
            {/* Feedback Message */}
            <div className="h-5">
                {feedbackMessage && (
                    <p className={`text-xs font-bold animate-in fade-in slide-in-from-top-1 ${scanStatus === 'ERROR' ? 'text-red-600' : 'text-green-600'}`}>
                       {scanStatus === 'ERROR' ? <XCircle className="w-3 h-3 inline mr-1" /> : <CheckCircle2 className="w-3 h-3 inline mr-1" />} {feedbackMessage}
                    </p>
                )}
            </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6 h-full">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Total Scanned</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{stats.total}</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-green-600 uppercase flex items-center justify-center gap-1"><Check className="w-3 h-3"/> Passed</p>
                <p className="text-2xl font-black text-green-700 mt-0.5">{stats.pass}</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center min-w-[95px]">
                <p className="text-[10px] font-bold text-red-600 uppercase flex items-center justify-center gap-1"><X className="w-3 h-3"/> Failed</p>
                <p className="text-2xl font-black text-red-700 mt-0.5">{stats.fail}</p>
            </div>
        </div>
      </div>

      {/* AREA 2: STAGING LIST */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" /> Staging List
          </h2>
          <p className="text-sm text-gray-500">Temporary list of valid product units before confirming warehouse induction.</p>
        </div>

        {/* Data Grid Table */}
        <div className="flex-1 overflow-y-auto">
          {stagingList.length > 0 ? (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-3 w-16 text-center">No.</th>
                  <th className="p-3">Serial Number</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Production Batch</th>
                  <th className="p-3 text-center">QC Result</th>
                  <th className="p-3">Target Routing</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 font-medium text-gray-800">
                {stagingList.map((item, index) => {
                    const isPass = item.status === 'PASSED_QC';

                    return (
                        <tr key={item.productInstanceId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 w-16 text-center font-mono text-gray-400">{stagingList.length - index}</td>
                            <td className="p-3 font-mono font-black text-gray-900 text-sm">{item.serialNumber}</td>
                            <td className="p-3 font-bold text-sm">
                                {item.productName} 
                                <span className="text-gray-400 font-mono text-xs font-normal ml-1.5">(ID: {item.productId})</span>
                            </td>
                            <td className="p-3 font-mono text-xs text-gray-500">{item.batchCode}</td>
                            <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-black border ${isPass ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {isPass ? <CheckCircle2 className="w-3.5 h-3.5"/> : <AlertTriangle className="w-3.5 h-3.5"/>}
                                    {isPass ? "PASSED" : "FAILED"}
                                </span>
                            </td>
                            <td className="p-3">
                                <div className={`flex items-center gap-2 font-bold text-xs ${isPass ? 'text-gray-800' : 'text-red-800'}`}>
                                    <Package className="w-4 h-4 text-gray-400" />
                                    {item.warehouseName}
                                </div>
                            </td>
                            <td className="p-3 text-center">
                                <button 
                                  onClick={() => removeFromStaging(item.productInstanceId)}
                                  title="Remove from staging list"
                                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors cursor-pointer shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    )
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4 py-16">
              <div className="p-4 bg-gray-100 rounded-full"><ScanBarcode className="w-12 h-12 text-gray-300" /></div>
              <p className="font-bold text-lg text-gray-500">The induction scanning station is empty</p>
              <p className="text-sm">Use the scanner to read a Serial Number in Area 1 and look up the target warehouse.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-between items-center flex-shrink-0">
          <button 
            onClick={() => setStagingList([])}
            disabled={stagingList.length === 0 || isSubmitting}
            className="px-4 py-2 flex items-center gap-2 bg-white border border-gray-300 text-gray-600 font-bold text-sm rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
              <Trash2 className="w-4 h-4" /> Clear All ({stagingList.length})
          </button>
          
          <button 
            onClick={handleConfirmInduction}
            disabled={stagingList.length === 0 || isSubmitting}
            className="px-6 py-2.5 flex items-center gap-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm Induction ({stagingList.length} product{stagingList.length === 1 ? "" : "s"})
          </button>
        </div>
      </div>

    </div>
  );
};
