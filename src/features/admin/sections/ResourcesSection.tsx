/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import AdminResourcesPanel from "../../../../components/AdminResourcesPanel";
import { useAdmin } from "../AdminWorkspaceContext";

const ResourcesSection: React.FC = () => {
  const {
    loading,
    confirmAction,
    paths,
    activeAdminSection,
    courses,
    resources,
    resourcesLoading,
    resourcesError,
    cohorts,
    selectedCohortId,
    setSelectedCohortId,
    sessions,
    sessionsLoading,
    fetchResources,
  } = useAdmin();
  return (
    <>
      {activeAdminSection === "resources" && (
        <AdminResourcesPanel
          cohorts={cohorts}
          paths={paths}
          courses={courses}
          sessions={sessions}
          resources={resources}
          loading={resourcesLoading}
          sessionsLoading={sessionsLoading}
          error={resourcesError}
          selectedCohortId={selectedCohortId}
          onSelectCohort={setSelectedCohortId}
          onRefresh={fetchResources}
          onConfirm={confirmAction}
        />
      )}
    </>
  );
};

export default ResourcesSection;
