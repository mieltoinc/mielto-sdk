/**
 * Example: Using Mielto Tools with OpenAI Function Calling
 * 
 * This example shows how to use Mielto tools with OpenAI's native
 * function calling API using the MieltoTools class.
 * 
 * Run with: npm run example:tools-openai
 */

import OpenAI from "openai"
import { MieltoTools } from "../src/tools"

async function main() {
	const mieltoApiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (mieltoApiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		process.exit(1)
	}

	const openai = new OpenAI({
		apiKey: openaiApiKey,
	})

	// Configure Mielto tools
	const config = {
		apiKey: mieltoApiKey,
		userId: "user_123", // Default user ID for memory operations
		collectionId: "coll_456", // Default collection ID for collection operations
	}

	// Create MieltoTools instance for OpenAI
	const toolsInstance = new MieltoTools(config, {
		toolTypes: "both",
	})

	// Get OpenAI functions (executors are retrieved inside chatWithTools)
	const functions = toolsInstance.getOpenAIFunctions()

	console.log("Available functions:", functions.map((f) => f.name))

	// Example 1: Search memories
	console.log("\n=== Example 1: Searching Memories ===")
	await chatWithTools(openai, toolsInstance, "What did I say about Python yesterday?")

	// Example 2: Add a memory
	console.log("\n=== Example 2: Adding a Memory ===")
	await chatWithTools(
		openai,
		toolsInstance,
		"Remember that I prefer TypeScript over JavaScript for new projects"
	)

	// Example 3: Search collections
	console.log("\n=== Example 3: Searching Collections ===")
	await chatWithTools(
		openai,
		toolsInstance,
		"What information do we have about machine learning?"
	)

	// Example 4: Using only memory tools
	console.log("\n=== Example 4: Memory Tools Only ===")
	const memoryToolsInstance = new MieltoTools(
		{ apiKey: mieltoApiKey, userId: "user_123" },
		{ toolTypes: "memory" }
	)

	await chatWithTools(openai, memoryToolsInstance, "List my recent memories")
}

/**
 * Helper function to handle chat with tool calling
 */
async function chatWithTools(
	openai: OpenAI,
	toolsInstance: MieltoTools,
	userMessage: string
) {
	const functions = toolsInstance.getOpenAIFunctions()

	const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{ role: "user", content: userMessage },
	]

	while (true) {
		const completion = await openai.chat.completions.create({
			model: "gpt-4",
			messages,
			tools: functions.map((fn) => ({
				type: "function" as const,
				function: fn,
			})),
			tool_choice: "auto",
		})

		const message = completion.choices[0].message
		messages.push(message)

		// If no tool calls, we're done
		if (!message.tool_calls || message.tool_calls.length === 0) {
			console.log("AI Response:", message.content)
			return message.content
		}

		// Execute all tool calls using the convenience method
		const toolResults = await toolsInstance.executeToolCalls(message.tool_calls)

		// Log tool calls for debugging
		if (message.tool_calls) {
			for (const toolCall of message.tool_calls) {
				if (toolCall.type === "function") {
					console.log(`\nCalling tool: ${toolCall.function.name}`)
					console.log("Arguments:", toolCall.function.arguments)
				}
			}
		}

		messages.push(...toolResults)
	}
}

// Run the example
main().catch(console.error)
