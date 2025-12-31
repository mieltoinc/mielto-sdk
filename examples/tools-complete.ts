/**
 * Complete Example: Using Mielto Tools with Streaming
 * 
 * This example demonstrates a complete workflow using Mielto tools
 * with streaming responses for OpenAI function calling using the MieltoTools class.
 * 
 * Run with: npm run example:tools-complete
 */

import OpenAI from "openai"
import { MieltoTools } from "../src/tools"

// Example: OpenAI with Streaming
async function exampleOpenAIStreaming() {
	console.log("=== OpenAI Streaming Example ===\n")

	const mieltoApiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (mieltoApiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		return
	}

	const openaiClient = new OpenAI({ apiKey: openaiApiKey })

	// Create MieltoTools instance
	const toolsInstance = new MieltoTools(
		{ apiKey: mieltoApiKey, userId: "user_123" },
		{ toolTypes: "both" }
	)

	const functions = toolsInstance.getOpenAIFunctions()
	const executors = toolsInstance.getExecutors()

	const stream = await openaiClient.chat.completions.create({
		model: "gpt-4",
		messages: [
			{
				role: "user",
				content: "What did I say about Python? Also add a memory that I love TypeScript.",
			},
		],
		tools: functions.map((fn) => ({
			type: "function" as const,
			function: fn,
		})),
		stream: true,
	})

	console.log("Streaming response:")
	for await (const chunk of stream) {
		const delta = chunk.choices[0]?.delta

		if (delta?.content) {
			process.stdout.write(delta.content)
		}

		// Handle tool calls in streaming mode
		if (delta?.tool_calls) {
			for (const toolCall of delta.tool_calls) {
				if (toolCall.type === "function" && toolCall.function?.name && toolCall.function?.arguments) {
					try {
						const functionName = toolCall.function.name
						const args = JSON.parse(toolCall.function.arguments)
						const result = await executors[functionName](args)
						console.log(`\n[Tool: ${functionName}]`, result)
					} catch (error) {
						console.error("Error executing tool:", error)
					}
				}
			}
		}
	}
	console.log("\n")
}

// Example: Non-streaming chat with tools
async function exampleChatWithTools() {
	console.log("=== Chat with Tools Example ===\n")

	const mieltoApiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (mieltoApiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		return
	}

	const openaiClient = new OpenAI({ apiKey: openaiApiKey })

	// Create MieltoTools instance for memory tools only
	const toolsInstance = new MieltoTools(
		{ apiKey: mieltoApiKey, userId: "user_123" },
		{ toolTypes: "memory" }
	)

	const functions = toolsInstance.getOpenAIFunctions()
	const executors = toolsInstance.getExecutors()

	const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{ role: "user", content: "What did I say about Python?" },
	]

	while (true) {
		const completion = await openaiClient.chat.completions.create({
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

		// Execute all tool calls
		const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = []

		for (const toolCall of message.tool_calls) {
			if (toolCall.type !== "function") continue

			const functionName = toolCall.function.name
			const args = JSON.parse(toolCall.function.arguments)

			console.log(`\nCalling tool: ${functionName}`)
			console.log("Arguments:", args)

			const result = await executors[functionName](args)

			console.log("Tool result:", result)

			toolResults.push({
				role: "tool",
				tool_call_id: toolCall.id,
				content: JSON.stringify(result),
			})
		}

		messages.push(...toolResults)
	}
}

// Example: Switching between providers
async function exampleProviderSwitching() {
	console.log("=== Provider Switching Example ===\n")

	const mieltoApiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (mieltoApiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		return
	}

	const config = { apiKey: mieltoApiKey, userId: "user_123" }

	// Same configuration, different providers
	const aiSdkTools = new MieltoTools(config, { toolTypes: "memory" })
	const openaiTools = new MieltoTools(config, { toolTypes: "memory" })

	console.log("AI SDK tools:", aiSdkTools.getToolNames())
	console.log("OpenAI functions:", openaiTools.getOpenAIFunctions().map((f) => f.name))
	console.log("\nBoth instances share the same configuration and executors!")
}

// Main function
async function main() {
	try {
		// Uncomment the example you want to run:
		// await exampleOpenAIStreaming()
		// await exampleChatWithTools()
		// await exampleProviderSwitching()

		console.log("Uncomment an example in main() to run it")
		console.log("Make sure to set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
	} catch (error) {
		console.error("Error running example:", error)
	}
}

// Run the example
main().catch(console.error)
