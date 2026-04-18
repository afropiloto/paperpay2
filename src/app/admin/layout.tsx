import { AdminTheme } from "./admin-theme";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminTheme>{children}</AdminTheme>;
}
