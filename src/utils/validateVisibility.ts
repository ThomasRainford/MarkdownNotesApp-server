import { Error } from "../resolvers/object-types/Error";

export const validateVisibility = (visibility: string): Error | null => {
  const validVisibilities = ["public", "private"];
  if (!validVisibilities.includes(visibility)) {
    return {
      property: "visibility",
      message: "Visibility can only be public or private.",
    };
  }

  return null;
};
