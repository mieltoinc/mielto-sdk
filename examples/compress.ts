#!/usr/bin/env node
/**
 * Compress example: Text compression
 * 
 * This example demonstrates how to compress text using the Mielto compression API.
 */

import { Mielto } from '../src/index';
import dotenv from 'dotenv';
dotenv.config();
async function main() {
  const client = new Mielto({
    apiKey: process.env.MIELTO_API_KEY || 'your-api-key-here',
  });

  console.log('=== Text Compression ===\n');

  const longText = `
    Artificial Intelligence (AI) has become one of the most transformative
    technologies of our time. Machine learning algorithms can process vast
    amounts of data to identify patterns and make predictions. Deep learning,
    a subset of machine learning, uses neural networks with multiple layers
    to solve complex problems. Natural language processing enables computers
    to understand and generate human language. Computer vision allows machines
    to interpret and understand visual information from the world around them.
    These technologies are being applied across industries, from healthcare
    to finance, from transportation to entertainment, revolutionizing how we
    work and live.
  `;

  console.log('Original text length:', longText.length, 'characters');
  console.log('Original text preview:', longText.substring(0, 100) + '...\n');

  // Compress text
  const result = await client.compress.compress({
    content: longText,
    include_metadata: true,
  });

  console.log('=== Compression Results ===\n');
  console.log('Original length:', result.original_length, 'characters');
  console.log('Compressed length:', result.compressed_length, 'characters');
  
  if (result.original_length && result.compressed_length) {
    const ratio = result.compressed_length / result.original_length;
    console.log('Compression ratio:', ratio.toFixed(2));
  }
  
  if (result.compression_time) {
    console.log('Compression time:', result.compression_time, 'seconds');
  }

  if (result.content) {
    console.log('\nCompressed content preview:', result.content.substring(0, 100) + '...');
  }

  if (result.status) {
    console.log('\nStatus:', result.status);
  }

  console.log('\n=== Compression without Metadata ===\n');

  // Compress without metadata
  const simpleResult = await client.compress.compress({
    content: 'This is a shorter text that will be compressed.',
    include_metadata: false,
  });

  console.log('Original:', simpleResult.original_length, 'characters');
  console.log('Compressed:', simpleResult.compressed_length, 'characters');

  client.close();
}

main().catch(console.error);

