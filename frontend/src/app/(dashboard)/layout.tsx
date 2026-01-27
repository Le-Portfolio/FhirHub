import { AppLayout } from "@/components/layout";
import { ServiceProvider } from "@/services";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/providers/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ServiceProvider>
        <ToastProvider>
          <AppLayout>{children}</AppLayout>
        </ToastProvider>
      </ServiceProvider>
    </AuthProvider>
  );
}
