export const toggleId = (ids: readonly number[], id: number): number[] => {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
};
