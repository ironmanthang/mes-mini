import { 
  Search, Filter, ArrowLeft, QrCode, Barcode, Printer, 
  FileDown, Loader2, PackageSearch, Calendar, Settings2, Layers
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { MaterialRequestServices, type MaterialRequest, type MaterialRequestDetail } from "../../../services/materialRequestServices";

export const ComponentBarcodes = (): JSX.Element => {
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [requestDetails, setRequestDetails] = useState<MaterialRequestDetail[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<number | "">("");

  const [symbology, setSymbology] = useState<'QR' | 'CODE128'>('QR');
  const [labelQty, setLabelQty] = useState<number>(1);
  const [template, setTemplate] = useState<'50x30' | '35x22'>('50x30');
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const fetchIssuedRequests = async () => {
        setIsLoading(true);
        try {
            const response = await MaterialRequestServices.getAllMaterialRequests({ status: 'ISSUED' });
            const dataArray = Array.isArray(response) ? response : (response as any).data || [];
            setRequests(dataArray);
        } catch (error) {
            console.error("Failed to fetch issued requests:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchIssuedRequests();
  }, []);

  useEffect(() => {
    if (selectedRequest) {
      setIsLoadingDetails(true);
      MaterialRequestServices.getMaterialRequestById(selectedRequest.requestId)
        .then((res) => {
            const details = res.details || [];
            setRequestDetails(details);
            
            if (details.length > 0) {
                setSelectedComponentId(details[0].componentId);
                setLabelQty(details[0].quantity);
            }
        })
        .catch(err => console.error("Error loading request details:", err))
        .finally(() => setIsLoadingDetails(false));
        
      setSymbology('QR');
    } else {
        setRequestDetails([]);
        setSelectedComponentId("");
    }
  }, [selectedRequest]);

  const handleComponentChange = (compId: number) => {
      setSelectedComponentId(compId);
      const comp = requestDetails.find(d => d.componentId === compId);
      if (comp) setLabelQty(comp.quantity);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const q = searchQuery.toLowerCase();
      return req.workOrder?.code?.toLowerCase().includes(q) || 
             req.code?.toLowerCase().includes(q);
    });
  }, [requests, searchQuery]);

  const activeComponent = requestDetails.find(d => d.componentId === selectedComponentId);

  const finalBarcodeString = (selectedRequest && activeComponent)
    ? `COMP_${activeComponent.component.code}_REQ_${selectedRequest.code}_WO_${selectedRequest.workOrder?.code || 'N/A'}`
    : "";

  const handlePrintLabels = async () => {
    if (!selectedRequest || !activeComponent) return;
    
    window.print();

    setIsPrinting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      alert("Print command sent successfully!");
    } catch (error) {
      alert("Error updating status.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleExportPDF = () => {
    alert("PDF export is under development. Please use the Print feature and select 'Save as PDF'.");
  };

  if (!selectedRequest) {
    return (
      <div className="flex flex-col gap-6 pb-12 animate-in fade-in duration-300">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <QrCode className="w-6 h-6 text-blue-600" /> Component Barcodes
            </h2>
            <p className="text-sm text-gray-500 mt-1">Create and print identification labels for components issued from material requests.</p>
          </div>

          <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input 
                type="text" placeholder="Search by Request Code, Work Order..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" 
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 text-gray-600 font-medium rounded-lg text-sm cursor-pointer hover:bg-gray-100">
              <Filter className="w-4 h-4"/> Filters
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold border-b">
                  <tr>
                    <th className="p-4">Export Code (Request)</th>
                    <th className="p-4">Work Order</th>
                    <th className="p-4 text-center">Component Types</th>
                    <th className="p-4">Export Date</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-blue-600">{req.code}</td>
                      <td className="p-4 font-bold text-gray-700">{req.workOrder?.code || "N/A"}</td>
                      <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded text-xs border border-gray-200">
                              <Layers className="w-3.5 h-3.5" /> {req._count?.details || 0}
                          </span>
                      </td>
                      <td className="p-4 text-gray-600 flex items-center gap-1.5 mt-1">
                          <Calendar className="w-3.5 h-3.5" /> 
                          {req.completedAt ? new Date(req.completedAt).toLocaleDateString('en-US') : new Date(req.requestDate).toLocaleDateString('en-US')}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => setSelectedRequest(req)}
                          className="flex items-center justify-center gap-1.5 px-4 py-1.5 mx-auto bg-[#22c55e] text-white font-bold rounded hover:bg-[#16a34a] transition-colors text-xs cursor-pointer shadow-sm active:scale-95"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Configure Barcodes
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRequests.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-400">No material issue requests found.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MÀN HÌNH 2 - CẤU HÌNH & IN (DETAIL VIEW)
  // ==========================================
  return (
    <div className="flex flex-col gap-6 pb-20 animate-in slide-in-from-right-4 duration-300 print:m-0 print:p-0">
      
      {/* UI ẨN KHI IN */}
      <div className="print:hidden">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setSelectedRequest(null)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
            <h2 className="text-2xl font-bold text-gray-900">Barcode Generation & Printing</h2>
            <p className="text-sm text-gray-500 font-mono">Target Request: {selectedRequest.code}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* CỘT TRÁI: THÔNG TIN & CẤU HÌNH */}
            <div className="lg:col-span-7 space-y-6">
                
                {/* Vùng 1: Reference Info & Component Selection */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <PackageSearch className="w-5 h-5 text-blue-600" /> Zone 1: Reference Info
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Export / Request Ref</span>
                            <span className="text-sm font-mono font-bold text-gray-900">{selectedRequest.code}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Work Order Ref</span>
                            <span className="text-sm font-bold text-gray-900">{selectedRequest.workOrder?.code || 'N/A'}</span>
                        </div>
                        
                        {/* Selector Linh Kiện */}
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 col-span-2 space-y-2">
                            <label className="text-sm font-bold text-blue-800 flex items-center gap-2"
                            htmlFor="select-component">
                                <Layers className="w-4 h-4"/> Select component to print label:
                            </label>
                            {isLoadingDetails ? (
                                <div className="text-sm text-blue-600 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin"/> Loading components...</div>
                            ) : (
                                <select 
                                    value={selectedComponentId} 
                                    onChange={(e) => handleComponentChange(Number(e.target.value))}
                                    className="w-full p-2.5 border border-blue-200 bg-white rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                                    id="select-component"
                                    name="selectComponent"
                                >
                                    {requestDetails.map(d => (
                                        <option key={d.componentId} value={d.componentId}>
                                            {d.component.code} - {d.component.componentName} (Issued: {d.quantity} {d.component.unit})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {activeComponent && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200 col-span-2 flex justify-between items-center animate-in slide-in-from-top-1">
                                <span className="text-xs font-bold text-green-700 uppercase">Received Quantity:</span>
                                <span className="text-xl font-black text-green-700">{activeComponent.quantity} <span className="text-sm font-medium">{activeComponent.component.unit}</span></span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Vùng 2: Barcode Logic Config */}
                <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity ${!activeComponent ? 'opacity-50 pointer-events-none' : ''}`}>
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Settings2 className="w-5 h-5 text-blue-600" /> Zone 2: Logic Configuration
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1.5">Barcode String (Auto-generated)
                              <input 
                                type="text" readOnly value={finalBarcodeString}
                                className="w-full p-3 bg-gray-100 mt-1
                                border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-600"
                                id="barcode-string"
                                name="barcodeString"
                              />
                            </label>
                            
                            <p className="text-[10px] text-gray-500 mt-1">Formula: COMP_[Code]_REQ_[ReqCode]_WO_[WO_Code]</p>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1.5">Symbology
                              <select 
                                value={symbology} onChange={(e) => setSymbology(e.target.value as any)}
                                className="w-full p-2.5 border mt-1
                                border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                id="symbology"
                                name="symbology"
                              >
                                  <option value="QR">QR Code (Recommended for compact tags)</option>
                                  <option value="CODE128">Code 128 (Standard linear barcode)</option>
                              </select>
                            </label>
                            
                        </div>
                    </div>
                </div>
            </div>

            {/* CỘT PHẢI: LABEL SETTINGS, PREVIEW & ACTIONS */}
            <div className={`lg:col-span-5 space-y-6 transition-opacity ${!activeComponent ? 'opacity-50 pointer-events-none' : ''}`}>
                
                {/* Vùng 3: Settings & Preview */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-gray-900 uppercase flex items-center gap-2 border-b pb-3">
                        <Printer className="w-5 h-5 text-blue-600" /> Zone 3: Settings & Preview
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">Labels to Print
                              <input 
                                type="number" min="1" max={activeComponent?.quantity || 1}
                                value={labelQty} onChange={(e) => setLabelQty(Number(e.target.value))}
                                className="w-full p-2 border mt-1
                                border-gray-300 rounded-lg text-sm text-center font-bold outline-none focus:ring-2 focus:ring-blue-500"
                                id="label-to-print"
                                name="labelToPrint"
                              />
                            </label>
                            
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-700 uppercase block mb-1.5">Template
                              <select 
                                value={template} onChange={(e) => setTemplate(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 mt-1
                                rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                id="label-template"
                                name="labelTemplate"
                              >
                                  <option value="50x30">50x30 mm (Large)</option>
                                  <option value="35x22">35x22 mm (Small)</option>
                              </select>
                            </label>
                            
                        </div>
                    </div>

                    {/* KHUNG PREVIEW ĐỒ HỌA */}
                    <div className="mt-4 border-2 border-dashed border-gray-300 bg-gray-100 rounded-xl p-6 flex justify-center items-center">
                        {/* Simulation của 1 con tem */}
                        <div className={`bg-white border border-gray-400 shadow-md p-4 flex flex-col items-center justify-between relative overflow-hidden transition-all
                            ${template === '50x30' ? 'w-[280px] h-[168px]' : 'w-[220px] h-[138px] scale-90'}
                        `}>
                            {/* Header */}
                            <div className="w-full text-center border-b border-gray-300 pb-1 mb-1">
                                <h4 className="text-[10px] font-black uppercase truncate">{activeComponent?.component.componentName || 'No component'}</h4>
                            </div>
                            
                            {/* Body: Barcode/QR */}
                            <div className="flex-1 w-full flex items-center justify-center">
                                {symbology === 'QR' ? (
                                    <QrCode className="w-16 h-16 text-black" /> 
                                ) : (
                                    <Barcode className="w-24 h-12 text-black" /> 
                                )}
                            </div>
                            
                            {/* Footer: Date & Final String */}
                            <div className="w-full text-center mt-1">
                                <p className="text-[8px] font-bold">RECV: {selectedRequest?.completedAt ? new Date(selectedRequest.completedAt).toLocaleDateString('en-US') : 'N/A'}</p>
                                <p className="text-[6px] font-mono text-gray-600 mt-0.5 truncate">{finalBarcodeString}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <button 
                        onClick={handleExportPDF}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <FileDown className="w-4 h-4" /> Export PDF
                    </button>
                    <button 
                        onClick={handlePrintLabels}
                        disabled={isPrinting || !activeComponent}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />} 
                        {isPrinting ? "Saving Status..." : `Print ${labelQty} Labels`}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="hidden print:block print:w-full print:h-full">
         {activeComponent && Array.from({ length: labelQty }).map((_, i) => (
            <div key={i} className={`flex flex-col items-center justify-between border border-black bg-white box-border break-inside-avoid mb-4
                ${template === '50x30' ? 'w-[50mm] h-[30mm] p-1' : 'w-[35mm] h-[22mm] p-0.5'}
            `}>
                <div className="w-full text-center border-b border-black pb-0.5">
                    <h4 className={`${template === '50x30' ? 'text-[8px]' : 'text-[6px]'} font-black uppercase truncate leading-none`}>
                        {activeComponent.component.componentName}
                    </h4>
                </div>
                
                <div className="flex-1 w-full flex items-center justify-center">
                    {symbology === 'QR' ? (
                        <QrCode className={template === '50x30' ? 'w-10 h-10 text-black' : 'w-6 h-6 text-black'} strokeWidth={1.5} />
                    ) : (
                        <div className="flex flex-col items-center">
                           <Barcode className={template === '50x30' ? 'w-16 h-6 text-black' : 'w-12 h-4 text-black'} strokeWidth={1} />
                        </div>
                    )}
                </div>
                
                <div className="w-full text-center">
                    <p className={`${template === '50x30' ? 'text-[5px]' : 'text-[4px]'} font-mono leading-none truncate px-1`}>
                        {finalBarcodeString}
                    </p>
                </div>
            </div>
         ))}
      </div>

      <style>{`
        @media print {
          @page { margin: 0; }
          body { 
            background: white; 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact;
          }
          /* Remove extra padding from parent containers if any */
          .pb-20, .p-8 { padding: 0 !important; }
        }
      `}</style>

    </div>
  );
};