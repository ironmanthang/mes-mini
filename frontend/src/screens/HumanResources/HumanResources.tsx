import { PlusIcon, EditIcon, TrashIcon, Search, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";

import { AddEmployeeModal } from "./components/AddEmployeeModel";
import { EditEmployeeModal } from "./components/EditEmployeeModel";
import { SuccessNotification } from "../UserAndSystem/components/SuccessNotification";
import { DeleteEmployeeModal } from "./components/DeleteEmployeeModel";

import { employeeService, type Employee } from "../../services/employeeServices";

export const HumanResources = (): JSX.Element => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await employeeService.getAllEmployees();
      //@ts-expect-error data
      setEmployees(response.data);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredEmployees = employees.filter((emp) => {
    const term = debouncedTerm.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(term) ||
      emp.username.toLowerCase().includes(term) ||
      emp.employeeId.toString().includes(term) ||
      (emp.phoneNumber && emp.phoneNumber.includes(term))
    );
  });

  const handleSuccess = () => {
    setShowSuccess(true);
    fetchEmployees();
    setSelectedRowId(null);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getRoleName = (roles: { roleName: string }[]) => {
    return roles && roles.length > 0 ? roles[0].roleName : "N/A";
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
                const emp = employees.find((e) => e.employeeId === selectedRowId);
                if (emp) {
                  setSelectedEmployee(emp);
                  setIsEditOpen(true);
                }
              } else {
                alert("Please select an employee to edit");
              }
            }}
            className={`p-2 rounded transition-colors cursor-pointer ${
                selectedRowId ? "text-gray-600 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed"
            }`}
          >
            <EditIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => selectedRowId ? setIsDeleteOpen(true) : alert("Please select an employee to delete")}
            className={`p-2 rounded transition-colors cursor-pointer ${
                selectedRowId ? "text-gray-600 hover:bg-gray-100" : "text-gray-300 cursor-not-allowed"
            }`}
          >
            <TrashIcon className="w-5 h-5" />
          </button>

          <div className="ml-auto relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Name, ID, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
               <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-full whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left w-10"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Hire Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Phone Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.employeeId} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="radio"
                          name="selectedEmployee"
                          checked={selectedRowId === emp.employeeId}
                          onChange={() => setSelectedRowId(emp.employeeId)}
                          className="cursor-pointer w-[16px] h-[16px]"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{emp.employeeId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{emp.fullName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.username}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="bg-blue-50 text-blue-700 py-1 px-2 rounded text-xs font-medium border border-blue-100">
                            {getRoleName(emp.roles)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{formatDate(emp.hireDate)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.phoneNumber}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]" title={emp.address}>
                        {emp.address}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            emp.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                            {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-gray-500">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
      
      <DeleteEmployeeModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        employeeId={selectedRowId}
        onConfirm={handleSuccess}
      />
      
      <SuccessNotification isVisible={showSuccess} />
    </div>
  );
};