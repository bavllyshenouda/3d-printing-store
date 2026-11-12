export const paymentConfig = {
  instapayHandle: (process.env.NEXT_PUBLIC_INSTAPAY_HANDLE || "").trim(),
  vodafoneCashNumber: (process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER || "").trim(),
};

