import { type JSX } from "react";
import { Navigate } from "react-router-dom";
import { hasAnyRole, hasPermission } from "../lib/auth";

interface ProtectedRouteWithRoleProps {
  children: JSX.Element;
  allowedRoles?: string[];
  allowedPermissions?: string[];
}

export const ProtectedRouteWithRole = ({
  children,
  allowedRoles = [],
  allowedPermissions = []
}: ProtectedRouteWithRoleProps): JSX.Element => {
  // 1. Kiểm tra vai trò (Role-Based Check)
  const isRoleAllowed = allowedRoles.length === 0 || hasAnyRole(allowedRoles);

  // 2. Kiểm tra quyền hạn chi tiết (Permission-Based Check)
  const isPermissionAllowed = allowedPermissions.length === 0 || 
    allowedPermissions.some(perm => hasPermission(perm));

  // Nếu không thỏa mãn một trong hai tiêu chí bảo vệ, chuyển hướng về Dashboard
  if (!isRoleAllowed || !isPermissionAllowed) {
    console.warn("Access Denied: User does not have the required role or permission.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
