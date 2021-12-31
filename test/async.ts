export const flushPromises = () => {
  const p = new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  jest.runAllTimers();
  return p;
};
