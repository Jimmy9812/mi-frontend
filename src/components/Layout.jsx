import { useAuth } from "../context/AuthContext";
import RoleSelector from "./RoleSelector";

export default function Layout({ children }) {
  const { isAuthenticated, showRoleSelector } = useAuth();

  return (
    <>
      {isAuthenticated && showRoleSelector && <RoleSelector />}
      {children}
    </>
  );
}