import { 
  ScanBarcode, Package, CheckCircle2, XCircle, AlertTriangle, 
  Trash2, X, Zap, Loader2, Boxes, Check
} from "lucide-react";
import { useState, useEffect, useRef, useMemo, type JSX, type KeyboardEvent } from "react";
import { 
    type VerifyScanResponse, 
} from "../../../services/productInductionServices";

const mockDbInstances: VerifyScanResponse[] = [
  { productInstanceId: 101, serialNumber: "SN-PC-001", status: "PASSED_QC", productId: 1, productName: "Laptop X1 Pro", targetSalesWarehouseId: 3, targetErrorWarehouseId: 4 },
  { productInstanceId: 102, serialNumber: "SN-PC-002", status: "FAILED_QC", productId: 1, productName: "Laptop X1 Pro", targetSalesWarehouseId: 3, targetErrorWarehouseId: 4 },
  { productInstanceId: 201, serialNumber: "SN-PH-001", status: "PASSED_QC", productId: 2, productName: "Phone Watch S9", targetSalesWarehouseId: 3, targetErrorWarehouseId: 4 },
  { productInstanceId: 202, serialNumber: "SN-PH-002", status: "PASSED_QC", productId: 2, productName: "Phone Watch S9", targetSalesWarehouseId: 3, targetErrorWarehouseId: 4 },
  { productInstanceId: 301, serialNumber: "SN-EB-999", status: "FAILED_QC", productId: 3, productName: "Bluetooth Earbuds Z", targetSalesWarehouseId: 3, targetErrorWarehouseId: 4 },
  // Thêm một mã trạng thái khác để test lỗi
  { productInstanceId: 401, serialNumber: "SN-ACC-DRAFT", status: "PENDING_QC", productId: 4, productName: "Cable Charger", targetSalesWarehouseId: 3, targetErrorWarehouseId: 4 },
];

// Default destination warehouse names
const WAREHOUSE_NAMES: Record<number, string> = {
    3: "Sales Warehouse (WH-FG)",
    4: "Defect Warehouse (WH-DEFECT)"
};

