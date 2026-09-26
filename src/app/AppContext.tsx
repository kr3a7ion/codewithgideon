import React, { createContext, useContext } from "react";
import { useAppLogic } from "../../hooks/useAppLogic";

export type AppState = ReturnType<typeof useAppLogic>;

const AppContext = createContext<AppState | null>(null);

/** Holds auth, theme and navigation state for the whole app. */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const value = useAppLogic();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppState => {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside <AppProvider>");
  return value;
};
