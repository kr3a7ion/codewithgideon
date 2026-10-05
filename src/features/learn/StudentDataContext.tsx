import { createContext, useContext } from "react";
import type { MentorContext, StudentData } from "./useStudentData";
import type { StudentSection } from "./lib";

export type StudentActions = {
  goTo: (section: StudentSection) => void;
  /** First payment (or an unfinished checkout). */
  continuePayment: () => void;
  /** Opens the Add weeks dialog. */
  openTopUp: () => void;
  logout: () => void;
  /** Opens Mentor chat with a class attached to the next message. */
  askAbout: (context: MentorContext) => void;
  chatContext: MentorContext | null;
  setChatContext: (context: MentorContext | null) => void;
  firstName: string;
  isDark?: boolean;
  onToggleTheme?: () => void;
};

const StudentDataContext = createContext<(StudentData & StudentActions) | null>(null);

export const StudentDataProvider = StudentDataContext.Provider;

export const useStudent = () => {
  const value = useContext(StudentDataContext);
  if (!value) throw new Error("useStudent must be used inside the student area");
  return value;
};
