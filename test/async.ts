export const flushPromises = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
};
