import React from "react";
import { motion } from "framer-motion";
import { pageShellClass } from "./lib";
import { useAdminWorkspace, type AdminWorkspaceProps } from "./useAdminWorkspace";
import { AdminWorkspaceProvider } from "./AdminWorkspaceContext";
import AdminHeader from "./shell/AdminHeader";
import NoticeBar from "./shell/NoticeBar";
import ConfirmDialog from "./shell/ConfirmDialog";
import StatsRow from "./shell/StatsRow";
import SectionNav from "./shell/SectionNav";
import PathsSection from "./sections/PathsSection";
import ActiveCohortSection from "./sections/ActiveCohortSection";
import CohortSessionsSection from "./sections/CohortSessionsSection";
import MessagesSection from "./sections/MessagesSection";
import MobileChatSection from "./sections/MobileChatSection";
import PaymentsSection from "./sections/PaymentsSection";
import SettingsSection from "./sections/SettingsSection";
import ResourcesSection from "./sections/ResourcesSection";
import CommunitySection from "./sections/CommunitySection";
import MobileChatModal from "./modals/MobileChatModal";
import SupportInboxModal from "./modals/SupportInboxModal";
import SheetsConfigModal from "./modals/SheetsConfigModal";
import CoursesSection from "./sections/CoursesSection";
import CourseModal from "./modals/CourseModal";
import SessionModal from "./modals/SessionModal";
import RegistrationsSection from "./sections/RegistrationsSection";
import AdminFooter from "./shell/AdminFooter";

/**
 * Admin area. State lives in useAdminWorkspace(); each block below reads it
 * through useAdmin() and renders only when its section (URL) is active.
 */
const AdminArea: React.FC<AdminWorkspaceProps> = (props) => {
  const workspace = useAdminWorkspace(props);
  return (
    <AdminWorkspaceProvider value={workspace}>
      <div className={pageShellClass}>
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
          >
            <AdminHeader />
            <NoticeBar />
            <ConfirmDialog />
            <StatsRow />
            <SectionNav />
            <PathsSection />
            <ActiveCohortSection />
            <CohortSessionsSection />
            <MessagesSection />
            <MobileChatSection />
            <PaymentsSection />
            <SettingsSection />
            <ResourcesSection />
            <CommunitySection />
            <MobileChatModal />
            <SupportInboxModal />
            <SheetsConfigModal />
            <CoursesSection />
            <CourseModal />
            <SessionModal />
            <RegistrationsSection />
            <AdminFooter />
          </motion.div>
        </div>
      </div>
    </AdminWorkspaceProvider>
  );
};

export default AdminArea;
