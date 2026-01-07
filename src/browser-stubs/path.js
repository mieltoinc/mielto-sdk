// Browser stub for path
// This module is never actually used in browser environments
// It exists only to satisfy Vite's static analysis

export default {
  basename: () => {
    throw new Error('path is not available in browser environments');
  },
  extname: () => {
    throw new Error('path is not available in browser environments');
  },
};

