/* Extracted from AdminDashboard.tsx; state comes from useAdmin(). */
import React from "react";
import AdminCommunitySpacesPanel from "../../../../components/AdminCommunitySpacesPanel";
import { useAdmin } from "../AdminWorkspaceContext";

const CommunitySection: React.FC = () => {
  const {
    loading,
    confirmAction,
    paths,
    activeAdminSection,
    communitySpaces,
    communitySpacesLoading,
    communitySpacesError,
    cohorts,
    fetchCommunitySpaces,
  } = useAdmin();
  return (
    <>
      {activeAdminSection === "community" && (
        <AdminCommunitySpacesPanel
          cohorts={cohorts}
          paths={paths}
          spaces={communitySpaces}
          loading={communitySpacesLoading}
          error={communitySpacesError}
          onRefresh={fetchCommunitySpaces}
          onConfirm={confirmAction}
        />
      )}
    </>
  );
};

export default CommunitySection;
