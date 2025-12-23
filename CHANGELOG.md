# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

