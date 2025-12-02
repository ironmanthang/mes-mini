import { 
  Package, 
  Save, 
  Send, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import { useState, type JSX } from "react";

// --- Mock Data: Danh sách sản phẩm ---
const products = [
  { id: "PROD001", name: "Gaming Laptop X1", category: "Electronics" },
  { id: "PROD002", name: "Mechanical Keyboard", category: "Accessories" },
  { id: "PROD003", name: "Wireless Mouse", category: "Accessories" },
  { id: "PROD004", name: "Smart Watch V2", category: "Wearables" },
];

export const CreateProductionRequest = (): JSX.Element => {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState<"Pending" | "Draft">("Pending"); // Mặc định hiển thị Pending

  const handleSaveDraft = () => {
    setStatus("Draft");
    console.log("Saved as Draft", { productId, quantity, priority, status: "DRAFT" });
    alert("Request saved as Draft!");
  };

  const handleSubmit = () => {
    setStatus("Pending");
    console.log("Submitted for Approval", { productId, quantity, priority, status: "PENDING" });
    alert("Request submitted for Approval!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Create Production Request
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Submit a request to start a new manufacturing batch.
            </p>
          </div>
          
          <div className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 border ${
            status === "Pending" 
              ? "bg-yellow-50 text-yellow-700 border-yellow-200" 
              : "bg-gray-100 text-gray-600 border-gray-200"
          }`}>
            {status === "Pending" ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Product Selection<span className="text-red-500">*</span>
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 f
                ocus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Priority
              </label>
              <div className="flex gap-4">
                {["High", "Medium", "Low"].map((level) => (
                  <label key={level} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value={level}
                      checked={priority === level}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                    />
                    <span className={`ml-2 text-sm ${
                      level === "High" ? "text-red-600 font-medium" : "text-gray-700"
                    }`}>
                      {level}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cột Phải */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Quantity to Produce<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={quantity || ""}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity..."
                  className="w-full p-3 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm">Units</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Request Summary</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>Product: <span className="font-medium">{products.find(p => p.id === productId)?.name || "Not selected"}</span></p>
                <p>Est. Completion: <span className="font-medium">Calculated upon submission</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          onClick={handleSaveDraft}
          className="flex items-center gap-2 px-6 py-2.5 bg-white 
          border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 
          transition-colors shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          Save as Draft
        </button>
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2EE59D] 
          text-white font-medium rounded-lg hover:bg-[#25D390] transition-colors 
          shadow-md cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Submit for Approval
        </button>
      </div>
    </div>
  );
};