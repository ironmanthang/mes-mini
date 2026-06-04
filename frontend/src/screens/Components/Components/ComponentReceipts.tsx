import { useState, useEffect, type JSX } from "react";
import { Search, ChevronsDown, ShoppingCart } from "lucide-react";
import { purchaseOrderService, type PurchaseOrder, type PurchaseOrderDetail } from "../../../services/purchaseOrderServices";

export const ComponentReceipts = (): JSX.Element => {
    const [searchTerm, setSearchTerm] = useState("");
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }

    const [selectedPO, setSelectedPO] = useState<string | null>(null);
    const handlePOChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPO(e.target.value);
    }

    const [qcCheckType, setQCCheckType] = useState<"pass" | "fail">("pass");
    const handleQCCheckChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setQCCheckType(e.target.value as "pass" | "fail");
    }

    const [poList, setPOList] = useState<PurchaseOrder[]>([]);

    const [selectedPODetail, setSelectedPODetail] = useState<PurchaseOrderDetail | null>(null);

    const fetchPODetail = async (poid: string) => {
        try {
            const response = await purchaseOrderService.getPOById(Number(poid));
            setSelectedPODetail(response);
        } catch (error) {
            console.error("Error fetching purchase order detail:", error);
        } finally { console.log("Fetch PO detail completed"); }
    }

    const fetchPOs = async () => {
        try {
            const response = await purchaseOrderService.getAllPOs();
            setPOList(response.data);
        } catch (error) {
            console.error("Error fetching purchase orders:", error);
        } finally { console.log("Fetch POs completed"); }
    }

    useEffect(() => {
        fetchPOs();
        if (selectedPO) { fetchPODetail(selectedPO); }
    }, [selectedPO]);

    return(
        <div className="space-y-6 pb-12">
            <div className="border-1 border-gray-300 rounded-lg">
                <div className="p-4 flex gap-4 flex-wrap">
                    <div className="relative min-w-xs">
                        <Search className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            id="receipt-search"
                            name=""
                            type="text"
                            value={searchTerm}
                            placeholder="Search by receipt number, supplier, or date"
                            onChange={handleSearchChange}
                            className="w-full py-2 bg-transparent border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 
                            focus:outline-none focus:border-blue-600 transition duration 300 text-sm pl-6"
                        />
                    </div>
                    
                    <div className="relative">
                        <select
                            id="po-filter"
                            value={selectedPO || ""}
                            onChange={handlePOChange}
                            className="appearance-none px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm 
                            shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                            transition duration-200 min-w-xs">
                            <option value="" disabled>-- Select a PO --</option>
                            {poList.map((po) => (
                                <option key={po.purchaseOrderId} value={po.purchaseOrderId}>
                                    {po.code} - {po.supplier.supplierName}
                                </option>
                            ))}
                        </select>

                        <ChevronsDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                </div>
            </div>

            {selectedPODetail ? <div className="grid grid-cols-2 grid-rows-2 gap-4">
                <div className="flex-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md 
                        tracking-wide"> {selectedPODetail.code}
                        </span>
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-700 rounded-full">
                            <ShoppingCart className="w-5 h-5"/>
                        </div>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 mb-4 line-clamp-1">
                        {selectedPODetail.supplier.supplierName}
                    </h3>

                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-sm">
                        <div>
                            <span className="block text-sm font-medium text-gray-400 uppercase tracking-wider">Order date: </span>
                            <span className="font-semibold text-gray-700 mt-0.5 block">{selectedPODetail.orderDate}</span>
                        </div>
                    </div>
                </div>

                <div className="row-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex-3 hover:shadow-md 
                transition-shadow duration-300 overflow-y-auto flex flex-col gap-3 h-96">
                    {selectedPODetail.details.map((detail) => (
                        <div key={detail.purchaseOrderDetailId}
                        className="w-full bg-white border border-gray-300 rounded-2xl shadow-sm p-5 hover:shadow-md
                        transition-shadow duration-300">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
                                <h4 className="text-base font-bold text-gray-900 leading-tight">
                                    {detail.component.componentName}</h4>
                                <p className="text-sm text-gray-400 mt-1">Unit: <span> </span>
                                    <span className="text-gray-600 font-medium">{detail.component.unit}</span></p>
                            </div>

                            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl mb-4 text-center">
                                <div>
                                    <span className="text-sm font-semibold text-blue-400 uppercase">
                                        Ordered: <span className="block text-sm font-bold text-gray-700 mt-0.5">{detail.quantityOrdered}</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sm font-semibold text-emerald-400 uppercase">
                                        Received: <span className="block text-sm font-bold text-gray-700 mt-0.5">{detail.quantityReceived}</span>
                                    </span>
                                </div>

                                <div>
                                    <span className="text-sm font-semibold text-red-400 uppercase">
                                        Remaining: <span className="block text-sm font-bold text-gray-700 mt-0.5">{detail.quantityOrdered - detail.quantityReceived}</span>
                                    </span>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="reality"
                                className="block text-sm font-bold text-gray-700 mb-1">Reality</label>
                                <input type="number" 
                                id="reality"
                                className="w-full py-2 bg-transparent border-b-2 border-gray-300 text-gray-900 placeholder-gray-400 
                                focus:outline-none focus:border-blue-600 transition duration 300 text-sm"
                                placeholder="Enter reality..."
                                />
                            </div>

                            <div>
                                <label htmlFor="qc-check"
                                className="block text-sm font-bold text-gray-700 mb-1">QC Check</label>
                                <select
                                id="qc-check"
                                className= {`w-full px-3 py-2 rounded-lg font-bold
                                text-sm focus:outline-none border
                                ${qcCheckType === "pass" ? "bg-emerald-100 border-emerald-300 text-emerald-700" 
                                : "bg-red-100 border-red-300 text-red-700"}`}
                                onChange={handleQCCheckChange}
                                value={qcCheckType}
                                >
                                    <option value="pass">Pass</option>
                                    <option value="fail">Fail</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>


            </div> : <div className="w-full border border-gray-300 rounded-lg p-4 border-dashed border-2 flex items-center 
            justify-center gap-2">
                <span className=""><Search className="w-5 h-5 text-gray-400"/></span>
                <h6 className="text-gray-500">Select a Purchase Order to view its details</h6>
            </div>}
            
        </div>
    )
}