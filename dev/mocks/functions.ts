export const getFunctions = () => ({});
export const httpsCallable = () => async () => {
  await new Promise((r) => setTimeout(r, 400));
  return { data: { success: true } };
};
