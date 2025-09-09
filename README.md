# Mielto Compress SDK

A TypeScript SDK for the Mielto Text Compression API with intelligent retry logic, automatic timeout handling, and seamless user ID extraction.

## Features

- 🔄 **Intelligent Retry Logic** - Automatic retry with exponential backoff for 503 errors
- ⏱️ **Smart Timeouts** - Dynamic timeout calculation based on content size
- 🎯 **Processing Detection** - Waits for actual results instead of "processing" responses
- 🆔 **Auto User ID** - Automatically extracts user IDs from message content
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🔗 **Webhook Support** - Built-in support for async processing via webhooks
- 📊 **Content Validation** - Automatic validation and warnings for large content

## Installation

```bash
npm install @mielto/mielto-sdk
```

## Quick Start

### Simple Usage

```typescript
import { MieltoCompressClient } from '@mielto/mielto-sdk';

// Create client (uses production defaults)
const client = new MieltoCompressClient();

// Compress text
const result = await client.compress({
  content: "Your text content here..."
});

console.log(`Compressed from ${result.original_length} to ${result.compressed_length} characters`);
```

### With API Key

```typescript
// Pass API key directly
const client = new MieltoCompressClient('your-api-key');

// Or with options
const client = new MieltoCompressClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://custom-api.com'
});
```

## Configuration

### Default Settings

The SDK comes with production-ready defaults:

```typescript
{
  baseUrl: 'https://api.mielto.com',
  timeout: 120000,        // 2 minutes
  maxRetries: 10,         // For processing delays
  retryDelay: 10000       // 10 seconds initial delay
}
```

### Custom Configuration

```typescript
const client = new MieltoCompressClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.mielto.com',
  maxRetries: 5,
  retryDelay: 15000,
  onRetry: (attempt, error) => {
    console.log(`Retry ${attempt}: ${error.message}`);
  }
});
```

## Content Types

### Simple String

```typescript
const result = await client.compress({
  content: "Simple text to compress"
});
```

### Message Array

```typescript
const result = await client.compress({
  content: [
    {
      message: "Hello, how can I help?",
      role: "assistant",
      created_at: "2025-01-15T10:30:00Z"
    },
    {
      message: "I need help with my order",
      role: "user", 
      created_at: "2025-01-15T10:30:15Z",
      user_id: "user-123"  // Automatically extracted
    }
  ],
  include_metadata: true
});
```

### With Webhook (Recommended for Large Content)

```typescript
const result = await client.compress({
  content: largeMessageArray,
  webhook_url: "https://your-app.com/webhook/compression-result"
});
```

## User ID Handling

The SDK automatically extracts `user_id` from messages:

```typescript
const result = await client.compress({
  content: [
    {
      message: "Help with my account",
      role: "user",
      user_id: "user-456"  // ← Automatically extracted and included
    },
    {
      message: "I can help with that",
      role: "assistant"
    }
  ]
});

// Result includes the user_id
console.log(result.user_id); // "user-456"
```

## Processing & Retry Logic

### Automatic Processing Detection

For large content, the API may return "processing" responses. The SDK automatically:

1. Detects processing responses
2. Waits proportionally (1 minute per 10,000 characters)
3. Retries until actual results are ready

```typescript
// Large content - SDK handles processing automatically
const result = await client.compress({
  content: veryLargeConversation  // 100+ messages
});

// Returns actual compressed content, not just "processing"
console.log(result.content);  // Full compressed result
```

### Error Handling with Retries

The SDK automatically retries on:
- `503` Service Unavailable errors
- `429` Rate Limit errors  
- Network errors
- Processing responses

```typescript
try {
  const result = await client.compress({ content: "..." });
} catch (error) {
  if (error.message.includes('timeout')) {
    // Consider using webhook for very large content
  } else if (error.message.includes('too long')) {
    // Content exceeds API limits
  }
}
```

## Response Format

```typescript
interface CompressResponse {
  status: string;
  content?: string;           // Compressed text
  compression_time?: number;  // Processing time in seconds
  original_length?: number;   // Original character count
  compressed_length?: number; // Compressed character count
  message?: string;           // Status messages
  user_id?: string;          // Extracted user ID
}
```

## Content Size Guidelines

