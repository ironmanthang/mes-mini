import { PlusIcon, EditIcon, TrashIcon } from "lucide-react";
import { useState, type JSX } from "react";
import { AddUserModal } from "./AddUserModel";
import { EditUserModal } from "./EditUserModel";
import { DeleteConfirmModal } from "./DeleteModel";
import { SuccessNotification } from "./SuccessNotification";

const users = [
  { id: 1, employeeId: "EMP001", name: "Lam Phan Phuc", email: "lam.phanphuc@prodopsx.com", role: "System Administrator" },
  { id: 2, employeeId: "EMP002", name: "Thinh Huynh Canh", email: "thinh.huynhcanh@prodopsx.com", role: "Warehouse Manager" },
  { id: 3, employeeId: "EMP003", name: "Thang Nguyen Nhu", email: "thang.nguyennhu@prodopsx.com", role: "Production Lead" },
];

export const UserManagement = (): JSX.Element => {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleOperationSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <button onClick={() => setIsAddModalOpen(true)} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors cursor-pointer">
            <PlusIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              if (selectedUserId) {
                const user = users.find(u => u.id === selectedUserId);
                setSelectedUser(user);
                setIsEditModalOpen(true);
              }
            }}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <EditIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={() => selectedUserId && setIsDeleteModalOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
          <div className="ml-auto">
            <input type="text" placeholder="Search..." className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left w-10"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Full Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <input type="radio" checked={selectedUserId === user.id} onChange={() => setSelectedUserId(user.id)} className="cursor-pointer w-[16px] h-[16px]" />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.employeeId}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleOperationSuccess} />
      <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} userData={selectedUser} onConfirm={handleOperationSuccess} />
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={() => { setIsDeleteModalOpen(false); handleOperationSuccess(); }} />
      <SuccessNotification isVisible={showSuccess} />
    </>
  );
};