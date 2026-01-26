import { X, Save, Truck, Calculator, FileText, User, Package, Plus, Trash2 } from "lucide-react";
import { useEffect, useState, useMemo, type JSX } from "react";
import { agentsServices, type Agents } from "../../../services/agentServices";
import { productServices, type Product } from "../../../services/productServices";
import { type CreateSalesOrder, salesOrderServices, type Priority } from "../../../services/salesOrderServices";

interface NewSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const NewSalesOrderModal = ({ isOpen, onClose, onConfirm }: NewSalesOrderModalProps): JSX.Element | null => {
  const [agents, setAgents] = useState<Agents[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateSalesOrder>({
    code: "",
    agentId: 0,
    expectedShipDate: new Date().toISOString().split('T')[0],
    priority: "Medium",
    paymentTerms: "",
    deliveryTerms: "",
    note: "",
    discount: 0,
    tax: 0,
    shippingCost: 0,
    details: [
        {
            productId: 0,
            quantity: 1,
            salePrice: 0
        },
    ]
  });

  useEffect(() => {
    if (isOpen) {
        const fetchData = async () => {
            try {
                const [agentsData, productsData] = await Promise.all([
                    agentsServices.getAllAgents(),
                    productServices.getAllProducts()
                ]);

                //@ts-expect-error data
                setAgents(agentsData.data);
                //@ts-expect-error data
                setProducts(productsData.data);

                const defaultAgentId = agentsData.length > 0 ? agentsData[0].agentId : 0;
                const defaultProductId = productsData.length > 0 ? productsData[0].productId : 0;
                
                const randomCode = `SO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

                setFormData(prev => ({
                    ...prev,
                    code: randomCode,
                    agentId: defaultAgentId,
                    details: [
                        { 
                            productId: defaultProductId, 
                            quantity: 1, 
                            salePrice: 0 
                        }
                    ]
                }));

            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        fetchData();
    }
  }, [isOpen]);

  const calculations = useMemo(() => {
    const subtotal = formData.details.reduce((sum, item) => {
        return sum + (item.quantity * item.salePrice);
    }, 0);

    const total = subtotal + Number(formData.tax) + Number(formData.shippingCost) - Number(formData.discount);
    return { subtotal, total };
  }, [formData.details, formData.tax, formData.shippingCost, formData.discount]);

  const handleChange = (field: keyof CreateSalesOrder, value: CreateSalesOrder[keyof CreateSalesOrder]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  
  const handleDetailChange = (index: number, field: string, value: number) => {
    const newDetails = [...formData.details];
    newDetails[index] = { ...newDetails[index], [field]: value };
    setFormData(prev => ({ ...prev, details: newDetails }));
  };

  const handleAddItem = () => {
    const defaultProductId = products.length > 0 ? products[0].productId : 0;
    setFormData(prev => ({
        ...prev,
        details: [
            ...prev.details, 
            { productId: defaultProductId, quantity: 1, salePrice: 0 }
        ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.details.length > 1) {
        const newDetails = formData.details.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, details: newDetails }));
    }
  };

  const handleSubmit = async () => {
    const isValid = formData.details.every(d => d.productId !== 0);
    if (!formData.agentId || !isValid) {
        return alert("Please select Agent and valid Products for all rows");
    }

    setIsSubmitting(true);
    try {
        await salesOrderServices.createNewSalesOrder(formData);
        onConfirm();
        onClose();
    } catch (err) {
        console.error(err);
        alert("Failed to create order");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
      <div className="bg-white w-[900px] max-h-[90vh] flex flex-col rounded-lg shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Sales Order</h2>
            <p className="text-xs text-gray-500 mt-1">Fill in the information to create a new order</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-red-600 cursor-pointer" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
            <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                        <FileText className="w-3 h-3"/> Order Code
                    </label>
                    <input type="text" 
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white font-mono" 
                        value={formData.code} 
                        onChange={e => handleChange("code", e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                         <User className="w-3 h-3"/> Agent / Customer
                    </label>
                    <select 
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white" 
                        value={formData.agentId} 
                        onChange={e => handleChange("agentId", Number(e.target.value))}
                    >
                        <option value={0} disabled>-- Select Agent --</option>
                        {agents.map(a => (
                            <option key={a.agentId} value={a.agentId}>{a.agentName}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Priority</label>
                    <select 
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white" 
                        value={formData.priority}
                        onChange={e => handleChange("priority", e.target.value as Priority)}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Expected Ship Date</label>
                    <input type="date" 
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white" 
                        value={formData.expectedShipDate} 
                        onChange={e => handleChange("expectedShipDate", e.target.value)} 
                    />
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-600"/> Order Items
                    </label>
                    <button 
                        type="button"
                        onClick={handleAddItem}
                        className="text-xs flex items-center gap-1 text-blue-600 font-bold hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add Item
                    </button>
                </div>
                
                <div className="space-y-2">
                    {formData.details.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-3 items-end bg-blue-50/30 p-3 rounded-lg border border-blue-100 relative group">
                            
                            <div className="col-span-6 space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 uppercase">Product</label>
                                <select 
                                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-blue-500"
                                    value={item.productId}
                                    onChange={(e) => handleDetailChange(index, "productId", Number(e.target.value))}
                                >
                                    <option value={0} disabled>Select Product...</option>
                                    {products.map(p => (
                                        <option key={p.productId} value={p.productId}>
                                            {p.productName} ({p.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 uppercase">Qty</label>
                                <input type="number" min="1" 
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-center" 
                                    value={item.quantity} 
                                    onChange={(e) => handleDetailChange(index, "quantity", Number(e.target.value))} 
                                />
                            </div>

                            <div className="col-span-3 space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 uppercase">Unit Price ($)</label>
                                <input type="number" min="0" 
                                    className="w-full p-2 border border-gray-300 rounded text-sm text-right" 
                                    value={item.salePrice} 
                                    onChange={(e) => handleDetailChange(index, "salePrice", Number(e.target.value))} 
                                />
                            </div>

                            <div className="col-span-1 flex justify-center pb-2">
                                <button 
                                    type="button"
                                    onClick={() => handleRemoveItem(index)}
                                    className={`p-1.5 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors ${formData.details.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                    disabled={formData.details.length === 1}
                                    title="Remove item"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end text-sm font-bold text-gray-700 pt-2">
                    Subtotal: <span className="text-blue-600 ml-2">${calculations.subtotal.toLocaleString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Truck className="w-3 h-3"/> Terms & Notes
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Payment Terms" 
                            className="w-full p-2 border border-gray-300 rounded text-xs"
                            value={formData.paymentTerms} onChange={e => handleChange("paymentTerms", e.target.value)}
                        />
                         <input type="text" placeholder="Delivery Terms" 
                            className="w-full p-2 border border-gray-300 rounded text-xs"
                            value={formData.deliveryTerms} onChange={e => handleChange("deliveryTerms", e.target.value)}
                        />
                    </div>
                    <textarea rows={2} placeholder="Additional notes..." 
                        className="w-full p-2 border border-gray-300 rounded text-xs resize-none"
                        value={formData.note} onChange={e => handleChange("note", e.target.value)}
                    />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                     <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1">
                        <Calculator className="w-3 h-3"/> Costs Breakdown
                    </label>
                    
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Tax ($)</span>
                        <input type="number" min="0" className="w-24 p-1 border rounded text-right" 
                            value={formData.tax} onChange={e => handleChange("tax", Number(e.target.value))} />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Shipping ($)</span>
                        <input type="number" min="0" className="w-24 p-1 border rounded text-right" 
                             value={formData.shippingCost} onChange={e => handleChange("shippingCost", Number(e.target.value))} />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Discount ($)</span>
                        <input type="number" min="0" className="w-24 p-1 border rounded text-right text-red-600" 
                             value={formData.discount} onChange={e => handleChange("discount", Number(e.target.value))} />
                    </div>
                </div>
            </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-lg flex justify-between items-center">
            <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
                Total: <span className="text-blue-600">${calculations.total.toLocaleString()}</span>
            </div>
            <div className="flex gap-3">
                <button onClick={onClose} 
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 cursor-pointer">
                    Cancel
                </button>
                <button onClick={handleSubmit} disabled={isSubmitting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 flex items-center gap-2 cursor-pointer disabled:bg-blue-300">
                    {isSubmitting ? "Saving..." : <><Save className="w-4 h-4" /> Create Order</>}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};