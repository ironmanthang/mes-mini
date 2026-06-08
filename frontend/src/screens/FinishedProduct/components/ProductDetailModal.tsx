import { X, Package, Layers, Loader2, Trash2, Pen } from "lucide-react";
import { useState, useEffect, type JSX } from "react";
import { ProductServices, type Product, type BOMComponent } from "../../../services/productServices";
import { componentService, type Component } from "../../../services/componentServices";
import { ConfirmNotification } from "../../Notification/ConfirmNotification";
import { SuccessNotification } from "../../Notification/SuccessNotification";
import { hasPermission } from "../../../lib/auth";

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number | null;
}

export const ProductDetailModal = ({ isOpen, onClose, productId }: ProductDetailModalProps): JSX.Element | null => {
  const [productData, setProductData] = useState<Product | null>(null);
  const [productBOM, setProductBOM] = useState<BOMComponent[]>([]);
  const [compToRemove, setCompToRemove] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [components, setComponents] = useState<Component[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<number | "">("" );
  const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
  const [isAddCompleted, setIsAddCompleted] = useState(false);
  const [quantityUpdated, setQuantityUpdated] = useState<number | null>(null);
  const [compToUpdate, setCompToUpdate] = useState<number | null>(null);
  const [isUpdate, setIsUpdate] = useState(false);

  const handleSelectCompoent = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(event.target.value);
    setSelectedComponent(id);
  };

  const handleAddComponent = async () => {
    if (!productId || !selectedComponent) return;
    setIsLoading(true);
    try {
      await ProductServices.addComponentToProductBom(productId, {
        componentId: selectedComponent,
        quantityNeeded: quantityToAdd,
      });
      setShowSuccess(true);
      setSelectedComponent("");
      setQuantityToAdd(1);      
    } catch (error) {
      console.error("Failed to add component", error);
    } finally {
      ProductServices.getBOMById(productId)
        .then(data => setProductBOM(data))
        .catch(err => console.error("Failed to reload BOM", err))
        .finally(() => setIsLoading(false));

      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && productId) {
      setIsLoading(true);
      ProductServices.getProductById(productId)
        .then(data => setProductData(data))
        .catch(err => console.error("Failed to load product details", err))
        .finally(() => setIsLoading(false));

      setIsLoading(true);
      ProductServices.getBOMById(productId)
        .then(data => setProductBOM(data))
        .catch(err => console.error("Failed to load product BOM", err))
        .finally(() => setIsLoading(false));

      componentService.getAllComponents()
        .then(response => setComponents(response.data))
        .catch(err => console.error("Failed to load components", err));
    } else {
      setProductData(null);
    }

    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2000)

      return () => clearTimeout(timer);
    }
  }, [isOpen, productId, showSuccess]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const handleRemove = async (componentId: number | null) => {
    if (productId && componentId) {
      try {
        await ProductServices.removeComponentFromBOM(productId, componentId);
        setShowSuccess(true);
      } catch (error) {
        console.error("Failed to remove component", error);
      } finally {
        setIsLoading(true);
        ProductServices.getBOMById(productId)
          .then(data => setProductBOM(data))
          .catch(err => console.error("Failed to load product BOM", err))
          .finally(() => setIsLoading(false));
      }
    }
  }

  const handleUpdateQuantity = async (componentId: number) => {
    if (!productId || !quantityUpdated || quantityUpdated < 1) return;
    setIsLoading(true);
    try {
      await ProductServices.updateQuantityBOMComponent(productId, componentId, {
        quantityNeeded: quantityUpdated,
      });
      setShowSuccess(true);
      setQuantityUpdated(null);
      setCompToUpdate(null);
    } catch (error) {
      console.error("Failed to update quantity", error);
    } finally {
      ProductServices.getBOMById(productId)
        .then(data => setProductBOM(data))
        .catch(err => console.error("Failed to reload BOM", err))
        .finally(() => setIsLoading(false));
    }
  };

  if (!isOpen || !productId) return null;

  return (productData ?
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl h-[85vh] max-h-[800px] flex flex-col 
      rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Product details</h2>
              <p className="text-xs font-mono text-gray-400 mt-0.5">ID: {productData.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ?
          (<div className="w-full flex flex-col items-center justify-center p-12 gap-3">
            <div className="p-4 bg-blue-50 rounded-full border border-blue-100 animate-pulse">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-gray-600">Loading specification details...</p>
            <p className="text-xs text-gray-400">Please wait a moment</p>
          </div>) :
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50/30">
            <div className="w-full md:w-5/12 p-6 border-r border-gray-100 flex flex-col gap-5 overflow-y-auto">
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm text-center md:text-left">
                <h3 className="text-base font-extrabold text-gray-900 leading-snug">{productData.productName}</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 mt-2 border border-blue-200">
                  {productData.category?.categoryName || 'General'}
                </span>
              </div>

              <div className="space-y-3.5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-1">Product Code</span>
                  <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-200 inline-block">{productData.code}</span>
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider block mb-1">Unit of Measure</span>
                  <span className="text-sm font-medium text-gray-800">{productData.unit}</span>
                </div>
                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-0.5">Created At</span>
                    <span className="text-gray-700 font-medium">{formatDate(productData.createdAt)}</span>
                  </div>
                  <div>
                    <span className="font-bold uppercase tracking-wider block mb-0.5">Last Updated</span>
                    <span className="text-gray-700 font-medium">{formatDate(productData.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm
              flex flex-col gap-2">
                <select id="addComponent"
                  value={selectedComponent}
                  onChange={handleSelectCompoent}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                text-sm text-gray-900 cursor-pointer">
                  <option value="">-- Select a component to add --</option>
                  {components.map((comp) => (
                    <option key={comp.componentId} value={comp.componentId}
                      className="px-3 py-2 text-sm text-gray-900"
                    >
                      {comp.componentName}
                    </option>
                  ))}
                </select>

                <input
                  id="quantityToAdd"
                  type="number"
                  min={1}
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Number(e.target.value))}
                  placeholder="Quantity needed"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-sm text-gray-900"
                />

                <button
                  onClick={() => {
                    setIsAddCompleted(true);
                    setShowConfirm(true);
                  }}
                  disabled={!selectedComponent || quantityToAdd < 1 || !hasPermission("PRODUCT_UPDATE")}
                  className="w-full bg-emerald-200 p-2 rounded-lg text-emerald-800 font-bold
                  cursor-pointer shadow-sm hover:shadow-md hover:bg-emerald-300 transition-all
                  duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  Add component to BOM
                </button>
              </div>
            </div>

            <div className="w-full md:w-7/12 p-6 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> Bill of Materials
                </h4>
                <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full">
                  {productBOM?.length || 0} Components
                </span>
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200
              rounded-xl bg-white divide-y divide-gray-200 shadow-sm">
                {productBOM?.map((bom, index) => (
                  <div key={bom.componentId || index}
                    className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-bold text-gray-800">{bom.component.componentName}</p>
                      <p className="text-xs font-mono text-blue-600 mt-0.5 bg-blue-100 p-2
                      rounded-lg border border-blue-200">
                        {bom.component.code}</p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <p className="text-xs font-mono text-gray-600 mt-0.5">Unit: {bom.component.unit}</p>
                        <p className="text-xs font-mono text-gray-600 mt-0.5">
                          Quantity needed: {bom.quantityNeeded}</p>
                      </div>

                      <div className="flex items-center">
                        <div className="flex justify-between gap-1">
                          <input type="number"
                            placeholder="Update quantity ..."
                            className="w-full py-2 bg-transparent border-b-2 border-gray-300
                            text-gray-900 placeholder-gray-400 focus:outline-none
                            focus:border-blue-500 transition duration-300 text-xs"
                            value={compToUpdate === bom.componentId ? (quantityUpdated ?? '') : ''}
                            onChange={(e) => {
                              setCompToUpdate(bom.componentId);
                              setQuantityUpdated(Number(e.target.value));
                            }}
                            disabled={!hasPermission("PRODUCT_UPDATE")}/>
                          <button
                            onClick={() => {
                              setIsUpdate(true);
                              setShowConfirm(true);
                            }}
                            disabled={compToUpdate !== bom.componentId || !quantityUpdated || quantityUpdated < 1}
                            className="rounded-full hover:bg-blue-200 transition-colors
                            duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                            <Pen className="w-4 h-4 m-2"/>
                          </button>
                        </div>

                        <button className={`rounded-full hover:bg-red-400 transition-colors duration-200
                        ${hasPermission("PRODUCT_UPDATE") ? "cursor-pointer" : "cursor-not-allowed"}`}
                          onClick={() => {
                            setCompToRemove(bom.componentId);
                            setIsAddCompleted(false);
                            setShowConfirm(true);
                          }}
                          disabled={!hasPermission("PRODUCT_UPDATE")}>
                          <Trash2 className="w-4 h-4 m-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      </div>

      {isAddCompleted ?
        <ConfirmNotification
          isOpen={showConfirm}
          title="Confirm addition"
          message="Are you sure you want to add this component?"
          variant="success"
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            handleAddComponent();
            setShowConfirm(false);
          }} /> : (isUpdate ? 
        <ConfirmNotification
          isOpen={showConfirm}
          title="Confirm update"
          message="Are you sure to update quantity need of this compoent"
          variant="primary"
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            if (compToUpdate !== null) handleUpdateQuantity(compToUpdate);
            setShowConfirm(false);
          }}
        /> : <ConfirmNotification
          isOpen={showConfirm}
          title="Confirm removal"
          message="Are you sure you want to remove this component?"
          variant="danger"
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            handleRemove(compToRemove)
            setShowConfirm(false);
          }}
        />)
      }

      {<SuccessNotification
        isVisible={showSuccess}
        message={isAddCompleted ? "Component added successfully" : "Component removed successfully"}
      />}
    </div> : <></>
  );
};