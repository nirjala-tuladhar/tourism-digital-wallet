export const formatZodError = (error: {
  issues: Array<{ message: string }>;
}): string => {
  return error.issues[0]?.message || "Invalid request data";
};
