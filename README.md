# Mielto TypeScript SDK

Official TypeScript/JavaScript client library for the Mielto API.

## Installation

```bash
npm install @mielto/mielto-sdk
```

Or install from source:

```bash
cd libs/mielto_typescript
npm install
npm run build
```

## Quick Start

```typescript
import { Mielto } from '@mielto/mielto-sdk';
import { MemoryCreate, CollectionCreate, SearchRequest } from '@mielto/mielto-sdk';

// Initialize the client
const client = new Mielto({ apiKey: 'your-api-key' });

// Create a memory
const memory = await client.memories.create({
  user_id: 'user_123',
  memory: 'User prefers dark mode',
  topics: ['preferences', 'ui']
});

// Create a collection
const collection = await client.collections.create({
  name: 'My Documents',
  description: 'Personal document collection'
});

// Insert content into collection
await client.collections.insert({
  collection_id: collection.id,
  content: 'Document content here...'
});

// Search in collection
const results = await client.collections.search({
  query: 'artificial intelligence',
  collection_id: collection.id,
  max_results: 10
});

// Compress text
const compressed = await client.compress.compress({
  content: 'This is a long text that needs compression...'
});

// Close the client when done
client.close();
```

## Features

### 💬 Chat (OpenAI-Compatible)

OpenAI-compatible chat completions with intelligent context injection:

- **OpenAI SDK compatibility** - Drop-in replacement for OpenAI chat completions
- **Streaming support** - Real-time streaming responses
- **Tool/Function calling** - Full support for OpenAI function calling
- **Automatic context injection** - Retrieve and inject relevant memories and knowledge
- **Unlimited context** - No more token limits with intelligent context management
- **Multi-turn conversations** - Persistent conversation history

### 🧠 Memories

Manage user memories for contextual AI interactions:

- **Create** memories from text or messages
- **Search** memories with semantic search
- **Update** and **delete** memories
- **List** memories with pagination
- **Generate** memories from conversation messages

### 📚 Collections

Organize and search your knowledge base:

- **Create** and manage collections
- **Insert** content (files, text, URLs)
- **Search** with multiple search types (semantic, hybrid, fulltext)
- **Filter** by tags, status, and metadata
- Support for multiple vector stores (pgvector, Pinecone, Qdrant)

### 🗜️ Compress

AI-powered text compression:

- Compress long texts while preserving meaning
- Support for message history compression
- Async compression with webhooks
- Includes compression metrics

### 🔧 Tools

AI SDK and OpenAI function calling tools for memories and collections:

- **Unified API** - Single `MieltoTools` class for both AI SDK and OpenAI
- **Memory tools** - Search, add, and list memories
- **Collection tools** - Search, insert, and list collections
- **AI SDK integration** - Direct integration with Vercel AI SDK
- **OpenAI function calling** - Native OpenAI function definitions and executors
- **Type-safe** - Full TypeScript support with Zod schemas

## Usage Examples

### Chat Completions

The Mielto chat API is OpenAI-compatible and provides intelligent context injection:

```typescript
import { Mielto } from '@mielto/mielto-sdk';

const client = new Mielto({ apiKey: 'your-api-key' });

// Basic chat completion
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is machine learning?' }
  ],
  temperature: 0.7,
  max_tokens: 500
});

console.log(response.choices[0].message.content);
```

#### Streaming Chat

```typescript
// Stream responses in real-time
const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'Tell me a story about AI' }
  ],
  stream: true
});

for await (const chunk of stream) {
  if (chunk.choices[0].delta.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
}
```

#### Chat with Context Injection

Automatically inject relevant memories and knowledge into your chat:

```typescript
// Chat with automatic context injection
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'What did we discuss about Python yesterday?' }
  ],
  // Mielto-specific parameters for context injection
  user_id: 'user_123',
  conversation_id: 'conv_456',
  workspace_id: 'workspace_789',
  collection_ids: ['knowledge_base_1', 'docs_collection']
});

console.log(response.choices[0].message.content);
```

#### Function/Tool Calling

Full support for OpenAI function calling:

