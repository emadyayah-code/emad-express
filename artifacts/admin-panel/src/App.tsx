import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/auth";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Categories from "@/pages/Categories";
import Orders from "@/pages/Orders";
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
import { Layout } from "@/components/Sidebar";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

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
      </Switch>
    </Layout>
  );
}

import { I18nProvider } from "@/lib/i18n";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ProtectedRoutes />
          </WouterRouter>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
