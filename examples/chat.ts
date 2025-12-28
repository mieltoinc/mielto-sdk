#!/usr/bin/env node
/**
 * Chat example: Chat completions with streaming and non-streaming
 * 
 * This example demonstrates how to use the chat API for both
 * streaming and non-streaming completions.
 */

import { Mielto } from '../src/index';

async function main() {
  const client = new Mielto({
    apiKey: process.env.MIELTO_API_KEY || 'your-api-key-here',
  });

  console.log('=== Non-streaming Chat Completion ===\n');

  // Non-streaming chat completion
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is the capital of France?' },
    ],
    temperature: 0.7,
    max_tokens: 100,
    stream: false,
  });

  // Type guard to check if it's a ChatCompletion (not a stream)
  if ('choices' in response) {
    const content = response.choices[0]?.message?.content;
    const displayContent = typeof content === 'string' ? content : JSON.stringify(content);
    console.log('Response:', displayContent);
    console.log('Usage:', response.usage);
  }
  console.log('');

  console.log('=== Streaming Chat Completion ===\n');

  // Streaming chat completion
  const streamResponse = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Tell me a short joke about programming.' },
    ],
    temperature: 0.7,
    max_tokens: 150,
    stream: true,
  });

  // Check if it's a stream
  if (Symbol.asyncIterator in streamResponse) {
    console.log('Streaming response:');
    for await (const chunk of streamResponse) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        process.stdout.write(text);
      }
    }
    console.log('\n');
  }

  // Chat with tools/function calling
  console.log('=== Chat with Tools ===\n');

  const toolResponse = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'user', content: 'What is the weather in San Francisco?' },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: 'Get the current weather in a given location',
          parameters: {
            type: 'object',
            properties: {
              location: {
                type: 'string',
                description: 'The city and state, e.g. San Francisco, CA',
              },
              unit: {
                type: 'string',
                enum: ['celsius', 'fahrenheit'],
                description: 'Temperature unit',
              },
            },
            required: ['location'],
          },
        },
      },
    ],
    tool_choice: 'auto',
  });

  console.log('Response:', JSON.stringify(toolResponse, null, 2));

  client.close();
}

main().catch(console.error);

