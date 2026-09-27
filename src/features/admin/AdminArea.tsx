import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAdminWorkspace, type AdminWorkspaceProps } from "./useAdminWorkspace";
import { AdminWorkspaceProvider } from "./AdminWorkspaceContext";
import AdminLayout from "./layout/AdminLayout";
import { LEGACY_ADMIN_REDIRECTS } from "./nav";
import TodayPage from "./pages/TodayPage";
import StudentsPage from "./pages/StudentsPage";
import PaymentsPage from "./pages/PaymentsPage";
import InboxPage from "./pages/InboxPage";
import ClassesPage from "./pages/ClassesPage";
import CohortsPage from "./pages/CohortsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CoursesPage from "./pages/CoursesPage";
import ResourcesPage from "./pages/ResourcesPage";
import CommunityPage from "./pages/CommunityPage";
import SettingsPage from "./pages/SettingsPage";

type Props = AdminWorkspaceProps & {
  isDark?: boolean;
  onToggleTheme?: () => void;
};

/**
 * Admin area. Data and actions live in useAdminWorkspace(); pages read them
 * through useAdmin(). Each page has its own URL under /admin.
 */
const AdminArea: React.FC<Props> = ({ isDark, onToggleTheme, ...props }) => {
  const workspace = useAdminWorkspace(props);
  return (
    <AdminWorkspaceProvider value={workspace}>
      <AdminLayout isDark={isDark} onToggleTheme={onToggleTheme}>
        <Routes>
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<TodayPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="cohorts" element={<CohortsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {Object.entries(LEGACY_ADMIN_REDIRECTS).map(([from, to]) => (
            <Route key={from} path={from} element={<Navigate to={to} replace />} />
          ))}
          <Route path="*" element={<Navigate to="today" replace />} />
        </Routes>
      </AdminLayout>
    </AdminWorkspaceProvider>
  );
};

export default AdminArea;
