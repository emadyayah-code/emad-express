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
import Users from "@/pages/Users";
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
import StoreHome from "@/pages/StoreHome";
import { CartProvider } from "@/context/CartContext";
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
            <h2 className="text-xl font-bold text-amber-400">حدث تنبيه في واجهة المتجر / لوحة التحكم</h2>
            <p className="text-sm text-slate-300">
              {this.state.error?.message || "حدث خطأ غير متوقع"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/";
              }}
              className="bg-amber-500 hover:bg-amber-600 text-black px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer"
            >
              إعادة تحميل الصفحة الرئيسية
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminArea() {
  const { user } = useAuth();
  if (!user) return <Login />;

  return (
    <Layout>
      <Switch>
        <Route path="/admin" component={Dashboard} />
        <Route path="/admin/products" component={Products} />
        <Route path="/admin/categories" component={Categories} />
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/returns" component={Returns} />
        <Route path="/admin/users" component={Users} />
        <Route path="/admin/customers" component={Users} />
        <Route path="/admin/vendors" component={Vendors} />
        <Route path="/admin/dropshipping" component={Dropshipping} />
        <Route path="/admin/affiliates" component={Affiliates} />
        <Route path="/admin/my-commission" component={MyCommission} />
        <Route path="/admin/supplier-payments" component={SupplierPayments} />
        <Route path="/admin/accounting" component={Accounting} />
        <Route path="/admin/reports" component={Reports} />
        <Route path="/admin/settings" component={Settings} />
        <Route path="/admin/affiliate-settings" component={AffiliateSettings} />
        <Route path="/admin/partner-ads" component={PartnerAds} />
        <Route path="/admin/privacy-policy" component={Privacy} />
        <Route path="/admin/privacy" component={Privacy} />
        {/* Legacy Direct Admin Paths */}
        <Route path="/products" component={Products} />
        <Route path="/categories" component={Categories} />
        <Route path="/orders" component={Orders} />
        <Route path="/returns" component={Returns} />
        <Route path="/users" component={Users} />
        <Route path="/customers" component={Users} />
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
        {/* Default Admin Route */}
        <Route component={Dashboard} />
      </Switch>
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public Storefront Home (AliExpress-style) */}
      <Route path="/" component={StoreHome} />
      <Route path="/store" component={StoreHome} />

      {/* Public Privacy Policy */}
      <Route path="/privacy-policy" component={Privacy} />
      <Route path="/privacy" component={Privacy} />

      {/* Direct Login Page */}
      <Route path="/login" component={Login} />

      {/* Admin Panel (Separate Dashboard & Management) */}
      <Route path="/admin" component={AdminArea} />
      <Route path="/admin/:rest*" component={AdminArea} />

      {/* Legacy Admin shortcuts if accessed directly */}
      <Route path="/products" component={AdminArea} />
      <Route path="/categories" component={AdminArea} />
      <Route path="/orders" component={AdminArea} />
      <Route path="/returns" component={AdminArea} />
      <Route path="/users" component={AdminArea} />
      <Route path="/vendors" component={AdminArea} />
      <Route path="/dropshipping" component={AdminArea} />
      <Route path="/affiliates" component={AdminArea} />
      <Route path="/my-commission" component={AdminArea} />
      <Route path="/supplier-payments" component={AdminArea} />
      <Route path="/accounting" component={AdminArea} />
      <Route path="/reports" component={AdminArea} />
      <Route path="/settings" component={AdminArea} />

      {/* Fallback to Public Storefront */}
      <Route component={StoreHome} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
