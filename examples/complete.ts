#!/usr/bin/env node
/**
 * Complete example: All features in one
 * 
 * This comprehensive example demonstrates all features of the Mielto SDK
 * including error handling and best practices.
 */

import { Mielto, MieltoError } from '../src/index';

async function main() {
  // Initialize client
  const client = new Mielto({
    apiKey: process.env.MIELTO_API_KEY || 'your-api-key-here',
    timeout: 30000,
    maxRetries: 3,
  });

  try {
    console.log('🚀 Mielto SDK Complete Example\n');
    console.log('=' .repeat(50) + '\n');

    // 1. Chat Completions
    console.log('1️⃣  Chat Completions\n');
    try {
      const chatResponse = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello! Can you help me understand TypeScript?' },
        ],
        max_tokens: 100,
        stream: false,
      });
      if ('choices' in chatResponse) {
        const content = chatResponse.choices[0]?.message?.content;
        const displayContent = typeof content === 'string' ? content.substring(0, 100) : JSON.stringify(content).substring(0, 100);
        console.log('✅ Chat response:', displayContent + '...\n');
      }
    } catch (error) {
      console.log('❌ Chat error:', error instanceof MieltoError ? error.message : String(error));
    }

    // 2. Memories
    console.log('2️⃣  Memories\n');
    try {
      const memory = await client.memories.create({
        user_id: 'demo_user',
        memory: 'User is learning TypeScript and wants to build a web application.',
        topics: ['learning', 'typescript', 'web-development'],
      });
      console.log('✅ Created memory:', memory.memory_id);

      const searchResults = await client.memories.search({
        query: 'TypeScript',
        user_id: 'demo_user',
        limit: 3,
      });
      console.log(`✅ Found ${searchResults.memories.length} memories\n`);
    } catch (error) {
      console.log('❌ Memory error:', error instanceof MieltoError ? error.message : String(error));
    }

    // 3. Collections
    console.log('3️⃣  Collections\n');
    try {
      const collection = await client.collections.create({
        name: 'Demo Collection',
        description: 'A demo collection for testing',
      });
      console.log('✅ Created collection:', collection.id);

      await client.collections.insert({
        collection_id: collection.id,
        content: 'This is a sample document about artificial intelligence and machine learning.',
        label: 'AI Document',
        ingest: true,
      });
      console.log('✅ Inserted content');

      const searchResults = await client.collections.search({
        query: 'artificial intelligence',
        collection_id: collection.id,
        limit: 3,
      });
      console.log(`✅ Found ${searchResults.results.length} relevant results\n`);
    } catch (error) {
      console.log('❌ Collection error:', error instanceof MieltoError ? error.message : String(error));
    }

    // 4. Compression
    console.log('4️⃣  Text Compression\n');
    try {
      const compressResult = await client.compress.compress({
        content: 'This is a long text that will be compressed to demonstrate the compression feature of the Mielto API.',
        include_metadata: false,
      });
      console.log(`✅ Compressed: ${compressResult.original_length} → ${compressResult.compressed_length} characters\n`);
    } catch (error) {
      console.log('❌ Compression error:', error instanceof MieltoError ? error.message : String(error));
    }

    console.log('=' .repeat(50));
    console.log('✅ Example completed successfully!');

  } catch (error) {
    if (error instanceof MieltoError) {
      console.error('❌ Mielto Error:', error.message);
      console.error('Status Code:', error.statusCode);
      console.error('Response Data:', error.responseData);
    } else {
      console.error('❌ Unexpected error:', error);
    }
  } finally {
    client.close();
  }
}

main().catch(console.error);