export const ProductInduction = (): JSX.Element => {
  // --- UI & DATA STATE MANAGEMENT ---
  const [stagingList, setStagingList] = useState<VerifyScanResponse[]>([]);
  const [currentScan, setCurrentScan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Visual Feedback State
  const [scanStatus, setScanStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [feedbackMessage, setFeedbackMessage] = useState("");
  
  // Ref for auto-focusing the input field
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on input field when screen mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ==========================================
  // MOCK SERVICE FUNCTIONS (API SIMULATION)
  // ==========================================
  
  // Flow 1 Simulation: Validate code on scan
  const mockVerifyScanApi = async (sn: string): Promise<VerifyScanResponse> => {
      await new Promise(resolve => setTimeout(resolve, 400)); // Network delay simulation
      
      const found = mockDbInstances.find(inst => inst.serialNumber === sn);
      if (!found) throw new Error("Serial number does not exist in the system.");
      
      // Prerequisite check: Must pass QC (PASSED or FAILED)
      if (found.status !== 'PASSED_QC' && found.status !== 'FAILED_QC') {
          throw new Error(`Product has not completed QC inspection (Current status: ${found.status})`);
      }
      
      return found;
  };

  // Flow 2 Simulation: Submit warehouse entry transaction
  const mockInductApi = async (sns: string[]): Promise<void> => {
      console.log("Submitting DB Transaction (D.3) for SNs:", sns);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Simulate success
  };

  // ==========================================
  // CORE LOGIC: SCAN PROCESSING (Dual Workflow)
  // ==========================================
  
  const handleScanSubmit = async (snToProcess: string) => {
    const sn = snToProcess.trim();
    if (!sn || isLoading) return;

    setIsLoading(true);
    setScanStatus('IDLE');
    setFeedbackMessage("");

    // --- INTERNAL FE DUPLICATE PREVENTION LOGIC ---
    if (stagingList.some(item => item.serialNumber === sn)) {
        // [AUDIO] Play "Buzz" sound (Mock: console.error)
        console.error("SOUND: Buzz (Duplicate)");
        setScanStatus('ERROR');
        setFeedbackMessage(`Serial [${sn}] is already in the staging list.`);
        setCurrentScan("");
        setIsLoading(false);
        inputRef.current?.focus();
        return;
    }

    try {
      // Call Mock API for validation
      const validatedData = await mockVerifyScanApi(sn);

      // --- SUCCESS ---
      // [AUDIO] Play standard "Beep" sound (Mock: console.log)
      console.log("SOUND: Beep (Success)");
      setScanStatus('SUCCESS');
      
      // Add to Staging List
      setStagingList(prev => [validatedData, ...prev]);
      
      // Reset input, maintain focus
      setCurrentScan(""); 
      setFeedbackMessage(`Received: ${sn}`);

    } catch (error: any) {
      // --- FAILURE ---
      // [AUDIO] Play "Buzz" sound (Mock: console.error)
      console.error("SOUND: Buzz (Error)");
      setScanStatus('ERROR');
      setFeedbackMessage(error.message || "Unknown error.");
      setCurrentScan(""); // Clear for next scan
    } finally {
      setIsLoading(false);
      // Always ensure focus is back on input after a render cycle
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Catch Enter key event from physical input flow
  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScanSubmit(currentScan);
    }
  };

  // Handle Flow 2: Demo Simulation (🎲)
  const handleAutoScanDemo = () => {
      // Get a random valid code from Mock DB
      const validMockSns = mockDbInstances.filter(inst => inst.status === 'PASSED_QC' || inst.status === 'FAILED_QC');
      if (validMockSns.length === 0) return alert("Mock DB has no valid codes.");
      
      const randomInst = validMockSns[Math.floor(Math.random() * validMockSns.length)];
      
      // Show fill-in effect for input
      setCurrentScan(randomInst.serialNumber);
      
      // Automatically trigger send after one cycle (simulate scan operation)
      setTimeout(() => {
          handleScanSubmit(randomInst.serialNumber);
      }, 100);
  };

  // ==========================================
  // STATISTICS & LIST PROCESSING LOGIC (SECTION 2)
  // ==========================================
  
  // Calculate Quick Stats
  const stats = useMemo(() => {
    const passCount = stagingList.filter(i => i.status === 'PASSED_QC').length;
    const failCount = stagingList.filter(i => i.status === 'FAILED_QC').length;
    return {
        total: stagingList.length,
        pass: passCount,
        fail: failCount
    };
  }, [stagingList]);

  // Remove one row from staging
  const removeFromStaging = (id: number) => {
      setStagingList(prev => prev.filter(item => item.productInstanceId !== id));
      inputRef.current?.focus();
  };

  // Finalize warehouse entry (Confirm Induction)
  const handleConfirmInduction = async () => {
      if (stagingList.length === 0 || isSubmitting) return;

      setIsSubmitting(true);
      const sns = stagingList.map(i => i.serialNumber);

      try {
          // Call API to finalize transaction (update stock card, change status)
          await mockInductApi(sns);

          alert(`Successfully completed receiving ${sns.length} products into the actual warehouse!`);
          
          // Clear list, reset scan station
          setStagingList([]);
          setScanStatus('IDLE');
          setFeedbackMessage("");
          inputRef.current?.focus();
      } catch (error) {
          alert("Error executing warehouse entry transaction.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- DYNAMIC CSS RENDER FOR INPUT FEEDBACK ---
  const inputApiClasses = useMemo(() => {
    const base = "w-full pl-12 pr-16 py-3 border rounded-xl text-lg font-mono font-bold outline-none transition-all duration-150";
    if (isLoading) return `${base} border-blue-300 bg-blue-50 text-blue-800 cursor-wait`;
    if (scanStatus === 'SUCCESS') return `${base} border-green-500 bg-green-50 text-green-900`;
    if (scanStatus === 'ERROR') return `${base} border-red-500 bg-red-50 text-red-900`;
    return `${base} border-gray-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`;
  }, [scanStatus, isLoading]);

  return (
    // Flex Col layout for visual scaling
    <div className="flex flex-col gap-5 h-[calc(100vh-120px)] animate-in fade-in duration-300">
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex items-center gap-6 flex-shrink-0">
        
        {/* Input & Feedback Zone */}
        <div className="flex-1 space-y-2 relative">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <ScanBarcode className="w-4 h-4" /> Barcode Input (Scan SN then Enter)
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
                  placeholder="Scan or enter Serial Number..." 
                  value={currentScan}
                  onChange={(e) => setCurrentScan(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  disabled={isLoading}
                  className={inputApiClasses}
                />
                
                {/* Demo Button (Dev Mode) */}
                <button 
                  onClick={handleAutoScanDemo}
                  disabled={isLoading}
                  title="🎲 Auto Scan (Flow Demo)"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                    <Zap className="w-4 h-4" />
                </button>
            </div>
            
            {/* UI Feedback message below input */}
            <div className="h-5">
                {feedbackMessage && (
                    <p className={`text-xs font-bold animate-in fade-in slide-in-from-top-1 ${scanStatus === 'ERROR' ? 'text-red-600' : 'text-green-600'}`}>
                       {scanStatus === 'ERROR' ? <XCircle className="w-3 h-3 inline mr-1" /> : <CheckCircle2 className="w-3 h-3 inline mr-1" />} {feedbackMessage}
                    </p>
                )}
            </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6 h-full">
            <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Total Scanned</p>
                <p className="text-2xl font-black text-gray-900 mt-0.5">{stats.total}</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-100 rounded-lg text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-green-600 uppercase flex items-center justify-center gap-1"><Check className="w-3 h-3"/> PASS</p>
                <p className="text-2xl font-black text-green-700 mt-0.5">{stats.pass}</p>
            </div>
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center min-w-[90px]">
                <p className="text-[10px] font-bold text-red-600 uppercase flex items-center justify-center gap-1"><X className="w-3 h-3"/> FAIL</p>
                <p className="text-2xl font-black text-red-700 mt-0.5">{stats.fail}</p>
            </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* SECTION 2: STAGING LIST (Waiting Area) */}
      {/* ========================================== */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        
        {/* Table Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-blue-600" /> Staging List (Temporary Cart)
          </h2>
          <p className="text-sm text-gray-500">Product scanned successfully, awaiting final warehouse entry confirmation.</p>
        </div>

        {/* Data Grid Body */}
        <div className="flex-1 overflow-y-auto">
          {stagingList.length > 0 ? (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-16 text-center">No.</th>
                  <th className="p-3">Serial Number</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">QC Result</th>
                  <th className="p-3">Target Routing (Destination)</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-100 font-medium text-gray-800">
                {stagingList.map((item, index) => {
                    const isPass = item.status === 'PASSED_QC';
                    // Automatically map default destination warehouse based on QC results
                    const targetWhId = isPass ? item.targetSalesWarehouseId : item.targetErrorWarehouseId;
                    const routingName = targetWhId ? WAREHOUSE_NAMES[targetWhId] : "N/A";

                    return (
                        <tr key={item.productInstanceId} className="hover:bg-gray-50/50">
                            <td className="p-3 w-16 text-center font-mono text-gray-400">{stagingList.length - index}</td>
                            <td className="p-3 font-mono font-black text-gray-900 text-sm">{item.serialNumber}</td>
                            <td className="p-3 font-bold text-sm">{item.productName} <span className="text-gray-400 font-normal ml-1">(ID: {item.productId})</span></td>
                            <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold border ${isPass ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                    {isPass ? <CheckCircle2 className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                                    {isPass ? "PASSED" : "FAILED"}
                                </span>
                            </td>
                            <td className="p-3">
                                <div className={`flex items-center gap-2 font-bold text-xs ${isPass ? 'text-gray-800' : 'text-red-800'}`}>
                                    <Package className="w-3.5 h-3.5 text-gray-400" />
                                    {routingName}
                                </div>
                            </td>
                            <td className="p-3 text-center">
                                <button 
                                  onClick={() => removeFromStaging(item.productInstanceId)}
                                  title="Remove from cart"
                                  className="p-1.5 bg-white border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors cursor-pointer"
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
              <p className="font-bold text-lg text-gray-500">Induction station is empty</p>
              <p className="text-sm">Please scan Serial Number in SECTION 1 to start grouping batches for warehouse entry.</p>
            </div>
          )}
        </div>

        {/* Footer Actions (SECTION 2 - Bottom) */}
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
            className="px-6 py-2.5 flex items-center gap-2 bg-green-600 text-white font-bold text-sm rounded-lg hover:bg-green-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirm Induction ({stagingList.length} items)
          </button>
        </div>
      </div>



    </div>
  );
};