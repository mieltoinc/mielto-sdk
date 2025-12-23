/** Mielto TypeScript SDK - Main entry point. */

// Client classes
export { Mielto, MieltoOptions, BaseClient, BaseClientOptions } from './clients/index.js';

// Exception classes
export * from './exceptions.js';

// Type definitions
export * from './types/index.js';

// Resource classes
export * from './resources/index.js';

// Legacy compress client (deprecated - use Mielto.compress instead)
// Note: Legacy client kept for backward compatibility
export { MieltoCompressClient } from './legacy/compress.js';
