#!/usr/bin/env node
/**
 * Basic example: Initialization and configuration
 * 
 * This example shows how to initialize the Mielto client with different options.
 */

import { Mielto } from '../src/index';

async function main() {
  // Initialize with API key only (string)
  const client1 = new Mielto(process.env.MIELTO_API_KEY || 'your-api-key-here');
  
  // Initialize with options object
  const client2 = new Mielto({
    apiKey: process.env.MIELTO_API_KEY || 'your-api-key-here',
    timeout: 30000, // Optional: request timeout in milliseconds (default: 30000)
    maxRetries: 3, // Optional: maximum retry attempts (default: 3)
  });

  // Use the client
  console.log('✅ Client initialized successfully!');
  console.log('Available resources:');
  console.log('  - client.chat - Chat completions');
  console.log('  - client.memories - Memory management');
  console.log('  - client.collections - Document collections');
  console.log('  - client.compress - Text compression');

  // Clean up when done
  client1.close();
  client2.close();
}

main().catch(console.error);

