# Mielto TypeScript SDK Examples

This directory contains comprehensive examples demonstrating how to use the Mielto TypeScript SDK.

## Examples

### Basic (`basic.ts`)
Shows how to initialize the Mielto client with different configuration options.

```bash
tsx examples/basic.ts
```

### Chat (`chat.ts`)
Demonstrates chat completions with:
- Non-streaming completions
- Streaming completions
- Function calling / tools

```bash
tsx examples/chat.ts
```

### Memories (`memories.ts`)
Shows memory management operations:
- Creating memories
- Searching memories
- Updating memories
- Creating memories from messages
- Getting memory chunks
- Listing and deleting memories

```bash
tsx examples/memories.ts
```

### Collections (`collections.ts`)
Demonstrates collection management:
- Creating collections
- Inserting text content
- Inserting files (base64 and file path)
- Inserting URLs
- Searching within collections
- Getting collection chunks
- Updating and deleting collections

```bash
tsx examples/collections.ts
```

### Compress (`compress.ts`)
Shows text compression features:
- Compressing text with metadata
- Compressing text without metadata
- Viewing compression statistics

```bash
tsx examples/compress.ts
```

### Complete (`complete.ts`)
A comprehensive example that demonstrates all features with error handling.

```bash
tsx examples/complete.ts
```

### Browser (`browser/`)
An interactive browser-based test application with forms for testing all SDK features.

```bash
# Install vite if needed
npm install -D vite

# Run the browser example
npm run example:browser
```

See `browser/README.md` for detailed setup instructions.

## Running Examples

All examples require an API key. Set it as an environment variable:

```bash
export MIELTO_API_KEY=your-api-key-here
```

Then run any example:

```bash
# Using tsx (recommended)
tsx examples/basic.ts

# Or using node (after building)
npm run build
node dist/examples/basic.js
```

## Prerequisites

- Node.js 18 or higher
- TypeScript 5.3 or higher
- An active Mielto API key

## Notes

- The `file_path` option in collections only works in Node.js environments
- For browser environments, use `file_base64` or the File API
- All examples include error handling to demonstrate best practices
- Make sure to set your API key before running examples

