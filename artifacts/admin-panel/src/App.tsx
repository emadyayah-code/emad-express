import React, { Component, ErrorInfo, ReactNode } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Orders from "@/pages/Orders";
import Returns from "@/pages/Returns";
import Customers from "@/pages/Customers";
import Vendors from "@/pages/Vendors";
import Accounting from "@/pages/Accounting";
import Reports from "@/pages/Reports";
import Affiliates from "@/pages/Affiliates";
import Dropshipping from "@/pages/Dropshipping";
import MyCommission from "@/pages/MyCommission";
import SupplierPayments from "@/pages/SupplierPayments";
import Settings from "@/pages/Settings";
import AffiliateSettings from "@/pages/AffiliateSettings";
import PartnerAds from "@/pages/PartnerAds";
import Privacy from "@/pages/Privacy";
import { Layout } from "@/components/Sidebar";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center" dir="rtl">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-lg shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-amber-400">حدث تنبيه في واجهة الصفحة</h2>
            <p className="text-sm text-slate-300">
              {this.state.error?.message || "حدث خطأ غير متوقع"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
            >
              إعادة تحميل لوحة التحكم
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoutes() {
  const { user } = useAuth();
  if (!user) return <Login />;
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/products" component={Products} />
        <Route path="/categories" component={Categories} />
        <Route path="/orders" component={Orders} />
        <Route path="/returns" component={Returns} />
        <Route path="/customers" component={Customers} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/dropshipping" component={Dropshipping} />
        <Route path="/affiliates" component={Affiliates} />
        <Route path="/my-commission" component={MyCommission} />
        <Route path="/supplier-payments" component={SupplierPayments} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route path="/affiliate-settings" component={AffiliateSettings} />
        <Route path="/partner-ads" component={PartnerAds} />
        <Route path="/privacy-policy" component={Privacy} />
        <Route path="/privacy" component={Privacy} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  // If visitor is not logged in and directly visits /privacy-policy, show it standalone
  if (!user && (window.location.pathname === "/privacy-policy" || window.location.pathname === "/privacy")) {
    return <Privacy />;
  }

  return <ProtectedRoutes />;
}

export default App;
