import { 
  X, Calculator, Package, TrendingUp, 
  DollarSign, Info, CheckCircle2, Loader2 
} from "lucide-react";
import { useState, type JSX } from "react";
import { type WorkOrderListItem } from "../../../services/workOrderServices";

interface CostDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderListItem;
  onSuccess?: () => void;
}

export const CostDeclarationModal = ({ isOpen, onClose, workOrder, onSuccess }: CostDeclarationModalProps): JSX.Element | null => {
  const [operatingCost, setOperatingCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'INPUT' | 'SUCCESS'>('INPUT');

  // Simulated material cost based on Work Order quantity
  const simulatedMaterialCost = workOrder.quantity * 15.5; // Example $15.5 per unit material cost
  const totalCost = simulatedMaterialCost + (Number(operatingCost) || 0);
  const costPerUnit = workOrder.quantity > 0 ? totalCost / workOrder.quantity : 0;

  if (!isOpen) return null;

  const handleFinalize = async () => {
    setIsSubmitting(true);
    // Simulate API call to D.4c service
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setStep('SUCCESS');
    if (onSuccess) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-100 text-green-700 rounded-xl shadow-inner">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Finalize & Declare Cost</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Feature D.4c | Cost Absorption</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'INPUT' ? (
          <div className="p-8 space-y-8 animate-in slide-in-from-bottom-4">
            
            {/* WO Header Info */}
            <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <span className="text-[10px] font-black text-blue-600 uppercase block tracking-widest mb-1">Analyzing Order</span>
                    <span className="text-sm font-mono font-bold text-blue-900">{workOrder.code}</span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase block tracking-widest mb-1">Target Product</span>
                    <span className="text-sm font-bold text-gray-900 truncate block">{workOrder.product.productName}</span>
                </div>
            </div>

            {/* Calculated Material Costs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" /> Material Cost Summary
                    </h4>
                    <span className="text-[10px] font-bold text-gray-400">Source: Purchase Order History</span>
                </div>
                
                <div className="p-5 bg-gray-900 text-white rounded-2xl shadow-lg flex justify-between items-center relative overflow-hidden">
                    <DollarSign className="absolute -right-4 -top-4 w-24 h-24 text-white/5" />
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Auto-calculated Total</p>
                        <p className="text-3xl font-black">${simulatedMaterialCost.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Quantity</p>
                        <p className="text-xl font-bold">{workOrder.quantity} {workOrder.product.unit}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium px-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>System automatically traces back all material issue notes for this WO to original PO unit prices.</span>
                </div>
            </div>

            {/* Manual Operating Cost Input */}
            <div className="space-y-4 pt-2">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" /> Operating Cost (Labor & Utilities)
                </h4>
                <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="number"
                        value={operatingCost}
                        onChange={(e) => setOperatingCost(Number(e.target.value))}
                        className="w-full pl-12 pr-6 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xl font-black text-gray-900 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-gray-300"
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* Final Distribution Preview */}
            <div className="p-6 bg-green-50 rounded-2xl border border-green-100 space-y-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-green-800">Total Absorption Cost:</span>
                    <span className="font-black text-green-900 text-lg">${totalCost.toLocaleString()}</span>
                </div>
                <div className="h-px bg-green-200"></div>
                <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-green-600 uppercase block tracking-widest">Frozen Cost per Unit</span>
                        <p className="text-2xl font-black text-green-900">${costPerUnit.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-green-100">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
                <button 
                    onClick={onClose}
                    className="flex-1 py-4 border border-gray-200 text-gray-700 font-black text-sm rounded-2xl hover:bg-gray-50 transition-all cursor-pointer"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleFinalize}
                    disabled={isSubmitting}
                    className="flex-[2] py-4 bg-gray-900 text-white font-black text-sm rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                    Freeze & Close Order
                </button>
            </div>

          </div>
        ) : (
          <div className="p-12 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner mb-4">
                <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
                <h4 className="text-2xl font-black text-gray-900">Cost Frozen Successfully!</h4>
                <p className="text-gray-500 font-medium mt-2 leading-relaxed">
                    The absorption cost for <b>{workOrder.code}</b> has been locked. 
                    Unit values are now applied to all Finished Goods inventory snapshots.
                </p>
            </div>
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-black transition-all cursor-pointer"
            >
                Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