```typescript
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g., San Francisco, CA'
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit']
          }
        },
        required: ['location']
      }
    }
  }
];

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: "What's the weather in San Francisco?" }
  ],
  tools: tools,
  tool_choice: 'auto'
});

// Check if the model wants to call a function
if (response.choices[0].message.tool_calls) {
  const toolCall = response.choices[0].message.tool_calls[0];
  console.log(`Function: ${toolCall.function.name}`);
  console.log(`Arguments: ${toolCall.function.arguments}`);
}
```

### Memories

```typescript
import { Mielto } from '@mielto/mielto-sdk';

const client = new Mielto({ apiKey: 'your-api-key' });

// Create a memory
const memory = await client.memories.create({
  user_id: 'user_123',
  memory: 'User is a software engineer specializing in Python',
  topics: ['background', 'skills']
});

// Search memories
const results = await client.memories.search({
  query: 'What does the user do for work?',
  user_id: 'user_123',
  limit: 5
});

for (const memory of results.memories) {
  console.log(`Memory: ${memory.memory}`);
  console.log(`Topics: ${memory.topics}`);
}

// Generate memories from conversation
const messages = [
  { role: 'user', content: 'I love Python programming' },
  { role: 'user', content: 'I work remotely from home' }
];

const memories = await client.memories.fromMessages({
  messages: messages,
  user_id: 'user_123',
  topics: ['preferences', 'work']
});
```

### Collections

```typescript
import { Mielto } from '@mielto/mielto-sdk';
import * as fs from 'fs';

const client = new Mielto({ apiKey: 'your-api-key' });

// Create a collection
const collection = await client.collections.create({
  name: 'Research Papers',
  description: 'AI research paper collection',
  tags: ['research', 'ai']
});

// Insert text content
const result = await client.collections.insert({
  collection_id: collection.id,
  content: 'Transformers are a type of neural network architecture...',
  label: 'Transformer Notes'
});

// Insert from URL
await client.collections.insert({
  collection_id: collection.id,
  urls: ['https://arxiv.org/pdf/1706.03762.pdf']
});

// Insert file using file path (Node.js only - automatically reads and encodes)
const uploadResult = await client.collections.insert({
  collection_id: collection.id,
  file_path: './document.pdf', // Automatically reads file and converts to base64
  metadata: { author: 'John Doe', year: 2024 },
  reader: 'native' // Optional: specify reader for better processing
  // mimetype and label are auto-detected from file path
});

// Or insert file from base64 (works in both browser and Node.js)
// In Node.js: Read file and convert to base64 manually
const fileBuffer = fs.readFileSync('document.pdf');
const fileBase64 = fileBuffer.toString('base64');

const uploadResult2 = await client.collections.insert({
  collection_id: collection.id,
  file_base64: fileBase64,
  label: 'document.pdf',
  mimetype: 'application/pdf',
  metadata: { author: 'John Doe', year: 2024 }
});

// Check upload status
if (uploadResult.status === 'success') {
  console.log(`✓ Uploaded successfully: ${uploadResult.contents[0].id}`);
} else if (uploadResult.status === 'partial_success') {
  console.log(`⚠ Partial success: ${uploadResult.successful_uploads}/${uploadResult.total_uploads} files uploaded`);
  // Handle failures
  if (uploadResult.errors) {
    for (const error of uploadResult.errors) {
      console.log(`✗ Failed: ${error.name} - ${error.error}`);
    }
  }
} else {
  console.log(`✗ Upload failed`);
  if (uploadResult.errors) {
    for (const error of uploadResult.errors) {
      console.log(`  - ${error.name}: ${error.error}`);
    }
  }
}

// Insert file in browser environment - Method 1: Using File object (simplest)
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput?.files?.[0]) {
  const file = fileInput.files[0];
  
  // Directly pass the File object - SDK handles conversion automatically
  const result = await client.collections.insert({
    collection_id: collection.id,
    file: file, // File object - automatically converted to base64
    metadata: { uploaded_at: new Date().toISOString() }
    // label and mimetype are auto-detected from File object
  });
  
  console.log('Upload result:', result);
}

// Insert file in browser environment - Method 2: Using FileReader API (manual)
const fileInput2 = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput2?.files?.[0]) {
  const file = fileInput2.files[0];
  const reader = new FileReader();
  
  reader.onload = async (e) => {
    const base64 = (e.target?.result as string).split(',')[1]; // Remove data URL prefix
    
    const result = await client.collections.insert({
      collection_id: collection.id,
      file_base64: base64,
      label: file.name,
      mimetype: file.type,
      metadata: { uploaded_at: new Date().toISOString() }
    });
    
    console.log('Upload result:', result);
  };
  
  reader.readAsDataURL(file);
}

// Insert file from drag & drop
const dropZone = document.getElementById('drop-zone');
dropZone?.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      await client.collections.insert({
        collection_id: collection.id,
        file: file // Direct File object support
      });
    }
  }
});

// Insert multiple files (Node.js - using file_path)
const files = ['file1.pdf', 'file2.docx', 'file3.txt'];
for (const filePath of files) {
  await client.collections.insert({
    collection_id: collection.id,
    file_path: filePath // Automatically reads, encodes, and detects mimetype
  });
}

// Insert multiple files (Browser - using File objects)
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
if (fileInput?.files) {
  for (const file of Array.from(fileInput.files)) {
    await client.collections.insert({
      collection_id: collection.id,
      file: file // Direct File object - simplest method
    });
  }
}

// Or manually with base64 (works in both Node.js and browser)
for (const filePath of files) {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const mimetype = filePath.endsWith('.pdf') ? 'application/pdf' :
                   filePath.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                   'text/plain';
  
  await client.collections.insert({
    collection_id: collection.id,
    file_base64: base64,
    label: filePath,
    mimetype: mimetype
  });
}

// Insert with custom reader for better processing
await client.collections.insert({
  collection_id: collection.id,
  file_base64: fileBase64,
  label: 'scanned-document.pdf',
  mimetype: 'application/pdf',
  reader: 'langchain_pdfplumber' // Better OCR for scanned PDFs
});

// Search in collection
const results = await client.collections.search({
  query: 'transformer architecture',
  collection_id: collection.id,
  search_type: 'hybrid',
  max_results: 10
});

for (const result of results.results) {
  console.log(`Score: ${result.score}`);
  console.log(`Content: ${result.content.substring(0, 200)}...`);
}
```

