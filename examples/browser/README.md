# Browser-Based Test Application

This is an interactive browser-based test application for the Mielto TypeScript SDK. It provides a user-friendly interface with forms to test all SDK features.

## Features

- **Chat Completions**: Test chat API with streaming and non-streaming responses
- **Memories**: Create and search memories
- **Collections**: Create collections, insert content/files, and search
- **Compress**: Test text compression

## Setup

### Option 1: Using Vite (Recommended)

1. Install dependencies:
```bash
cd libs/mielto_typescript
npm install
```

2. Install Vite (if not already installed):
```bash
npm install -D vite
```

3. Build the SDK:
```bash
npm run build
```

4. Start the development server:
```bash
npm run example:browser
# or
npx vite examples/browser
```

5. Open your browser to `http://localhost:5173` (should open automatically)

### Option 2: Using a Simple HTTP Server

1. Build the SDK:
```bash
npm run build
```

2. Build the browser example:
```bash
npx tsc examples/browser/app.ts --outDir examples/browser --module esnext --target es2020 --moduleResolution bundler
```

3. Serve the files using any static file server:
```bash
# Using Python
cd examples/browser
python3 -m http.server 8000

# Using Node.js http-server
npx http-server examples/browser -p 8000

# Using PHP
cd examples/browser
php -S localhost:8000
```

4. Open your browser to `http://localhost:8000`

### Option 3: Using a Bundler (Webpack, Rollup, etc.)

You can also bundle the application using your preferred bundler. Make sure to:
- Configure the bundler to handle TypeScript
- Set up proper module resolution for the SDK
- Include the SDK's dependencies (axios)

## Usage

1. Enter your Mielto API key in the input field at the top
2. Select a tab to test different features:
   - **Chat**: Send messages and get AI responses
   - **Memories**: Create and search memories
   - **Collections**: Manage document collections
   - **Compress**: Compress text content

3. Fill out the forms and click the submit buttons
4. View responses in the response section below each form

## Browser Compatibility

This application works in modern browsers that support:
- ES6+ JavaScript
- Fetch API (or axios will use XMLHttpRequest as fallback)
- File API (for file uploads)
- Async/await

Tested browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes

- Your API key is stored only in browser memory and never sent to any server except Mielto's API
- File uploads use the browser's File API and convert files to base64
- Streaming responses are supported for chat completions
- All responses are displayed as formatted JSON

## Troubleshooting

**CORS Errors**: If you encounter CORS errors, make sure:
- Your API key is valid
- The Mielto API allows requests from your origin
- You're using the correct API endpoint

**Module Not Found**: If you see module errors:
- Make sure the SDK is built (`npm run build`)
- Check that the import paths in `app.ts` are correct
- Verify your bundler/server is configured correctly

**File Upload Issues**: 
- Make sure you're using a modern browser with File API support
- Check browser console for specific error messages

