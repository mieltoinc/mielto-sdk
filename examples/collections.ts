#!/usr/bin/env node
/**
 * Collections example: Document collection management
 * 
 * This example demonstrates how to create collections, insert content,
 * upload files, and search within collections.
 */

import { Mielto } from '../src/index';

import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new Mielto({
    apiKey: process.env.MIELTO_API_KEY || 'your-api-key-here',
  });

  console.log('=== Creating a Collection ===\n');

  // Create a collection
  const collection = await client.collections.create({
    name: 'My Documents ' + new Date().toISOString(),
    description: 'A collection of important documents',
    metadata: {
      category: 'personal',
    },
  });

  console.log('Created collection:', collection.id);
  console.log('Name:', collection.name);
  console.log('');

  console.log('=== Inserting Text Content ===\n');

  // Insert text content
  const insertResult = await client.collections.insert({
    collection_id: collection.id,
    content: `
      Artificial Intelligence (AI) is transforming the way we work and live.
      Machine learning algorithms can now process vast amounts of data to identify
      patterns and make predictions. Deep learning, a subset of machine learning,
      uses neural networks to solve complex problems.
    `,
    label: 'AI Introduction',
    description: 'Introduction to artificial intelligence',
    ingest: true, // Process and index the content
  });

  console.log('Inserted content:', insertResult.contents[0]?.id || 'N/A');
  console.log('Status:', insertResult.status);
  console.log('Successful uploads:', insertResult.successful_uploads);
  console.log('');

  console.log('=== Inserting File from Path (Node.js only) ===\n');

  // Insert file from path (Node.js environment only)
  try {
    // Note: In a real scenario, you would use an existing file path
    // For this example, we'll use file_base64 instead
    const sampleContent = 'This is a sample document about TypeScript and Node.js.';
    const fileBuffer = Buffer.from(sampleContent);
    const fileBase64 = fileBuffer.toString('base64');

    const fileInsertResult = await client.collections.insert({
      collection_id: collection.id,
      file_base64: fileBase64,
      label: 'sample-document.txt',
      mimetype: 'text/plain',
      ingest: true,
    });

    console.log('Inserted file:', fileInsertResult.contents[0]?.id || 'N/A');
    console.log('Status:', fileInsertResult.status);
    console.log('');
  } catch (error: any) {
    console.log('File path example skipped (requires actual file):', error.message);
    console.log('');
  }

  console.log('=== Inserting Multiple Files ===\n');

  // Insert multiple files by calling insert multiple times
  const doc1Content = Buffer.from('Document 1: Introduction to TypeScript').toString('base64');
  const doc2Content = Buffer.from('Document 2: Advanced TypeScript Patterns').toString('base64');

  const file1Result = await client.collections.insert({
    collection_id: collection.id,
    file_base64: doc1Content,
    label: 'doc1.txt',
    mimetype: 'text/plain',
    ingest: true,
  });

  const file2Result = await client.collections.insert({
    collection_id: collection.id,
    file_base64: doc2Content,
    label: 'doc2.txt',
    mimetype: 'text/plain',
    ingest: true,
  });

  console.log('Inserted file 1:', file1Result.contents[0]?.id || 'N/A');
  console.log('Inserted file 2:', file2Result.contents[0]?.id || 'N/A');
  console.log('');

  console.log('=== Inserting URLs ===\n');

  // Insert content from URLs
  const urlResult = await client.collections.insert({
    collection_id: collection.id,
    urls: [
      'https://www.typescriptlang.org/docs/handbook/intro.html',
    ],
    label: 'TypeScript Handbook',
    ingest: true,
  });

  console.log('Inserted URL:', urlResult.contents[0]?.id || 'N/A');
  console.log('Status:', urlResult.status);
  console.log('');

  console.log('=== Searching in Collection ===\n');

  // Search within the collection
  const searchResults = await client.collections.search({
    query: 'artificial intelligence machine learning',
    collection_id: collection.id,
    limit: 5,
  });

  console.log(`Found ${searchResults.results.length} relevant results:`);
  searchResults.results.forEach((result, i) => {
    console.log(`\n  ${i + 1}. Score: ${result.score.toFixed(3)}`);
    console.log(`     Content: ${result.content.substring(0, 100)}...`);
    if (result.metadata) {
      console.log(`     Metadata:`, result.metadata);
    }
  });
  console.log('');

  console.log('=== Getting Collection Chunks ===\n');

  // Get all chunks from a collection
  const chunks = await client.collections.getChunks({
    collection_id: collection.id,
    limit: 10,
  });
  console.log(`Collection has ${chunks.data.length} chunks`);
  chunks.data.forEach((chunk, i) => {
    console.log(`  Chunk ${i + 1}: ${chunk.content.substring(0, 50)}...`);
  });
  console.log('');

  console.log('=== Updating Collection ===\n');

  // // Update collection metadata
  // const updatedCollection = await client.collections.update(collection.id, {
  //   name: 'My Updated Documents',
  //   description: 'An updated collection of important documents',
  //   metadata: {
  //     category: 'personal',
  //     updated_at: new Date().toISOString(),
  //   },
  // });

  // console.log('Updated collection:', updatedCollection.name);
  console.log('');

  console.log('=== Listing Collections ===\n');

  // List all collections
  const allCollections = await client.collections.list({
    limit: 10,
  });

  console.log(`You have ${allCollections.data.length} collections (total: ${allCollections.total_count})`);
  allCollections.data.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col.name} (${col.id})`);
  });
  console.log('');

  console.log('=== Deleting Collection ===\n');

  // // Delete the collection
  // await client.collections.delete(collection.id);
  // console.log('Collection deleted successfully');

  client.close();
}

main().catch(console.error);