### Compress

```typescript
import { Mielto } from '@mielto/mielto-sdk';

const client = new Mielto({ apiKey: 'your-api-key' });

// Compress simple text
const result = await client.compress.compress({
  content: 'This is a very long piece of text that contains a lot of ' +
           'information about various topics. The text goes on and on ' +
           'with detailed explanations and examples...'
});

console.log(`Original length: ${result.original_length}`);
console.log(`Compressed length: ${result.compressed_length}`);
console.log(`Compression time: ${result.compression_time}s`);
console.log(`Compressed content: ${result.content}`);

// Compress message history
const messages = [
  { role: 'user', message: "What's the weather?", created_at: '2024-01-01' },
  { role: 'assistant', message: "It's sunny today!", created_at: '2024-01-01' },
  { role: 'user', message: 'Great, thanks!', created_at: '2024-01-01' }
];

const compressed = await client.compress.compress({
  content: messages,
  include_metadata: true
});

// Async compression with webhook
const webhookResult = await client.compress.compress({
  content: 'Long text...',
  webhook_url: 'https://example.com/webhook'
});
console.log(webhookResult.message); // "Compression response will be sent to webhook"
```

### Tools

Mielto provides ready-to-use tools for AI SDK and OpenAI function calling, enabling AI models to interact with memories and collections.

#### AI SDK Integration

```typescript
import { MieltoTools } from '@mielto/mielto-sdk/tools';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

// Create tools instance
const tools = new MieltoTools(
  {
    apiKey: 'your-api-key',
    userId: 'user_123',
    collectionId: 'coll_456'
  },
  { toolTypes: 'both' }
);

// Get AI SDK tools
const aiSdkTools = tools.getAISDKTools();

// Use with AI SDK
const { text } = await generateText({
  model: openai('gpt-4'),
  messages: [
    { role: 'user', content: 'What did I say about Python yesterday?' }
  ],
  tools: aiSdkTools
});

console.log(text);
```

#### Streaming with Tools

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { MieltoTools } from '@mielto/mielto-sdk/tools';

const tools = new MieltoTools(
  { apiKey: 'your-api-key', userId: 'user_123' },
  { toolTypes: 'both' }
);

const aiSdkTools = tools.getAISDKTools();

