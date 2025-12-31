/**
 * Example: Using MieltoTools Class (Recommended)
 * 
 * This example shows how to use the MieltoTools class which supports
 * both AI SDK and OpenAI providers through a unified interface.
 * 
 * Run with: npm run example:tools-class
 */

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import OpenAI from "openai"
import { MieltoTools } from "../src/tools"

async function exampleAISDK() {
	console.log("=== AI SDK Example ===\n")

	const apiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (apiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		return
	}

	// Create MieltoTools instance for AI SDK
	const tools = new MieltoTools(
		{ apiKey, userId: "user_123" },
		{ toolTypes: "both" }
	)

	// Get AI SDK tools
	const aiSdkTools = tools.getAISDKTools()
	console.log("Available tools:", tools.getToolNames())

	// Use with AI SDK
	const { text } = await generateText({
		model: openai("gpt-4"),
		messages: [
			{
				role: "user",
				content: "What did I say about Python? Also remember that I love TypeScript.",
			},
		],
		tools: aiSdkTools,
	})

	console.log("AI Response:", text)
}

async function exampleOpenAI() {
	console.log("\n=== OpenAI Example ===\n")

	const apiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (apiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		return
	}

	const openaiClient = new OpenAI({ apiKey: openaiApiKey })

	// Create MieltoTools instance for OpenAI
	const tools = new MieltoTools(
		{ apiKey, userId: "user_123" },
		{ toolTypes: "both" }
	)

	// Get OpenAI functions
	const functions = tools.getOpenAIFunctions()

	console.log("Available functions:", functions.map((f) => f.name))

	// Use with OpenAI
	const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
		{ role: "user", content: "What did I say about Python? Also remember that I love TypeScript." },
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

		if (!message.tool_calls || message.tool_calls.length === 0) {
			console.log("AI Response:", message.content)
			break
		}

		// Execute tool calls using the convenience method
		const toolResults = await tools.executeToolCalls(message.tool_calls)

		// Log tool calls for debugging
		if (message.tool_calls) {
			for (const toolCall of message.tool_calls) {
				if (toolCall.type === "function") {
					console.log(`\nCalling tool: ${toolCall.function.name}`)
				}
			}
		}

		messages.push(...toolResults)
	}
}

async function exampleUnifiedAPI() {
	console.log("\n=== Unified API Example ===\n")

	const apiKey = process.env.MIELTO_API_KEY || "your-api-key"
	const openaiApiKey = process.env.OPENAI_API_KEY || "your-openai-key"

	if (apiKey === "your-api-key" || openaiApiKey === "your-openai-key") {
		console.error("Please set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
		return
	}

	// Example: Switch between providers easily
	const provider = (process.env.PROVIDER || "ai-sdk") as "ai-sdk" | "openai"

	const tools = new MieltoTools(
		{ apiKey, userId: "user_123" },
		{ toolTypes: "memory" }
	)

	if (provider === "ai-sdk") {
		// Use with AI SDK
		const aiSdkTools = tools.getAISDKTools()
		const { text } = await generateText({
			model: openai("gpt-4"),
			messages: [{ role: "user", content: "List my memories" }],
			tools: aiSdkTools,
		})
		console.log("AI SDK Response:", text)
	} else {
		// Use with OpenAI
		const openaiClient = new OpenAI({ apiKey: openaiApiKey })
		const functions = tools.getOpenAIFunctions()

		const completion = await openaiClient.chat.completions.create({
			model: "gpt-4",
			messages: [{ role: "user", content: "List my memories" }],
			tools: functions.map((fn) => ({
				type: "function" as const,
				function: fn,
			})),
		})

		const message = completion.choices[0].message
		if (message.tool_calls) {
			const toolResults = await tools.executeToolCalls(message.tool_calls)
			for (const result of toolResults) {
				const parsed = JSON.parse(result.content as string)
				console.log("OpenAI Tool Result:", parsed)
			}
		}
		console.log("OpenAI Response:", message.content)
	}
}

async function main() {
	try {
		// Uncomment the example you want to run:
		// await exampleAISDK()
		// await exampleOpenAI()
		// await exampleUnifiedAPI()

		console.log("Uncomment an example in main() to run it")
		console.log("Make sure to set MIELTO_API_KEY and OPENAI_API_KEY environment variables")
	} catch (error) {
		console.error("Error running example:", error)
	}
}

main().catch(console.error)

