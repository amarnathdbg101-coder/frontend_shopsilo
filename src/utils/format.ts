export const formatCurrency = (
  amount: number,
  currency: string = "INR",
  locale: string = "en-IN"
): string => {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString(locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `₹${formatted}`;
};

export const formatDate = (
  isoDateString: string,
  locale: string = "en-IN"
): string => {
  try {
    const date = new Date(isoDateString);
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return isoDateString;
  }
};
