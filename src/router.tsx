import { createBrowserRouter, Navigate } from "react-router-dom";
import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { AccountProfilePage } from "@/pages/account-profile";
import { ChangePasswordPage } from "@/pages/change-password";
import { DashboardPage } from "@/pages/dashboard";
import { FormExamplePage } from "@/pages/form-example";
import { LoginPage } from "@/pages/login";
import { NotFoundPage } from "@/pages/not-found";
import { SettingsPage } from "@/pages/settings";
import { SystemDeptsPage } from "@/pages/system-depts";
import { SystemRolesPage } from "@/pages/system-roles";
import { SystemMenusPage } from "@/pages/system-menus";
import { SystemPermissionsPage } from "@/pages/system-permissions";
import { SystemConfigsPage } from "@/pages/system-configs";
import { SystemDictsPage } from "@/pages/system-dicts";
import { SystemLoginLogsPage } from "@/pages/system-login-logs";
import { UsersPage } from "@/pages/users";
import { SystemOperLogsPage } from "@/pages/system-oper-logs";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "users",
        element: <UsersPage />,
      },
      {
        path: "system/user",
        element: <UsersPage />,
      },
      {
        path: "forms/basic",
        element: <FormExamplePage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "system",
        element: <Navigate to="/system/user" replace />,
      },
      {
        path: "system/depts",
        element: <SystemDeptsPage />,
      },
      {
        path: "system/dept",
        element: <SystemDeptsPage />,
      },
      {
        path: "system/dicts",
        element: <SystemDictsPage />,
      },
      {
        path: "system/dict",
        element: <SystemDictsPage />,
      },
      {
        path: "system/configs",
        element: <SystemConfigsPage />,
      },
      {
        path: "system/config",
        element: <SystemConfigsPage />,
      },
      {
        path: "system/roles",
        element: <SystemRolesPage />,
      },
      {
        path: "system/role",
        element: <SystemRolesPage />,
      },
      {
        path: "system/menus",
        element: <SystemMenusPage />,
      },
      {
        path: "system/menu",
        element: <SystemMenusPage />,
      },
      {
        path: "system/permissions",
        element: <SystemPermissionsPage />,
      },
      {
        path: "system/login-log",
        element: <SystemLoginLogsPage />,
      },
      {
        path: "system/oper-log",
        element: <SystemOperLogsPage />,
      },
      {
        path: "account/profile",
        element: <AccountProfilePage />,
      },
      {
        path: "account/change-password",
        element: <ChangePasswordPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
