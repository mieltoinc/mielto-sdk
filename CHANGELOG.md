# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-12-31

### Added
- **MieltoTools class** - Unified API for AI SDK and OpenAI function calling
- **AI SDK integration** - Direct integration with Vercel AI SDK (`ai` package)
- **OpenAI function calling** - Native OpenAI function definitions and executors
- **Memory tools** - `searchMemories`, `addMemory`, `listMemories` tools
- **Collection tools** - `searchCollection`, `insertToCollection`, `listCollections` tools
- **Utility tools** - `searchAvailableTools` for discovering available tools
- **Tool filtering** - Support for `memory`, `collection`, or `both` tool types
- **Type-safe schemas** - Full Zod schema support for all tools
- **Comprehensive examples** - Examples for AI SDK, OpenAI, streaming, and unified usage
- **Documentation** - Complete tools guide with usage examples

### Features
- 🔧 Unified `MieltoTools` class for both AI SDK and OpenAI
- 🧠 Memory tools for semantic search and management
- 📚 Collection tools for knowledge base operations
- 🔄 Streaming support with tools
- 📝 Type-safe tool definitions with Zod schemas
- 🎯 Flexible tool filtering (memory, collection, or both)
- 📖 Comprehensive documentation and examples

### Documentation
- Added Tools section to main README
- Created detailed tools usage guide (`src/tools/README.md`)
- Added tools examples to examples README
- Updated all examples to use new `MieltoTools` class API

## [1.0.0] - 2025-12-23

### Added
- Initial release of Mielto TypeScript SDK
- `MieltoCompressClient` class for text compression API
- Intelligent retry logic with exponential backoff
- Automatic timeout calculation based on content size
- Processing detection for large content
- Automatic user ID extraction from message content
- Webhook support for async processing
- Content validation and warnings
- TypeScript type definitions
- Comprehensive error handling
- Support for both string and message array content types

### Features
- 🔄 Intelligent retry logic for 503 and 429 errors
- ⏱️ Smart timeout calculation based on content size
- 🎯 Processing detection - waits for actual results
- 🆔 Auto user ID extraction from messages
- 📦 Zero configuration required
- 🔗 Webhook support for async processing
- 📊 Content validation and warnings