### Processing Times

- **Small (< 10K chars)**: ~1-50 seconds
- **Medium (10-50K chars)**: ~50-200 seconds  
- **Large (50K+ chars)**: Use webhooks for best experience

### Timeout Strategy

The SDK automatically calculates timeouts based on content size:

```typescript
// Timeout = base + (message_count * factor) + (length_factor * 1000)
// Capped at 2 minutes for synchronous requests
```

### Webhook Recommendations

Use webhooks for:
- 100+ messages
- 50K+ characters
- Production applications with large content

## Testing

Run the included test:

```bash
npm run test:sdk
```

The test demonstrates:
- Basic compression
- Large content handling
- Processing detection
- User ID extraction

## Examples

### Basic Compression

```typescript
import { MieltoCompressClient } from '@mielto/mielto-sdk';

const client = new MieltoCompressClient();

const result = await client.compress({
  content: "Long conversation text that needs compression..."
});

console.log(`✅ Compressed ${result.original_length} → ${result.compressed_length} chars`);
```

### Customer Support Conversation

```typescript
const supportConversation = [
  {
    message: "I'm having trouble with my order #12345",
    role: "user",
    user_id: "customer-789",
    created_at: "2025-01-15T10:30:00Z"
  },
  {
    message: "I'd be happy to help you with that order. Let me look it up.",
    role: "assistant", 
    created_at: "2025-01-15T10:30:30Z"
  }
  // ... more messages
];

const result = await client.compress({
  content: supportConversation,
  include_metadata: true
});

// User ID automatically extracted and included
console.log(result.user_id); // "customer-789"
```

### Production with Webhook

```typescript
const client = new MieltoCompressClient(process.env.MIELTO_API_KEY);

const result = await client.compress({
  content: largeConversationArray,
  include_metadata: true,
  webhook_url: "https://your-app.com/api/webhook/compression-complete"
});

// For webhook requests, you get immediate acknowledgment
console.log(result.message); // "Content is being processed..."
```

## Error Handling

### Common Error Types

```typescript
try {
  const result = await client.compress({ content: "..." });
} catch (error) {
  if (error.message.includes('API Error 400')) {
    // Bad request - check content format
  } else if (error.message.includes('timeout')) {
    // Content too large for sync processing
  } else if (error.message.includes('Service Unavailable')) {
    // API temporarily down (after retries)
  }
}
```

### Best Practices

1. **Use webhooks for large content** (100+ messages)
2. **Set appropriate timeouts** for your use case
3. **Handle processing responses** gracefully
4. **Monitor retry attempts** in production
5. **Validate content size** before sending

## API Reference

### Constructor Options

```typescript
interface CompressOptions {
  apiKey?: string;        // API authentication key
  baseUrl?: string;       // API endpoint (default: https://api.mielto.com)
  timeout?: number;       // Request timeout in ms (default: 120000)
  maxRetries?: number;    // Max retry attempts (default: 10)
  retryDelay?: number;    // Initial retry delay in ms (default: 10000)
  onRetry?: (attempt: number, error: any) => void; // Retry callback
}
```

### Request Format

```typescript
interface CompressRequest {
  content: string | MessageObject[];  // Content to compress
  include_metadata?: boolean;          // Include role/timestamp data
  webhook_url?: string;               // Async processing webhook
  user_id?: string;                   // Manual user ID override
}
```

## Troubleshooting

### Large Content Issues

**Problem**: Content too large for synchronous processing
**Solution**: Use webhook_url for async processing

```typescript
const result = await client.compress({
  content: largeContent,
  webhook_url: "https://your-app.com/webhook"
});
```

### Timeout Issues

**Problem**: Request timing out
**Solution**: Increase timeout or use webhooks

```typescript
const client = new MieltoCompressClient({
  timeout: 300000  // 5 minutes
});
```

### Processing Delays

**Problem**: Long wait times for results
**Solution**: SDK handles this automatically with proportional delays

The SDK waits ~1 minute per 15,000 characters for processing to complete.

## Support

- **Documentation**: [API Docs](https://docs.mielto.com)
- **Issues**: [GitHub Issues](https://github.com/mieltoinc/mielto-sdk)
- **Email**: support@mielto.com