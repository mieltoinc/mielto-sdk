/**
 * Mielto Tools - Export all tool implementations
 * 
 * This module exports tools for both AI SDK and OpenAI function calling.
 * 
 * @example Using MieltoTools Class (Recommended)
 * ```typescript
 * import { MieltoTools } from 'mielto/tools'
 * 
 * // For AI SDK
 * const tools = new MieltoTools(apiKey, { userId: "user_123" }, { provider: 'ai-sdk' })
 * const aiSdkTools = tools.getAISDKTools()
 * 
 * // For OpenAI
 * const openaiTools = new MieltoTools(apiKey, { userId: "user_123" }, { provider: 'openai' })
 * const functions = openaiTools.getOpenAIFunctions()
 * const executors = openaiTools.getExecutors()
 * ```
 * 
 * @example AI SDK Usage (Legacy Function)
 * ```typescript
 * import { MieltoTools } from 'mielto/tools'
 * import { generateText } from 'ai'
 * 
 * const tools = MieltoTools(apiKey, { userId: "user_123" }, 'both')
 * 
 * const { text } = await generateText({
 *   model: openai('gpt-4'),
 *   messages: [{ role: 'user', content: 'What did I say about Python?' }],
 *   tools,
 * })
 * ```
 * 
 * @example OpenAI Function Calling Usage (Legacy Function)
 * ```typescript
 * import { getMieltoOpenAIFunctions, createMieltoOpenAIExecutors } from 'mielto/tools'
 * import OpenAI from 'openai'
 * 
 * const functions = getMieltoOpenAIFunctions('both')
 * const executors = createMieltoOpenAIExecutors(apiKey, { userId: "user_123" }, 'both')
 * 
 * const completion = await openai.chat.completions.create({
 *   model: "gpt-4",
 *   messages: [{ role: "user", content: "What did I say about Python?" }],
 *   tools: functions.map(fn => ({ type: "function" as const, function: fn })),
 * })
 * 
 * // Handle tool calls with executors
 * if (completion.choices[0].message.tool_calls) {
 *   for (const toolCall of completion.choices[0].message.tool_calls) {
 *     const result = await executors[toolCall.function.name](
 *       JSON.parse(toolCall.function.arguments)
 *     )
 *   }
 * }
 * ```
 */

// Export shared types and utilities
export {
	MieltoToolsConfig,
	ToolType,
	createMieltoClient,
} from "./base"

// Export the main MieltoTools class
export { MieltoTools, type MieltoToolsProvider } from "./mielto-tools"

// Export AI SDK tools (legacy function-based API)
// Note: The function is exported as MieltoToolsFunction to avoid conflict with the class
export {	
	getAISDKTools,
	addMemoryTool as addMemoryToolAISDK,
	listMemoriesTool as listMemoriesToolAISDK,
	searchCollectionTool as searchCollectionToolAISDK,
	insertToCollectionTool as insertToCollectionToolAISDK,
	listCollectionsTool as listCollectionsToolAISDK,
	searchAvailableToolsTool as searchAvailableToolsToolAISDK,
} from "./provider/ai-sdk"

// Export OpenAI tools (legacy function-based API)
export { getOpenAITools, getOpenAIFunctions, getExecutors } from "./provider/openai"
