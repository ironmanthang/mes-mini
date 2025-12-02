import { 
  Warehouse, 
  MapPin, 
  User, 
  BarChart3, 
  Plus, 
  Filter,
  Eye,
  Edit,
  FileBarChart
} from "lucide-react";
import { useState, type JSX } from "react";
import { AddWarehouseModal } from "./AddWarehouseModel";

const warehouses = [
  { id: "WH-001", name: "Central Component Storage", location: "Zone A", type: "Component", capacity: 5000, usage: 3500, manager: "Thinh Huynh Canh", status: "Active" },
  { id: "WH-002", name: "Finished Goods Hub", location: "Zone B", type: "Product", capacity: 8000, usage: 7800, manager: "Lam Phan Phuc", status: "Active" },
  { id: "WH-003", name: "Defect Quarantine", location: "Zone C", type: "Defect", capacity: 1000, usage: 200, manager: "Nguyen Van A", status: "Maintenance" },
];

export const WarehouseInformation = (): JSX.Element => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState("All");

  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const handleOpenAdd = () => {
    setSelectedWarehouse(null);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter(w => w.status === "Active").length;
  const totalCapacity = warehouses.reduce((acc, w) => acc + w.capacity, 0);
  const totalUsage = warehouses.reduce((acc, w) => acc + w.usage, 0);
  const usagePercentage = Math.round((totalUsage / totalCapacity) * 100);

  return (
    <div className="space-y-8 pb-12">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">Operational Overview</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-900">{activeWarehouses}/{totalWarehouses}</span>
                    <span className="text-sm text-green-600 font-medium">Active Warehouses</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total System Capacity</span>
                    <span className="font-bold text-gray-900">{totalCapacity.toLocaleString()} m³</span>
                 </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <h3 className="text-gray-500 text-sm font-medium mb-4">Storage Usage</h3>
             <div className="flex items-end gap-4 h-24 mb-2 px-2">
                <div className="flex-1 bg-blue-100 rounded-t relative group h-full flex items-end">
                    <div className="w-full bg-blue-500 rounded-t" style={{height: '40%'}}></div>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 text-xs bg-black text-white p-1 rounded">Jan</div>
                </div>
                <div className="flex-1 bg-blue-100 rounded-t relative group h-full flex items-end">
                    <div className="w-full bg-blue-500 rounded-t" style={{height: '65%'}}></div>
                </div>
                <div className="flex-1 bg-blue-100 rounded-t relative group h-full flex items-end">
                    <div className="w-full bg-blue-500 rounded-t" style={{height: '55%'}}></div>
                </div>
                <div className="flex-1 bg-blue-100 rounded-t relative group h-full flex items-end">
                    <div className="w-full bg-blue-600 rounded-t" style={{height: `${usagePercentage}%`}}></div>
                    <span className="absolute top-2 w-full text-center text-xs font-bold text-blue-900">{usagePercentage}%</span>
                </div>
             </div>
             <p className="text-xs text-center text-gray-400">Monthly Usage Trends</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <h3 className="text-gray-500 text-sm font-medium mb-4 flex items-center gap-2">
                <span className="bg-red-100 p-1 rounded text-red-500"><BarChart3 className="w-3 h-3"/></span>
                Hot Items (High Turnaround)
             </h3>
             <ul className="space-y-3">
                <li className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">1. CPU Chipset A1</span>
                    <span className="text-red-500 font-medium">High Outflow</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">2. Packaging Box M</span>
                    <span className="text-orange-500 font-medium">Med Outflow</span>
                </li>
                <li className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">3. Capacitor 10uF</span>
                    <span className="text-green-500 font-medium">Stable</span>
                </li>
             </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        
        <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mr-auto">
                <Warehouse className="w-5 h-5 text-blue-600" /> Warehouse List
            </h3>

            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                    className="border border-gray-300 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="All">All Types</option>
                    <option value="Component">Component</option>
                    <option value="Product">Product</option>
                    <option value="Defect">Defect</option>
                </select>
                <select className="border border-gray-300 rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option>All Locations</option>
                    <option>Zone A</option>
                    <option>Zone B</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    <FileBarChart className="w-4 h-4" /> Capacity Report
                </button>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add Warehouse
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                        <th className="p-4">ID</th>
                        <th className="p-4">Warehouse Name</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Type</th>
                        <th className="p-4 text-center">Usage / Capacity</th>
                        <th className="p-4">Manager</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {warehouses
                    .filter(w => filterType === "All" || w.type === filterType)
                    .map((item) => {
                        const percent = Math.round((item.usage / item.capacity) * 100);
                        return (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">{item.id}</td>
                                <td className="p-4 font-medium text-blue-600">{item.name}</td>
                                <td className="p-4 text-gray-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {item.location}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                                        item.type === 'Component' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        item.type === 'Product' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                                    }`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="p-4 w-[200px]">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-semibold">{percent}%</span>
                                        <span className="text-gray-500">{item.usage}/{item.capacity}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${
                                                percent > 90 ? 'bg-red-500' : percent > 70 ? 'bg-orange-400' : 'bg-green-500'
                                            }`} 
                                            style={{width: `${percent}%`}}
                                        ></div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-700 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                                        <User className="w-3 h-3 text-gray-500" />
                                    </div>
                                    {item.manager}
                                </td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                                        item.status === 'Active' ? 'bg-green-50 text-green-700' : 
                                        'bg-orange-50 text-orange-700'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            item.status === 'Active' ? 'bg-green-500' : 'bg-orange-500'
                                        }`}></span>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="p-4 flex items-center justify-center gap-2">
                                    <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Inventory">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleOpenEdit(item)} 
                                        className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer" title="Edit Info"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
      </div>

      <AddWarehouseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialData={selectedWarehouse} 
        onConfirm={(data) => {
            if (selectedWarehouse) {
                alert(`Updated Warehouse: ${data.name}`);
            } else {
                alert("Created New Warehouse!");
            }
        }} 
      />
    </div>
  );
};