import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import {
  Splash,
  PublicOnly,
  RequireAuth,
  RequireRole,
  RequireSessionOnly,
} from "@/routes/guards";
import { ROLE_HOME, paths } from "@/routes/paths";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSkeleton } from "@/components/ui/States";

const L = (f: () => Promise<{ default: React.ComponentType<any> }>) => lazy(f);
const Landing = L(() => import("@/features/landing/LandingPage"));
const Login = L(() => import("@/features/auth/LoginPage"));
const Register = L(() => import("@/features/auth/RegisterPage"));
const VerifyEmail = L(() => import("@/features/auth/VerifyEmailPage"));
const Forgot = L(() => import("@/features/auth/ForgotPasswordPage"));
const Reset = L(() => import("@/features/auth/ResetPasswordPage"));
const ChooseRole = L(() => import("@/features/auth/ChooseRolePage"));
const Legal = L(() => import("@/features/misc/LegalPage"));
const Home = L(() => import("@/features/home/HomePage"));
const Dashboard = L(() => import("@/features/dashboard/DashboardPage"));
const Properties = L(() => import("@/features/properties/PropertiesPage"));
const PropertyDetail = L(
  () => import("@/features/properties/PropertyDetailPage"),
);
const PropertyForm = L(() => import("@/features/properties/PropertyFormPage"));
const Units = L(() => import("@/features/units/UnitsPage"));
const UnitDetail = L(() => import("@/features/units/UnitDetailPage"));
const UnitForm = L(() => import("@/features/units/UnitFormPage"));
const RentalRequests = L(
  () => import("@/features/rental-requests/RentalRequestsPage"),
);
const RentalRequestNew = L(
  () => import("@/features/rental-requests/RentalRequestNewPage"),
);
const RentalRequestDetail = L(
  () => import("@/features/rental-requests/RentalRequestDetailPage"),
);
const Leases = L(() => import("@/features/leases/LeasesPage"));
const LeaseNew = L(() => import("@/features/leases/LeaseNewPage"));
const LeaseEdit = L(() => import("@/features/leases/LeaseEditPage"));
const LeaseDetail = L(() => import("@/features/leases/LeaseDetailPage"));
const Renewals = L(() => import("@/features/renewals/RenewalsPage"));
const RenewalDetail = L(() => import("@/features/renewals/RenewalDetailPage"));
const Maintenance = L(() => import("@/features/maintenance/MaintenancePage"));
const MaintenanceNew = L(
  () => import("@/features/maintenance/MaintenanceNewPage"),
);
const MaintenanceDetail = L(
  () => import("@/features/maintenance/MaintenanceDetailPage"),
);
const Notifications = L(
  () => import("@/features/notifications/NotificationsPage"),
);
const Profile = L(() => import("@/features/profile/ProfilePage"));
const Users = L(() => import("@/features/users/UsersPage"));
const AuditLogs = L(() => import("@/features/audit-logs/AuditLogsPage"));
const Contract = L(() => import("@/features/contract/ContractPage"));
const Timeline = L(() => import("@/features/timeline/TimelinePage"));
const RentRoll = L(() => import("@/features/reports/RentRollPage"));
const Help = L(() => import("@/features/help/HelpPage"));
const HelpGate = lazy(() =>
  import("@/features/help/HelpPage").then((m) => ({ default: m.HelpGate })),
);
const NotFound = L(() =>
  import("@/features/misc/StatusPages").then((m) => ({
    default: m.NotFoundPage,
  })),
);
const Forbidden = L(() =>
  import("@/features/misc/StatusPages").then((m) => ({
    default: m.ForbiddenPage,
  })),
);

/** "/" is public, but signed-in people go straight to their home (spec §6.3). */
function LandingGate(): ReactNode {
  const { isBooting, user } = useAuth();
  if (isBooting) return <Splash />;
  if (user)
    return (
      <Navigate
        to={user.roleSelected ? ROLE_HOME[user.role] : paths.chooseRole}
        replace
      />
    );
  return <Landing />;
}

const ALL = ["TENANT", "OWNER", "ADMIN"] as const;
const MANAGERS = ["OWNER", "ADMIN"] as const;

export default function App() {
  return (
    <Suspense fallback={<Splash />}>
      <Routes>
        <Route path="/" element={<LandingGate />} />
        <Route element={<PublicOnly />}>
          <Route path={paths.login} element={<Login />} />
          <Route path={paths.register} element={<Register />} />
        </Route>
        <Route path={paths.verifyEmail} element={<VerifyEmail />} />
        <Route path={paths.forgotPassword} element={<Forgot />} />
        <Route path={paths.resetPassword} element={<Reset />} />
        <Route path={paths.terms} element={<Legal kind="terms" />} />
        <Route path={paths.privacy} element={<Legal kind="privacy" />} />
        <Route path={paths.help} element={<HelpGate />}>
          <Route index element={<Help />} />
        </Route>
        <Route element={<RequireSessionOnly />}>
          <Route path={paths.chooseRole} element={<ChooseRole />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path={paths.forbidden} element={<Forbidden />} />
          <Route element={<AppShell />}>
            <Route element={<RequireRole roles={MANAGERS} />}>
              <Route path={paths.dashboard} element={<Dashboard />} />
              <Route path="/properties/new" element={<PropertyForm />} />
              <Route path="/properties/:id/edit" element={<PropertyForm />} />
              <Route
                path="/properties/:propertyId/units/new"
                element={<UnitForm />}
              />
              <Route path="/units/:id/edit" element={<UnitForm />} />
              <Route path="/leases/new" element={<LeaseNew />} />
              <Route path="/leases/:id/edit" element={<LeaseEdit />} />
              <Route path={paths.timeline} element={<Timeline />} />
              <Route path={paths.rentRoll} element={<RentRoll />} />
            </Route>
            <Route element={<RequireRole roles={ALL} />}>
              <Route path={paths.properties} element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetail />} />
              <Route path={paths.units} element={<Units />} />
              <Route path="/units/:id" element={<UnitDetail />} />
              <Route path={paths.rentalRequests} element={<RentalRequests />} />
              <Route
                path="/rental-requests/:id"
                element={<RentalRequestDetail />}
              />
              <Route path={paths.leases} element={<Leases />} />
              <Route path="/leases/:id" element={<LeaseDetail />} />
              <Route path="/leases/:id/contract" element={<Contract />} />
              <Route path={paths.renewals} element={<Renewals />} />
              <Route
                path="/lease-renewal-requests/:id"
                element={<RenewalDetail />}
              />
            </Route>
            <Route element={<RequireRole roles={["TENANT"]} />}>
              <Route
                path="/rental-requests/new"
                element={<RentalRequestNew />}
              />
              <Route path={paths.maintenanceNew} element={<MaintenanceNew />} />
            </Route>
            <Route path={paths.home} element={<Home />} />
            <Route path={paths.maintenance} element={<Maintenance />} />
            <Route path="/maintenance/:id" element={<MaintenanceDetail />} />
            <Route path={paths.notifications} element={<Notifications />} />
            <Route path={paths.profile} element={<Profile />} />
            <Route element={<RequireRole roles={["ADMIN"]} />}>
              <Route path={paths.users} element={<Users />} />
              <Route path={paths.auditLogs} element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
export { LoadingSkeleton };
