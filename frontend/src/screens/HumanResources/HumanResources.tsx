import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState, type JSX } from "react";

import { AddEmployeeModal } from "./components/AddEmployeeModel";
import { EditEmployeeModal } from "./components/EditEmployeeModel";
import { DeleteConfirmModal } from "../UserAndSystem/components/DeleteModel";
import { SuccessNotification } from "../UserAndSystem/components/SuccessNotification";

const employees = [
  {
    id: 1,
    employeeId: "EMP001",
    name: "Lam Phan Phuc",
    username: "lam.phanphuc",
    role: "System Admin",
    date: "2023-01-15",
    phone: "0901234567",
    address: "Thu Duc, TP.HCM",
  },
  {
    id: 2,
    employeeId: "EMP002",
    name: "Thinh Huynh Canh",
    username: "thinh.huynhcanh",
    role: "Warehouse Manager",
    date: "2023-02-20",
    phone: "0909876543",
    address: "District 9, TP.HCM",
  },
  {
    id: 3,
    employeeId: "EMP003",
    name: "Thang Nguyen Nhu",
    username: "thang.nguyennhu",
    role: "Production Lead",
    date: "2023-03-10",
    phone: "0912345678",
    address: "Binh Thanh, TP.HCM",
  },
];

export const HumanResources = (): JSX.Element => {
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                HUMAN RESOURCES
              </h1>
              <p className="text-sm text-gray-500">
                Manage staff information, roles, and access permissions across the system
              </p>
            </div>

            <div className="mb-6 flex items-center gap-2 border-b border-gray-200">
              <button className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 transition-colors">
                Human resources management
              </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-300">
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (selectedRowId) {
                      const emp = employees.find((e) => e.id === selectedRowId);
                      setSelectedEmployee(emp);
                      setIsEditOpen(true);
                    }
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => selectedRowId && setIsDeleteOpen(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                <div className="ml-auto">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left w-10"></th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">No.</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Phone Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, index) => (
                      <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="radio"
                            checked={selectedRowId === emp.id}
                            onChange={() => setSelectedRowId(emp.id)}
                            className="cursor-pointer w-[16px] h-[16px]"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{emp.employeeId}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{emp.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.username}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{emp.role}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.date}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{emp.phone}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]">{emp.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

      <AddEmployeeModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onConfirm={handleSuccess} 
      />
      
      <EditEmployeeModal 
        isOpen={isEditOpen} 
        onClose={() => setIsEditOpen(false)} 
        userData={selectedEmployee} 
        onConfirm={handleSuccess} 
      />
      
      <DeleteConfirmModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        onConfirm={() => {
          setIsDeleteOpen(false);
          handleSuccess();
        }} 
      />
      
      <SuccessNotification isVisible={showSuccess} />
    </div>
  );
};