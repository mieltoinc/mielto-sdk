#!/usr/bin/env node
/**
 * Memories example: Memory management operations
 * 
 * This example demonstrates how to create, search, update, and manage memories.
 */

import { Mielto } from '../src/index';

async function main() {
  const client = new Mielto({
    apiKey: process.env.MIELTO_API_KEY || 'your-api-key-here',
  });

  console.log('=== Creating a Memory ===\n');

  // Create a memory
  const memory = await client.memories.create({
    user_id: 'user_123',
    memory: 'User prefers dark mode and uses macOS. They are a software engineer working with TypeScript.',
    topics: ['preferences', 'ui', 'platform', 'profession'],
    metadata: {
      source: 'user_settings',
      timestamp: new Date().toISOString(),
    },
  });

  console.log('Created memory:', memory.memory_id);
  console.log('Memory:', memory.memory);
  console.log('');

  console.log('=== Searching Memories ===\n');

  // Search memories
  const searchResults = await client.memories.search({
    query: 'dark mode preferences',
    user_id: 'user_123',
    limit: 5,
  });

  console.log(`Found ${searchResults.memories.length} memories:`);
  searchResults.memories.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.memory}`);
  });
  console.log('');

  console.log('=== Updating a Memory ===\n');

  // Update a memory
  const updatedMemory = await client.memories.update(memory.memory_id, {
    memory: 'User prefers dark mode, uses macOS, and is a senior software engineer working with TypeScript and React.',
    topics: ['preferences', 'ui', 'platform', 'profession', 'skills'],
  });

  console.log('Updated memory:', updatedMemory.memory);
  console.log('');

  console.log('=== Creating Memory from Messages ===\n');

  // Create memory from conversation messages
  const memoryFromMessages = await client.memories.fromMessages({
    user_id: 'user_123',
    messages: [
      { role: 'user', content: 'I love working with TypeScript and React' },
      { role: 'assistant', content: 'That\'s great! TypeScript and React are excellent technologies.' },
      { role: 'user', content: 'I also use Next.js for my projects' },
    ],
  });

  console.log('Created memory from messages:', memoryFromMessages.memories?.[0]?.memory || memoryFromMessages.message);
  console.log('');

  console.log('=== Getting Memory Chunks ===\n');

  // Get chunks of a memory
  const chunks = await client.memories.getChunks({
    user_id: memory.user_id,
    limit: 10,
  });
  console.log(`Memory has ${chunks.chunks.length} chunks:`);
  chunks.chunks.forEach((chunk, i) => {
    console.log(`  Chunk ${i + 1}: ${chunk.content.substring(0, 50)}...`);
  });
  console.log('');

  console.log('=== Listing All Memories ===\n');

  // List all memories for a user
  const allMemories = await client.memories.list({
    user_id: 'user_123',
    limit: 10,
  });

  console.log(`User has ${allMemories.memories.length} memories`);
  console.log('');

  console.log('=== Replacing a Memory ===\n');

  // Replace a memory (full replacement)
  const replacedMemory = await client.memories.replace(memory.memory_id, {
    user_id: 'user_123',
    memory: 'User is a software engineer who prefers dark mode on macOS.',
    topics: ['profession', 'preferences'],
  });

  console.log('Replaced memory:', replacedMemory.memory);
  console.log('');

  console.log('=== Deleting a Memory ===\n');

  // Delete a memory
  await client.memories.delete(memory.memory_id);
  console.log('Memory deleted successfully');

  client.close();
}

main().catch(console.error);

