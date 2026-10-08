import { isAdminRole } from "@/lib/roles";
import { adminHomeForRole } from "@/lib/adminPrivileges";

export function redirectAfterLogin(role) {
  if (isAdminRole(role)) return adminHomeForRole(role);
  return "/dashboard";
}