const result = await streamText({
  model: openai('gpt-4'),
  messages: [
    { role: 'user', content: 'What did I say about Python? Also remember that I love TypeScript.' }
  ],
  tools: aiSdkTools
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

#### OpenAI Function Calling

```typescript
import { MieltoTools } from '@mielto/mielto-sdk/tools';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Create tools instance
const tools = new MieltoTools(
  {
    apiKey: 'your-mielto-api-key',
    userId: 'user_123',
    collectionId: 'coll_456'
  },
  { toolTypes: 'both' }
);

// Get OpenAI functions and executors
const functions = tools.getOpenAIFunctions();
const executors = tools.getExecutors();

// Make a chat completion request
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'What did I say about Python yesterday?' }
  ],
  tools: functions.map(fn => ({
    type: 'function' as const,
    function: fn
  })),
  tool_choice: 'auto'
});

// Handle tool calls
const message = completion.choices[0].message;

if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);
    
    // Execute the function
    const result = await executors[functionName](args);
    
    console.log(`Tool: ${functionName}`);
    console.log(`Result:`, result);
  }
}
```

#### Tool Types

You can specify which tools to include:

```typescript
// Only memory tools
const memoryTools = new MieltoTools(
  { apiKey: 'your-api-key', userId: 'user_123' },
  { toolTypes: 'memory' }
);

// Only collection tools
const collectionTools = new MieltoTools(
  { apiKey: 'your-api-key', collectionId: 'coll_456' },
  { toolTypes: 'collection' }
);

// Both (default)
const allTools = new MieltoTools(
  { apiKey: 'your-api-key', userId: 'user_123', collectionId: 'coll_456' },
  { toolTypes: 'both' }
);
```

#### Available Tools

**Memory Tools:**
- `searchMemories` - Search for memories with semantic search
- `addMemory` - Add a new memory
- `listMemories` - List all memories with pagination

**Collection Tools:**
- `searchCollection` - Search within a collection
- `insertToCollection` - Insert content into a collection
- `listCollections` - List available collections

**Utility Tools:**
- `searchAvailableTools` - Search for available tools

For complete documentation, see the [Tools Guide](./src/tools/README.md).

## Configuration

### API Key

You can provide your API key in multiple ways:

1. **Direct initialization**:
   ```typescript
   const client = new Mielto({ apiKey: 'your-api-key' });
   ```

2. **Environment variable**:
```typescript
   import { Mielto } from '@mielto/mielto-sdk';
   
   const client = new Mielto({
     apiKey: process.env.MIELTO_API_KEY || ''
   });
   ```

### Custom Base URL

For self-hosted or development environments:

```typescript
const client = new Mielto({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-instance.com/api/v1'
});
```

### Timeout and Retries

```typescript
const client = new Mielto({
  apiKey: 'your-api-key',
  timeout: 60000, // 60 seconds
  maxRetries: 3
});
```

## Error Handling

The library provides specific exception types:

```typescript
import {
  Mielto,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  PaymentRequiredError,
  CreditLimitExceededError,
  OverageLimitExceededError,
  MieltoError
} from '@mielto/mielto-sdk';

const client = new Mielto({ apiKey: 'your-api-key' });

try {
  const memory = await client.memories.get('invalid_id');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof NotFoundError) {
    console.log('Memory not found');
  } else if (error instanceof ValidationError) {
    console.log(`Validation error: ${error.message}`);
  } else if (error instanceof RateLimitError) {
    console.log('Rate limit exceeded');
  } else if (error instanceof PaymentRequiredError) {
    console.log('Payment required to access this feature');
  } else if (error instanceof CreditLimitExceededError) {
    console.log('Credit limit exceeded - please upgrade your plan');
  } else if (error instanceof OverageLimitExceededError) {
    console.log('Overage limit exceeded');
  } else if (error instanceof ServerError) {
    console.log('Server error occurred');
  } else if (error instanceof MieltoError) {
    console.log(`General error: ${error.message}`);
  }
}
```

### Exception Hierarchy

- **MieltoError** (base exception)
  - **AuthenticationError** (401) - Invalid API key
  - **PaymentRequiredError** (402) - Payment required
  - **PermissionError** (403) - Insufficient permissions
  - **NotFoundError** (404) - Resource not found
  - **ValidationError** (422) - Invalid request data
  - **RateLimitError** (429) - Too many requests
  - **ServerError** (5xx) - Server-side errors
  - **TimeoutError** - Request timeout
  - **ConnectionError** - Network connection issues
  - **CreditLimitExceededError** - Credit limit reached
  - **OverageLimitExceededError** - Overage limit reached

## Advanced Features

### Pagination

```typescript
// List memories with pagination
const result = await client.memories.list({
  user_id: 'user_123',
  limit: 50
});

for (const memory of result.memories) {
  console.log(memory.memory);
}

// Get next page
if (result.has_more) {
  const nextPage = await client.memories.list({
    user_id: 'user_123',
    cursor: result.next_cursor,
    limit: 50
  });
}
```

### Filtering Collections

```typescript
// Filter by tags
const collections = await client.collections.list({
  tags: 'research,ai',
  limit: 20
});

// Search collections
const collections = await client.collections.list({
  search: 'machine learning',
  status: 'active'
});
```

### Handling File Uploads

When inserting files into collections, the response includes detailed status information:

```typescript
// Upload a file and check the response
const result = await client.collections.insert({
  collection_id: collection.id,
  file_base64: fileBase64,
  label: 'document.pdf',
  mimetype: 'application/pdf'
});

// Check overall status
console.log(`Status: ${result.status}`); // "success", "failed", or "partial_success"
console.log(`Total: ${result.total_uploads}`);
console.log(`Successful: ${result.successful_uploads}`);
console.log(`Failed: ${result.failed_uploads}`);

// Process successful uploads
if (result.successful) {
  for (const content of result.successful) {
    console.log(`✓ ${content.name} - ID: ${content.id}`);
  }
}

// Handle failures
if (result.errors && result.errors.length > 0) {
  console.log('\nFailed uploads:');
  for (const error of result.errors) {
    console.log(`✗ ${error.name}: ${error.error}`);
  }
}

// Access all contents (successful and failed)
for (const content of result.contents) {
  if (content.error) {
    console.log(`Failed: ${content.name} - ${content.error}`);
  } else {
    console.log(`Success: ${content.name} - ${content.id}`);
  }
}
```

### File Upload Best Practices

```typescript
// 1. Use the simplest method for your environment
// Browser: Use File object (auto-detects name and mimetype)
await client.collections.insert({
  collection_id: collection.id,
  file: fileObject // Simplest - auto-detects everything
});

// Node.js: Use file_path (auto-reads and encodes)
await client.collections.insert({
  collection_id: collection.id,
  file_path: './document.pdf' // Simplest - auto-detects everything
});

// Cross-platform: Use file_base64 (works everywhere)
await client.collections.insert({
  collection_id: collection.id,
  file_base64: pdfBase64,
  label: 'document.pdf',
  mimetype: 'application/pdf' // Helps API choose the right reader
});

// 2. Add metadata for better organization
await client.collections.insert({
  collection_id: collection.id,
  file_base64: fileBase64,
  label: 'research-paper.pdf',
  metadata: {
    author: 'John Doe',
    year: 2024,
    category: 'research',
    tags: ['ai', 'ml']
  }
});

// 3. Use appropriate readers for different file types
// For scanned PDFs
await client.collections.insert({
  collection_id: collection.id,
  file_base64: scannedPdfBase64,
  reader: 'langchain_pdfplumber' // Better OCR
});

// For PowerPoint files
await client.collections.insert({
  collection_id: collection.id,
  file_base64: pptxBase64,
  reader: 'markitdown' // Good for presentations
});

// 4. Handle large files with error checking
try {
  const result = await client.collections.insert({
    collection_id: collection.id,
    file_base64: largeFileBase64,
    label: 'large-document.pdf'
  });
  
  if (result.status === 'success') {
    console.log('File uploaded successfully');
  }
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('File validation failed:', error.message);
  } else if (error instanceof ServerError) {
    console.error('Server error during upload:', error.message);
  }
}
```

## Requirements

- Node.js 18.0.0 or higher
- TypeScript 5.3.0 or higher (for TypeScript projects)

## License

MIT License - see LICENSE file for details.

## Documentation

Comprehensive documentation is available:

- **API Documentation**: https://docs.mielto.com
- **GitHub Repository**: https://github.com/mieltoinc/mielto

## Support

- Documentation: https://docs.mielto.com
- Issues: https://github.com/mieltoinc/mielto/issues
- Email: hi@mielto.com

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
