import React from "react";
import { useStudent } from "./StudentDataContext";
import { PageHeader, UpdatesBell } from "./ui";

/**
 * Page title for a student section. On desktop the Updates bell sits at the
 * right of the title row; on phones the bell lives in the app header.
 */
export const StudentPageHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  /** Hide the whole header on phones (e.g. chat, where space is tight). */
  compactOnPhone?: boolean;
  /** Show the big title on phones too. Off by default: the app header
      already names the page, so phones only see the description. */
  phoneTitle?: boolean;
}> = ({ title, description, actions, className, compactOnPhone, phoneTitle }) => {
  const s = useStudent();
  return (
    <PageHeader
      title={phoneTitle ? title : <span className="sr-only lg:not-sr-only">{title}</span>}
      description={description}
      className={[compactOnPhone ? "hidden lg:flex" : "", className || ""].join(" ").trim()}
      actions={
        <>
          {actions}
          <UpdatesBell unread={s.unreadNotificationCount > 0} className="hidden lg:flex" />
        </>
      }
    />
  );
};
