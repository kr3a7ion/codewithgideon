import React from "react";
import type { SessionDoc } from "../../../../services/registrationStore";
import { Badge } from "../../../ui";
import { getSessionTags } from "../lib";

export const SessionTags: React.FC<{ session: SessionDoc }> = ({ session }) => {
  const tags = getSessionTags(session);
  if (!tags.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) =>
        tag === "LIVE" ? (
          <Badge key={tag} tone="danger" icon={<span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}>
            Live now
          </Badge>
        ) : tag === "JOIN LINK AVAILABLE" ? (
          <Badge key={tag} tone="navy">Join link ready</Badge>
        ) : (
          <Badge key={tag} tone="orange">Recording soon</Badge>
        ),
      )}
    </div>
  );
};
