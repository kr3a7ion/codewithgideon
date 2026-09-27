/* Community: WhatsApp/Discord groups and other spaces students can join. */
import React from "react";
import AdminCommunitySpacesPanel from "../../../../components/AdminCommunitySpacesPanel";
import { useAdmin } from "../AdminWorkspaceContext";
import { AdminPage } from "../ui";

const CommunityPage: React.FC = () => {
  const {
    confirmAction,
    paths,
    communitySpaces,
    communitySpacesLoading,
    communitySpacesError,
    cohorts,
    fetchCommunitySpaces,
  } = useAdmin();
  return (
    <AdminPage
      title="Community"
      description="Group chats and rooms students can join, for everyone or for one cohort."
    >
      <AdminCommunitySpacesPanel
        cohorts={cohorts}
        paths={paths}
        spaces={communitySpaces}
        loading={communitySpacesLoading}
        error={communitySpacesError}
        onRefresh={fetchCommunitySpaces}
        onConfirm={confirmAction}
      />
    </AdminPage>
  );
};

export default CommunityPage;
