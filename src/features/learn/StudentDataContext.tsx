import React, { createContext, useContext } from "react";
import type { StudentData } from "./useStudentData";
import type { StudentSection } from "./lib";

export type StudentActions = {
  goTo: (section: StudentSection) => void;
  continuePayment: () => void;
  openTopUp: () => void;
};

const StudentDataContext = createContext<(StudentData & StudentActions) | null>(null);

export const StudentDataProvider = StudentDataContext.Provider;

export const useStudent = () => {
  const value = useContext(StudentDataContext);
  if (!value) throw new Error("useStudent must be used inside the student area");
  return value;
};
