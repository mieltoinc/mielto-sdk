# Mielto Tools Usage Guide

This guide shows how to use Mielto tools with both AI SDK and OpenAI function calling.

## Installation

```bash
npm install mielto
# or
yarn add mielto
# or
pnpm add mielto
```

For AI SDK support, you'll also need:
```bash
npm install ai zod
```

For OpenAI support, you'll also need:
```bash
npm install openai zod
```

## Quick Start

### Using the MieltoTools Class (Recommended)

The `MieltoTools` class provides a unified interface for both AI SDK and OpenAI providers:

```typescript
import { MieltoTools } from 'mielto/tools'

// Create instance with configuration
const tools = new MieltoTools(
  {
    apiKey: "your-mielto-api-key",
    userId: "user_123",           // Optional: Default user ID for memory operations
    collectionId: "coll_456",      // Optional: Default collection ID for collection operations
    baseUrl: "https://api.mielto.com",  // Optional: Custom API base URL
    timeout: 30000,                // Optional: Request timeout in ms
    maxRetries: 3,                 // Optional: Maximum retry attempts
  },
  {
    toolTypes: "both"  // Optional: "memory" | "collection" | "both" (default: "both")
  }
)

// For AI SDK
const aiSdkTools = tools.getAISDKTools()

// For OpenAI
const functions = tools.getOpenAIFunctions()
const executors = tools.getExecutors()
```

## AI SDK Usage

The AI SDK implementation returns tools that can be used directly with Vercel AI SDK.

### Basic Setup

```typescript
import { MieltoTools } from 'mielto/tools'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

const tools = new MieltoTools(
  {
    apiKey: "your-mielto-api-key",
    userId: "user_123",
    collectionId: "coll_456"
  },
  { toolTypes: "both" }
)

// Get AI SDK tools
const aiSdkTools = tools.getAISDKTools()
```

### Using with AI SDK

```typescript
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { MieltoTools } from 'mielto/tools'

const tools = new MieltoTools(
  { apiKey: "your-api-key", userId: "user_123" },
  { toolTypes: "both" }
)

const aiSdkTools = tools.getAISDKTools()

const { text } = await generateText({
  model: openai('gpt-4'),
  messages: [
    { role: 'user', content: 'What did I say about Python yesterday?' }
  ],
  tools: aiSdkTools,
})

console.log(text)
```

### Using with Streaming

```typescript
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { MieltoTools } from 'mielto/tools'

const tools = new MieltoTools(
  { apiKey: "your-api-key", userId: "user_123" },
  { toolTypes: "both" }
)

const aiSdkTools = tools.getAISDKTools()

const result = await streamText({
  model: openai('gpt-4'),
  messages: [
    { role: 'user', content: 'What did I say about Python? Also remember that I love TypeScript.' }
  ],
  tools: aiSdkTools,
})

for await (const chunk of result.textStream) {
  process.stdout.write(chunk)
}
```

### Tool Types

You can specify which tools to include:

```typescript
// Only memory tools
const memoryTools = new MieltoTools(
  { apiKey: "your-api-key", userId: "user_123" },
  { toolTypes: "memory" }
)
const memoryAISDKTools = memoryTools.getAISDKTools()

// Only collection tools
const collectionTools = new MieltoTools(
  { apiKey: "your-api-key", collectionId: "coll_456" },
  { toolTypes: "collection" }
)
const collectionAISDKTools = collectionTools.getAISDKTools()

// Both (default)
const allTools = new MieltoTools(
  { apiKey: "your-api-key", userId: "user_123", collectionId: "coll_456" },
  { toolTypes: "both" }
)
const allAISDKTools = allTools.getAISDKTools()
```

## OpenAI Function Calling Usage

The OpenAI implementation provides function definitions and executors for OpenAI's function calling API.

### Basic Setup

```typescript
import { MieltoTools } from 'mielto/tools'
import OpenAI from 'openai'

const tools = new MieltoTools(
  {
    apiKey: "your-mielto-api-key",
    userId: "user_123",
    collectionId: "coll_456"
  },
  { toolTypes: "both" }
)

// Get function definitions
const functions = tools.getOpenAIFunctions()

// Get executors
const executors = tools.getExecutors()
```

### Using with OpenAI Client

```typescript
import OpenAI from 'openai'
import { MieltoTools } from 'mielto/tools'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const tools = new MieltoTools(
  { apiKey: "your-mielto-api-key", userId: "user_123" },
  { toolTypes: "both" }
)

const functions = tools.getOpenAIFunctions()
const executors = tools.getExecutors()

// Make a chat completion request
const completion = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { 
      role: "user", 
      content: "What did I say about Python yesterday?" 
    }
  ],
  tools: functions.map(fn => ({
    type: "function" as const,
    function: fn
  })),
  tool_choice: "auto"
})

// Handle tool calls
const message = completion.choices[0].message

if (message.tool_calls) {
  for (const toolCall of message.tool_calls) {
    const functionName = toolCall.function.name
    const args = JSON.parse(toolCall.function.arguments)
    
    // Execute the function
    const result = await executors[functionName](args)
    
    console.log(`Tool: ${functionName}`)
    console.log(`Result:`, result)
  }
}
```

### Complete Example with Tool Call Handling

