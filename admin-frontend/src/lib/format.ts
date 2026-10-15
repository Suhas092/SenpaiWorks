export const money = (value: unknown) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;
