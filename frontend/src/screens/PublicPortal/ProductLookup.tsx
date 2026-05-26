import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search, CheckCircle2, XCircle, Package, Factory,
  ClipboardCheck, ShieldCheck, AlertTriangle, Calendar,
  Cpu, ChevronRight, Phone, Shield, ArrowLeft
} from "lucide-react";
import { ProductInstanceServices } from "../../services/productInstanceServices";

// ─── Types ───────────────────────────────────────────────────────────
interface ProductPassport {
  serialNumber: string;
  productName: string;
  productCode: string;
  status: string;
  batch: {
    batchCode: string;
    productionDate: string;
    expiryDate: string | null;
  };
  origin: {
    lineName: string;
    location: string | null;
  } | null;
  workOrder: {
    code: string;
  };
  qualityCheck: {
    result: string;
    checkDate: string;
    checklistName: string;
  } | null;
  components: {
    id: number;
    code: string;
    componentName: string;
    specification: string;
  }[];
  warranty: {
    activationDate: string;
    expiryDate: string;
    customerName: string;
  } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────
const maskName = (name: string) => {
  const parts = name.split(" ");
  return parts.map((p, i) => i === parts.length - 1 ? p : p[0] + "***").join(" ");
};

const daysBetween = (from: string, to: string) => {
  const diff = new Date(to).getTime() - new Date(from).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const formatRemaining = (expiryDate: string) => {
  const days = daysBetween(new Date().toISOString(), expiryDate);
  if (days <= 0) return { text: "Expired", active: false };
  const months = Math.floor(days / 30);
  const rem = days % 30;
  return { text: `${months} month${months !== 1 ? "s" : ""} ${rem} day${rem !== 1 ? "s" : ""} remaining`, active: true };
};

const statusLabel: Record<string, { label: string; color: string }> = {
  IN_STOCK_SALES: { label: "In Stock", color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Shipped", color: "bg-purple-100 text-purple-700" },
  DEFECTIVE: { label: "Defective", color: "bg-red-100 text-red-700" },
  WARRANTY: { label: "Under Warranty", color: "bg-green-100 text-green-700" },
};

// ─── Component ───────────────────────────────────────────────────────
export const ProductLookup = () => {
  const { serialNumber: snParam } = useParams<{ serialNumber?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState(snParam ?? "");
  const [data, setData] = useState<ProductPassport | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");

  const doLookup = async (sn: string) => {
    if (!sn.trim()) return;
    setStatus("loading");
    try {
      const instance = await ProductInstanceServices.getProductInstanceById(sn.trim());
      
      const mappedData: ProductPassport = {
        serialNumber: instance.serialNumber,
        productName: instance.product.productName,
        productCode: instance.product.code,
        status: instance.status,
        batch: {
          batchCode: instance.productionBatch.batchCode,
          productionDate: instance.productionBatch.productionDate,
          expiryDate: instance.productionBatch.expiryDate,
        },
        origin: instance.productionBatch.productionLine ? {
          lineName: instance.productionBatch.productionLine.lineName,
          location: instance.productionBatch.productionLine.location,
        } : (instance.productionBatch.workOrder.productionLine ? {
          lineName: instance.productionBatch.workOrder.productionLine.lineName,
          location: instance.productionBatch.workOrder.productionLine.location,
        } : null),
        workOrder: {
          code: instance.productionBatch.workOrder.code,
        },
        qualityCheck: instance.qualityChecks?.[0] ? {
          result: instance.qualityChecks[0].result,
          checkDate: instance.qualityChecks[0].checkDate,
          checklistName: instance.qualityChecks[0].checklist.checklistName,
        } : null,
        components: instance.product.bom?.map((b: any) => ({
          id: b.component.componentId,
          code: b.component.code,
          componentName: b.component.componentName,
          specification: b.component.description || "",
        })) || [],
        warranty: instance.warranty ? {
          activationDate: instance.warranty.activationDate,
          expiryDate: instance.warranty.expiryDate,
          customerName: instance.warranty.customer?.customerName || "Customer",
        } : null,
      };

      setData(mappedData);
      setStatus("found");
    } catch (error) {
      console.error("Lookup failed:", error);
      setData(null);
      setStatus("not_found");
    }
  };

  useEffect(() => {
    if (snParam) doLookup(snParam);
  }, [snParam]);

  const warrantyInfo = data?.warranty ? (() => {
    const total = daysBetween(data.warranty.activationDate, data.warranty.expiryDate);
    const used = daysBetween(data.warranty.activationDate, new Date().toISOString());
    const pct = Math.min(100, Math.max(0, Math.round((used / total) * 100)));
    const rem = formatRemaining(data.warranty.expiryDate);
    return { total, used, pct, rem };
  })() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 [font-family:'Inter',sans-serif]">
      {/* ── Topbar ── */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              <span className="font-black text-gray-900 text-lg tracking-tight">Product Passport</span>
            </div>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:block">Powered by MES Traceability System</span>
        </div>
      </div>

      {/* ── Search Hero ── */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Verify Your Product</h1>
          <p className="text-gray-500 text-lg font-medium">Enter the Serial Number printed on your product or packaging to view its complete lifecycle record.</p>
        </div>

        <div className="flex gap-3 max-w-2xl mx-auto mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLookup(query)}
              placeholder="e.g. SN-SW-001234"
              className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-2xl text-base font-mono font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-white shadow-sm"
            />
          </div>
          <button
            onClick={() => doLookup(query)}
            disabled={status === "loading"}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Searching..." : "Look Up"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 font-medium mb-12">
          Try: <button onClick={() => { setQuery("SN-DEMO-SW-0001"); doLookup("SN-DEMO-SW-0001"); }} className="text-blue-500 hover:underline font-bold">SN-DEMO-SW-0001</button>
          {" · "}
          <button onClick={() => { setQuery("SN-DEMO-GPC-0001"); doLookup("SN-DEMO-GPC-0001"); }} className="text-blue-500 hover:underline font-bold">SN-DEMO-GPC-0001</button>
        </p>

        {/* ── Not Found ── */}
        {status === "not_found" && (
          <div className="max-w-xl mx-auto bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-red-800 mb-2">Product Not Found</h2>
            <p className="text-red-600 font-medium">No record found for serial number <span className="font-mono font-black">"{query}"</span>. This product may be counterfeit or the serial number was entered incorrectly.</p>
            <p className="text-sm text-red-400 mt-4">If you believe this is an error, please contact our customer support.</p>
          </div>
        )}

        {/* ── Result ── */}
        {status === "found" && data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* MỤC 1: Identity & Verification */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-lg p-10">
              <div className="max-w-3xl mx-auto flex flex-col gap-6">
                {/* Verification Badge */}
                <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2 w-fit">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm font-bold text-green-800">Database Record Verified</span>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-gray-900 leading-tight">{data.productName}</h2>
                  <p className="text-sm text-gray-400 font-bold mt-1">{data.productCode}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Serial Number</span>
                    <span className="font-mono font-black text-gray-900 text-sm bg-gray-100 px-3 py-1 rounded-lg">{data.serialNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-500">Product Status</span>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full uppercase ${statusLabel[data.status]?.color ?? "bg-gray-100 text-gray-600"}`}>
                      {statusLabel[data.status]?.label ?? data.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-bold text-gray-500">Production Date</span>
                    <span className="text-sm font-bold text-gray-700">{new Date(data.batch.productionDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MỤC 2: Manufacturing Milestones */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Factory className="w-5 h-5 text-blue-600" /> Manufacturing Milestones
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Batch */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Batch Info</p>
                  <p className="font-black text-gray-900 text-sm">{data.batch.batchCode}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(data.batch.productionDate).toLocaleDateString("en-GB")}
                  </p>
                  {data.batch.expiryDate && (
                    <p className="text-xs text-orange-500 font-bold mt-1">Expires: {new Date(data.batch.expiryDate).toLocaleDateString("en-GB")}</p>
                  )}
                </div>

                {/* Card 2: Origin */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                    <Factory className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Production Origin</p>
                  <p className="font-black text-gray-900 text-sm">{data.origin?.lineName ?? "Unassigned"}</p>
                  {data.origin?.location && (
                    <p className="text-xs text-gray-500 font-medium mt-1">{data.origin.location}</p>
                  )}
                </div>

                {/* Card 3: Work Order */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:border-blue-300 transition-colors">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                    <ClipboardCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Work Order Trace</p>
                  <p className="font-mono font-black text-gray-900 text-sm">{data.workOrder.code}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Officially documented production order</p>
                </div>

                {/* Card 4: Quality */}
                <div className={`rounded-2xl border shadow-sm p-5 ${data.qualityCheck?.result === "PASSED" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-3 shadow-sm">
                    <ShieldCheck className={`w-5 h-5 ${data.qualityCheck?.result === "PASSED" ? "text-green-600" : "text-red-500"}`} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quality Assurance</p>
                  {data.qualityCheck ? (
                    <>
                      <p className={`font-black text-sm uppercase ${data.qualityCheck.result === "PASSED" ? "text-green-700" : "text-red-700"}`}>
                        {data.qualityCheck.result === "PASSED" ? "✓ PASSED" : "⚠ FAILED"}
                      </p>
                      <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(data.qualityCheck.checkDate).toLocaleDateString("en-GB")}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-gray-500">No QC record found</p>
                  )}
                </div>
              </div>
            </div>

            {/* MỤC 3: Key Components */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-gray-900">Key Components</h3>
                <span className="ml-auto text-xs font-bold text-gray-400 uppercase tracking-widest">Bill of Materials</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-500 tracking-widest border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">#</th>
                      <th className="px-6 py-3">Component Name</th>
                      <th className="px-6 py-3">Code</th>
                      <th className="px-6 py-3">Specification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {data.components.map((c, i) => (
                      <tr key={c.id} className="hover:bg-blue-50/20 transition-colors">
                        <td className="px-6 py-4 text-gray-400 font-mono">{i + 1}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{c.componentName}</td>
                        <td className="px-6 py-4"><span className="font-mono text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{c.code}</span></td>
                        <td className="px-6 py-4 text-gray-500">{c.specification}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MỤC 4: Warranty */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-gray-900">Warranty Status</h3>
              </div>

              {data.warranty && warrantyInfo ? (
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Progress bar section */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-700">{warrantyInfo.rem.active ? "Active Warranty" : "Warranty Expired"}</p>
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${warrantyInfo.rem.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {warrantyInfo.rem.text}
                        </span>
                      </div>
                      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-4 rounded-full transition-all duration-1000 ${warrantyInfo.rem.active ? "bg-gradient-to-r from-blue-500 to-green-400" : "bg-gray-300"}`}
                          style={{ width: `${warrantyInfo.pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{warrantyInfo.pct}% of warranty period used</p>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Activation Date</p>
                          <p className="font-black text-gray-800">{new Date(data.warranty.activationDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiry Date</p>
                          <p className={`font-black ${warrantyInfo.rem.active ? "text-gray-800" : "text-red-600"}`}>{new Date(data.warranty.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer + Action */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Registered To</p>
                        <p className="font-black text-blue-800 text-lg">{maskName(data.warranty.customerName)}</p>
                      </div>
                      <button
                        onClick={() => alert("Redirecting to Customer Support...")}
                        className="w-full flex items-center justify-between px-5 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl transition-all active:scale-95 shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>Request Support</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 flex items-center gap-4 bg-amber-50/50">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-black text-amber-800">Warranty Not Activated</p>
                    <p className="text-sm text-amber-600 font-medium mt-1">This product's warranty has not been activated yet. Please contact your nearest authorized dealer to register and activate your warranty.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gray-100 mt-8">
        <p className="text-xs text-gray-400 font-medium">© 2024 MES Traceability Portal · All product information is secured and verified.</p>
      </footer>
    </div>
  );
};
