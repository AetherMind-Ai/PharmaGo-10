export const generateMTP = (): string => {
  const min = 100000; // Smallest 6-digit number
  const max = 999999; // Largest 6-digit number
  const mtp = Math.floor(Math.random() * (max - min + 1)) + min;
  return mtp.toString();
};
