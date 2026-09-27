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
  return { data: { success: true } };
};
