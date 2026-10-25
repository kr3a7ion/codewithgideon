export const getFunctions = () => ({});
// adminCheckPayment pretends Paystack says the checkout was paid.
export const httpsCallable = (_fns: unknown, name?: string) => async (data?: any) => {
  await new Promise((r) => setTimeout(r, 500));
  if (name === "adminCheckPayment") {
    const paid = String(data?.reference || "").includes("TEST");
    return {
      data: paid
        ? { ok: true, outcome: "credited", message: "Credited 4 weeks.", weeks: 4 }
        : { ok: true, outcome: "not_paid", message: "Not paid on Paystack (status: abandoned)." },
    };
  }
  if (name === "adminCreateStudent") {
    if (String(data?.email || "").includes("taken")) throw new Error("A student with this email already exists. Search for them on the Students page.");
    const uid = `new_${Date.now()}`;
    (globalThis as any).__previewAddStudent?.({ uid, ...data });
    return { data: { uid, existingAccount: false, setPasswordLink: "https://codewithgideon.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=preview" } };
  }
  if (name === "adminDeleteStudent") {
    (globalThis as any).__previewRemoveStudent?.(data?.uid);
    return { data: { ok: true, removed: ["profile, payments and watch progress", "chat", "sign-in"] } };
  }
  return { data: { success: true } };
};
