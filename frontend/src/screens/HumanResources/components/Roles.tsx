import { 
  Search, Plus, Edit, Trash2, Shield, Loader2
} from "lucide-react";
import { useState, useEffect, useMemo, type JSX } from "react";
import { roleService, type Role } from "../../../services/roleServices"; 

import { AddRoleModal } from "./AddRoleModal";
import { UpdateRoleModal } from "./UpdateRoleModal";
import { DeleteRoleModal } from "./DeleteRoleModal";
import { SuccessNotification } from "../../Notification/SuccessNotification";

export const Roles = (): JSX.Element => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await roleService.getAllRoles();
      const dataArray = Array.isArray(response) ? response : (response as any).data || [];
      setRoles(dataArray);
    } catch (error) {
      console.error("Failed to load roles list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = useMemo(() => {
    return roles.filter(role => 
      role.roleName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  const handleOpenAdd = () => setIsAddOpen(true);
  const handleOpenEdit = (role: Role) => setRoleToEdit(role);
  const handleOpenDelete = (role: Role) => setRoleToDelete(role);

  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-in fade-in zoom-in duration-300 shadow-sm flex flex-col">
      
      {/* Header & Toolbar */}
      <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 rounded-t-lg">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-900">Roles List</h2>
                <p className="text-sm text-gray-500">Manage roles and permissions in the system</p>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Role Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow bg-white"
                />
            </div>
            <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer"
            >
                <Plus className="w-4 h-4" /> Add Role
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold sticky top-0">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 w-20">ID</th>
                <th className="px-6 py-4">Role Name</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {filteredRoles.length > 0 ? (
                filteredRoles.map((role) => (
                  <tr key={role.roleId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-500">
                        #{role.roleId}
                    </td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {role.roleName}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEdit(role)}
                          className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer" 
                          title="Edit Role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(role)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer" 
                          title="Delete Role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Shield className="w-8 h-8 mb-2 opacity-20" />
                      <p>No roles found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AddRoleModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSuccess={() => {
            setIsSuccess(true);
            fetchRoles();
            setTimeout(() => setIsSuccess(false), 3000);
        }} 
      />

      <UpdateRoleModal 
        isOpen={roleToEdit !== null} 
        onClose={() => setRoleToEdit(null)} 
        roleId={roleToEdit?.roleId || null}
        initialRoleName={roleToEdit?.roleName || ""}
        onSuccess={() => {
            setIsSuccess(true);
            fetchRoles();
            setTimeout(() => setIsSuccess(false), 3000);
        }} 
      />

      <DeleteRoleModal 
        isOpen={roleToDelete !== null} 
        onClose={() => setRoleToDelete(null)} 
        roleId={roleToDelete?.roleId || null}
        roleName={roleToDelete?.roleName || ""}
        onSuccess={() => {
            setIsSuccess(true);
            fetchRoles();
            setTimeout(() => setIsSuccess(false), 3000);
        }} 
      />

      <SuccessNotification isVisible={isSuccess}/>
    </div>
  );
};