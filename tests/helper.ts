/**
 * Sleep asynchronously for X amount of time
 *
 * @param ms - milliseconds to wait
 * @returns
 */
export const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