```typescript
import OpenAI from 'openai'
import { MieltoTools } from 'mielto/tools'

async function chatWithMieltoTools(userMessage: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const tools = new MieltoTools(
    { apiKey: "your-mielto-api-key", userId: "user_123", collectionId: "coll_456" },
    { toolTypes: "both" }
  )

  const functions = tools.getOpenAIFunctions()
  const executors = tools.getExecutors()

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "user", content: userMessage }
  ]

  while (true) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages,
      tools: functions.map(fn => ({
        type: "function" as const,
        function: fn
      })),
      tool_choice: "auto"
    })

    const message = completion.choices[0].message
    messages.push(message)

    // If no tool calls, we're done
    if (!message.tool_calls || message.tool_calls.length === 0) {
      return message.content
    }

    // Execute all tool calls
    const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []
    
    for (const toolCall of message.tool_calls) {
      const functionName = toolCall.function.name
      const args = JSON.parse(toolCall.function.arguments)
      
      const result = await executors[functionName](args)
      
      toolResults.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      })
    }

    messages.push(...toolResults)
  }
}

// Usage
const response = await chatWithMieltoTools("What did I say about Python yesterday?")
console.log(response)
```

### Using with Streaming

```typescript
import OpenAI from 'openai'
import { MieltoTools } from 'mielto/tools'

async function streamChatWithTools(userMessage: string) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  const tools = new MieltoTools(
    { apiKey: "your-mielto-api-key", userId: "user_123" },
    { toolTypes: "memory" }
  )

  const functions = tools.getOpenAIFunctions()
  const executors = tools.getExecutors()

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: userMessage }],
    tools: functions.map(fn => ({
      type: "function" as const,
      function: fn
    })),
    stream: true
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta
    
    if (delta?.content) {
      process.stdout.write(delta.content)
    }
    
    if (delta?.tool_calls) {
      // Handle tool calls in streaming mode
      for (const toolCall of delta.tool_calls) {
        if (toolCall.function?.name && toolCall.function?.arguments) {
          const functionName = toolCall.function.name
          const args = JSON.parse(toolCall.function.arguments)
          const result = await executors[functionName](args)
          console.log(`\n[Tool: ${functionName}]`, result)
        }
      }
    }
  }
}
```

## Available Tools

### Memory Tools

- **`searchMemories`** - Search for memories
  - `query` (required): Search query string
  - `userId` (optional): User ID (uses config default if not provided)
  - `limit` (optional): Max results (default: 10)
  - `retrievalMethod` (optional): Retrieval method to use

- **`addMemory`** - Add a new memory
  - `memory` (required): Memory content text
  - `userId` (optional): User ID (uses config default if not provided)
  - `memoryType` (optional): Type of memory (e.g., 'fact', 'preference', 'event')
  - `topics` (optional): Array of topic strings
  - `metadata` (optional): Additional metadata object

- **`listMemories`** - List all memories
  - `userId` (optional): User ID (uses config default if not provided)
  - `limit` (optional): Max results (default: 50)
  - `cursor` (optional): Pagination cursor
  - `sortBy` (optional): Sort field (default: 'updated_at')
  - `sortOrder` (optional): 'asc' or 'desc' (default: 'desc')

### Collection Tools

- **`searchCollection`** - Search within a collection
  - `query` (required): Search query string
  - `collectionId` (optional): Collection ID (uses config default if not provided)
  - `searchType` (optional): 'hybrid', 'vector', or 'keyword'
  - `k` (optional): Max results to return
  - `scoreThreshold` (optional): Minimum score threshold to filter results (0.0 to 1.0)
  - `filters` (optional): Additional filters object
  - `metadataFilters` (optional): Metadata filters object

- **`insertToCollection`** - Insert content into a collection
  - `collectionId` (optional): Collection ID (uses config default if not provided)
  - `content` (optional): Text content to insert
  - `urls` (optional): Array of URLs to insert
  - `label` (optional): Label for the content
  - `description` (optional): Description of the content
  - `metadata` (optional): Metadata object
  - `ingest` (optional): Whether to ingest for search (default: true)

- **`listCollections`** - List available collections
  - `skip` (optional): Number to skip (default: 0)
  - `limit` (optional): Max results (default: 100)
  - `status` (optional): Filter by status
  - `visibility` (optional): Filter by visibility
  - `search` (optional): Search term
  - `tags` (optional): Filter by tags (comma-separated)

### Utility Tools

- **`searchAvailableTools`** - Search for available tools
  - `searchTerm` (optional): Search term to filter tools

## Using an Existing Mielto Client

If you already have a `Mielto` client instance, you can pass it to the constructor:

```typescript
import { Mielto } from 'mielto'
import { MieltoTools } from 'mielto/tools'

const client = new Mielto({ apiKey: "your-api-key" })

const tools = new MieltoTools(
  { userId: "user_123" },  // Config without apiKey
  { toolTypes: "both" },
  client  // Pass existing client
)
```

## Error Handling

All tools return a consistent response format:

```typescript
{
  success: true,
  // ... result data
}

// or on error
{
  success: false,
  error: "Error message"
}
```

Example error handling:

```typescript
const result = await executors.searchMemories({ query: "test" })

if (result.success) {
  console.log("Memories:", result.memories)
} else {
  console.error("Error:", result.error)
}
```

## TypeScript Types

All types are exported for use in your code:

```typescript
import type { 
  MieltoToolsConfig, 
  ToolType 
} from 'mielto/tools'

const config: MieltoToolsConfig = {
  apiKey: "your-api-key",
  userId: "user_123",
  collectionId: "coll_456"
}

const toolType: ToolType = "both"
```

## Examples

See the `examples/` directory for complete working examples:

- `tools-ai-sdk.ts` - AI SDK integration examples
- `tools-openai.ts` - OpenAI function calling examples
- `tools-class.ts` - MieltoTools class usage examples
- `tools-complete.ts` - Comprehensive examples with streaming

Run examples with:
```bash
npm run example:tools-ai-sdk
npm run example:tools-openai
npm run example:tools-class
npm run example:tools-complete
```
