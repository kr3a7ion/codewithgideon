/* Resources: files and links for students (slides, code, references). */
import React from "react";
import AdminResourcesPanel from "../../../../components/AdminResourcesPanel";
import { useAdmin } from "../AdminWorkspaceContext";
import { AdminPage } from "../ui";

const ResourcesPage: React.FC = () => {
  const {
    confirmAction,
    paths,
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
    <AdminPage
      title="Resources"
      description="Slides, starter code and links. Students see published resources for their course; you can tie one to a week or a class."
    >
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
    </AdminPage>
  );
};

export default ResourcesPage;
