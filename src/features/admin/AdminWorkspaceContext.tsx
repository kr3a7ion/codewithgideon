import { createContext, useContext } from "react";
import type { AdminWorkspace } from "./useAdminWorkspace";

const AdminWorkspaceContext = createContext<AdminWorkspace | null>(null);

export const AdminWorkspaceProvider = AdminWorkspaceContext.Provider;

export const useAdmin = () => {
  const value = useContext(AdminWorkspaceContext);
  if (!value) throw new Error("useAdmin must be used inside the admin area");
  return value;
};
