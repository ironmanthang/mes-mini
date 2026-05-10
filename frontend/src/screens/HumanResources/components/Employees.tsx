import { PlusIcon, EditIcon, Search, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, type JSX } from "react";

import { AddEmployeeModal } from "./AddEmployeeModal";
import { EditEmployeeModal } from "./EditEmployeeModal";
import { SuccessNotification } from "../../Notification/SuccessNotification";

import { employeeService, type Employee } from "../../../services/employeeServices";

export const Employees = (): JSX.Element => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      // CẬP NHẬT: getAllEmployees hiện trả về PaginatedEmployeeResponse { data, total, page, limit }
      const response = await employeeService.getAllEmployees({ search: debouncedTerm });
      setEmployees(response.data); 
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSuccess = (message: string) => {
    setShowSuccess(true);
    setSuccessMessage(message);
    fetchEmployees();
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsEditOpen(true);
  };


  return (
    <>
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 cursor-pointer
            bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon size={20} /> Add Employee
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, email or username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-sm font-semibold text-gray-600">ID</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Full Name</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Phone</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Address</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Roles</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.length > 0 ? (
                  employees.map((emp) => (
                    <tr key={emp.employeeId} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-sm text-gray-600">{emp.employeeId}</td>
                      <td className="p-4 text-sm font-medium text-gray-800">{emp.fullName}</td>
                      <td className="p-4 text-sm text-gray-600">{emp.email}</td>
                      <td className="p-4 text-sm text-gray-600">{emp.phoneNumber}</td>
                      <td className="p-4 text-sm text-gray-600">{emp.address || "N/A"}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {emp.roles.map(r => r.roleName).join(", ")}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-700' 
                            : emp.status === 'INACTIVE'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                            {emp.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(emp)}
                            className="p-1 text-blue-600 cursor-pointer
                            hover:bg-blue-50 rounded transition-colors"
                          >
                            <EditIcon size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-500 italic">
                      No employees found matching your search.
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
        onConfirm={() => handleSuccess("Employee created successfully. An email with login credentials has been sent.")} 
        onClose={() => setIsAddOpen(false)} 
      />
      
      <EditEmployeeModal 
        isOpen={isEditOpen} 
        userData={selectedEmployee} 
        onConfirm={() => handleSuccess("Employee details updated successfully.")} 
        onClose={() => setIsEditOpen(false)} 
      />
      
      <SuccessNotification 
          isVisible={showSuccess} 
          message={successMessage}
      />
    </>
  );
};