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
import { SystemConfigsPage } from "@/pages/system-configs";
import { SystemDictsPage } from "@/pages/system-dicts";
import { UsersPage } from "@/pages/users";

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
        path: "forms/basic",
        element: <FormExamplePage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "system/dicts",
        element: <SystemDictsPage />,
      },
      {
        path: "system/configs",
        element: <SystemConfigsPage />,
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
