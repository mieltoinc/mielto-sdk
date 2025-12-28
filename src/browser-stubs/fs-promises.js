// Browser stub for fs/promises
// This module is never actually used in browser environments
// It exists only to satisfy Vite's static analysis

export default {
  readFile: () => {
    throw new Error('fs/promises is not available in browser environments');
  },
};

