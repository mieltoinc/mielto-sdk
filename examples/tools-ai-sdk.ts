/**
 * Example: Using Mielto Tools with AI SDK (Vercel AI SDK)
 * 
 * This example shows how to use Mielto tools with the AI SDK for
 * building AI applications with memory and collection capabilities.
 * 
 * Prerequisites:
 * - Set MIELTO_API_KEY and OPENAI_API_KEY environment variables
 * 
 * Run with: npm run example:tools-ai-sdk
 */

import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { MieltoTools } from "../src/tools"

async function main() {
	const apiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (apiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		console.error("The OPENAI_API_KEY will be used automatically by @ai-sdk/openai")
		process.exit(1)
	}

	// Configure Mielto tools
	const config = {
		apiKey,
		userId: "user_123", // Default user ID for memory operations
		collectionId: "coll_456", // Default collection ID for collection operations
	}

	// Create MieltoTools instance for AI SDK
	const toolsInstance = new MieltoTools(config, {
		toolTypes: "both",
	})

	// Get AI SDK tools
	const tools = toolsInstance.getAISDKTools()

	console.log("Available tools:", toolsInstance.getToolNames())

	// Create model instance
	const model = openai("gpt-4")

	// Example 1: Search memories
	console.log("\n=== Example 1: Searching Memories ===")
	const { text: searchResult } = await generateText({
		model,
		messages: [
			{
				role: "user",
				content: "What did I say about Python yesterday?",
			},
		],
		tools,
	})

	console.log("AI Response:", searchResult)

	// Example 2: Add a memory
	console.log("\n=== Example 2: Adding a Memory ===")
	const { text: addMemoryResult } = await generateText({
		model,
		messages: [
			{
				role: "user",
				content: "Remember that I prefer TypeScript over JavaScript for new projects",
			},
		],
		tools,
	})

	console.log("AI Response:", addMemoryResult)

	// Example 3: Search collections
	console.log("\n=== Example 3: Searching Collections ===")
	const { text: searchCollectionResult } = await generateText({
		model,
		messages: [
			{
				role: "user",
				content: "What information do we have about machine learning?",
			},
		],
		tools,
	})

	console.log("AI Response:", searchCollectionResult)

	// Example 4: Using only memory tools
	console.log("\n=== Example 4: Memory Tools Only ===")
	const memoryToolsInstance = new MieltoTools(
		{ apiKey, userId: "user_123" },
		{ toolTypes: "memory" }
	)
	const memoryTools = memoryToolsInstance.getAISDKTools()

	const { text: memoryOnlyResult } = await generateText({
		model,
		messages: [
			{
				role: "user",
				content: "List my recent memories",
			},
		],
		tools: memoryTools,
	})

	console.log("AI Response:", memoryOnlyResult)

	// Example 5: Streaming with tools
	console.log("\n=== Example 5: Streaming with Tools ===")
	const result = await streamText({
		model,
		messages: [
			{
				role: "user",
				content: "What did I say about Python? Also add a memory that I love TypeScript.",
			},
		],
		tools,
	})

	console.log("Streaming response:")
	for await (const chunk of result.textStream) {
		process.stdout.write(chunk)
	}
	console.log("\n")

	// Example 6: Using individual tools (legacy API)
	console.log("\n=== Example 6: Individual Tool Usage (Legacy API) ===")
	const {
		listMemoriesToolAISDK,
		addMemoryToolAISDK,
		searchCollectionToolAISDK,
	} = await import("../src/tools")

	// Create individual tools using legacy API
	const legacyToolsInstance = new MieltoTools(
		{ apiKey, userId: "user_123", collectionId: "coll_456" },
		{ toolTypes: "both" }
	)
	const searchMemories = listMemoriesToolAISDK(legacyToolsInstance)
	const addMemory = addMemoryToolAISDK(legacyToolsInstance)
	const searchCollection = searchCollectionToolAISDK(legacyToolsInstance)

	// Use them individually
	const individualTools = {
		searchMemories,
		addMemory,
		searchCollection,
	}

	const { text: individualResult } = await generateText({
		model,
		messages: [
			{
				role: "user",
				content: "Search for memories about Python and add a new memory about TypeScript",
			},
		],
		tools: individualTools,
	})

	console.log("AI Response:", individualResult)
}

// Run the example
main().catch(console.error)
