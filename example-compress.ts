#!/usr/bin/env node

import { MieltoCompressClient } from './src/index.js';
import { TEST_CONTENT } from './src/test-constants.js';

async function test() {
  // Create client - no configuration needed, uses defaults
  const client = new MieltoCompressClient();
  
  // If you need an API key, just pass it as a string:
  // const client = new MieltoCompressClient(process.env.MIELTO_API_KEY');
  
  // Create request
  const REQUEST_BODY = {
    content: TEST_CONTENT,
    include_metadata: false
  };

  // Compress
  const result = await client.compress(REQUEST_BODY);
  
  console.log('✅ Compression successful!');
  console.log(`Original: ${result.original_length || 'N/A'} chars`);
  console.log(`Compressed: ${result.compressed_length || 'N/A'} chars`);
  console.log(`Time: ${result.compression_time || 'N/A'}s`);
  
}

test().catch(console.error);