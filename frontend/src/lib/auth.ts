export interface UserRole {
  roleId: number;
  roleCode: string;
  roleName: string;
}

export interface UserSession {
  employeeId: number;
  username: string;
  fullName: string;
  email: string;
  status: string;
  roles: UserRole[];
  permissions: string[];
}

/**
 * Lấy thông tin User hiện tại từ localStorage
 */
export const getUser = (): UserSession | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr) as UserSession;
  } catch (error) {
    console.error("Failed to parse user session:", error);
    return null;
  }
};

/**
 * Lấy danh sách Role Codes của User (ví dụ: ['SYS_ADMIN', 'PROD_MGR'])
 */
export const getUserRoles = (): string[] => {
  const user = getUser();
  if (!user || !user.roles) return [];
  
  return user.roles.map(r => r.roleCode);
};

/**
 * Lấy danh sách Role Names hiển thị (tiếng Anh hoặc tiếng Việt mapped)
 */
export const getUserRoleNames = (): string[] => {
  const user = getUser();
  if (!user || !user.roles) return [];
  
  return user.roles.map(r => r.roleName);
};

/**
 * Lấy danh sách các mã quyền hạn (permissions) của User
 */
export const getUserPermissions = (): string[] => {
  const user = getUser();
  if (!user || !user.permissions) return [];
  
  return user.permissions;
};

/**
 * Bản đồ ánh xạ Role Name tiếng Việt (nếu có) sang Role Code hệ thống để tăng độ tin cậy
 */
const ROLE_NAME_MAP: Record<string, string> = {
  "System Admin": "SYS_ADMIN",
  "System Administrator": "SYS_ADMIN",
  "Production Manager": "PROD_MGR",
  "Warehouse Staff": "WH_STAFF",
  "Warehouse Keeper": "WH_STAFF",
  "Line Leader": "LINE_LEADER",
  "Production Worker": "PROD_WORKER",
  "Sales Staff": "SALES_STAFF",
  "Purchasing Staff": "PURCH_STAFF",
  "QC Inspector": "QC_INSPECTOR",
  // Map tiếng Việt tương ứng
  "Trưởng bộ phận sản xuất": "PROD_MGR",
  "Thủ kho": "WH_STAFF",
  "Trưởng dây chuyền": "LINE_LEADER",
  "Nhân viên sản xuất": "PROD_WORKER",
  "Nhân viên kinh doanh": "SALES_STAFF",
  "Khách hàng": "PUBLIC"
};

/**
 * Kiểm tra xem người dùng hiện tại có thuộc danh sách các vai trò được phép hay không.
 * Hỗ trợ so khớp cả roleCode hệ thống và roleName tiếng Anh/tiếng Việt.
 */
export const hasAnyRole = (allowedRoles: string[]): boolean => {
  if (allowedRoles.length === 0) return true;
  
  const userRoles = getUserRoles(); // Hệ roleCode ['SYS_ADMIN', 'PROD_MGR', ...]
  const userRoleNames = getUserRoleNames(); // Hệ roleName ['System Admin', ...]
  
  // Chuẩn hóa danh sách vai trò được phép sang dạng UPPERCASE Code
  const normalizedAllowedCodes = allowedRoles.map(role => {
    const uppercaseRole = role.toUpperCase();
    // Nếu là mã code chuẩn thì dùng luôn, nếu là tên hiển thị thì ánh xạ qua map
    return ROLE_NAME_MAP[role] || ROLE_NAME_MAP[uppercaseRole] || uppercaseRole;
  });

  // Kiểm tra xem có vai trò nào khớp không
  return userRoles.some(code => normalizedAllowedCodes.includes(code)) ||
         userRoleNames.some(name => {
           const mappedCode = ROLE_NAME_MAP[name];
           return mappedCode && normalizedAllowedCodes.includes(mappedCode);
         });
};

/**
 * Kiểm tra xem người dùng hiện tại có sở hữu một mã quyền cụ thể nào không
 */
export const hasPermission = (permCode: string): boolean => {
  // SYS_ADMIN mặc định có tất cả quyền
  if (hasAnyRole(["SYS_ADMIN", "PUBLIC"])) return true;
  
  const permissions = getUserPermissions();
  return permissions.includes(permCode);
};

/**
 * Kiểm tra xem người dùng có ít nhất 1 trong danh sách các mã quyền không.
 * Dùng để quyết định có hiển thị tab/section hay không khi tab yêu cầu nhiều permissions khác nhau.
 */
export const hasAnyPermission = (permCodes: string | string[]): boolean => {
  const codes = Array.isArray(permCodes) ? permCodes : [permCodes];
  return codes.some(code => hasPermission(code));
};

/**
 * Kiểm tra xem người dùng có TẤT CẢ các mã quyền trong danh sách không.
 * Chỉ trả về true khi user sở hữu đủ mọi permission được yêu cầu.
 * Dùng cho các action nhạy cảm cần đồng thời nhiều quyền.
 */
export const hasAllPermissions = (permCodes: string | string[]): boolean => {
  const codes = Array.isArray(permCodes) ? permCodes : [permCodes];
  if (codes.length === 0) return true;
  return codes.every(code => hasPermission(code));
};

