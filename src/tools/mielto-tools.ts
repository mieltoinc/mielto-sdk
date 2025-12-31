import type OpenAI from "openai"
import {
	MieltoToolsConfig,
	ToolType,
	createMieltoClient,
} from "./base"
import { getToolDefinitions, createOpenAIFunction } from "./definitions"
import { createExecutors } from "./executors"
import { Mielto } from "../clients/mielto"

/**
 * Provider type for Mielto tools
 */
export enum MieltoToolsProvider {
	AI_SDK = "ai-sdk",
	OPENAI = "openai",
}

/**
 * MieltoTools class for managing Mielto tools across different providers
 */
export class MieltoTools {
	private client: ReturnType<typeof createMieltoClient>
	private toolTypes: ToolType
	private executors: Record<string, (args: any) => Promise<any>>
	private definitions: ReturnType<typeof getToolDefinitions>

	constructor(
		config?: MieltoToolsConfig,
		options?: {
			toolTypes?: ToolType
		},
		client?: Mielto ,
	) {
		this.toolTypes = options?.toolTypes || "both"

		if (client) {
			this.client = client
		} else if (config) {
			this.client = createMieltoClient(config)
		} else {
			throw new Error("config or client is required")
		}
		
		this.definitions = getToolDefinitions(this.toolTypes)
		this.executors = createExecutors(this.client, config, this.toolTypes)
	}

	/**
	 * Get tools for AI SDK
	 * @returns Record of AI SDK tools
	 */
	getAISDKTools(): Record<string, any> {

		// Dynamic import for optional 'ai' dependency
		let tool: typeof import("ai").tool
		try {
			tool = require("ai").tool
		} catch {
			throw new Error(
				"'ai' package is required for AI SDK tools. Please install it: npm install ai"
			)
		}

		const tools: Record<string, any> = {}

		for (const definition of this.definitions) {
			const executor = this.executors[definition.name]
			if (!executor) continue

			// Check if zodSchema is available (zod is installed)
			if (!definition.zodSchema) {
				throw new Error(
					`zod is required for AI SDK tools. Tool '${definition.name}' needs zod schema. Please install it: npm install zod`
				)
			}

			tools[definition.name] = tool({
				description: definition.description,
				inputSchema: definition.zodSchema,
				execute: async (args: any) => {
					return await executor(args)
				},
			})
		}

		return tools
	}

	/**
	 * Get OpenAI function definitions
	 * @returns Array of OpenAI function definitions
	 */
	getOpenAIFunctions(): OpenAI.FunctionDefinition[] {
		return this.definitions.map(createOpenAIFunction)
	}

	getOpenAITools(): Record<string, any> {
		const functions = this.getOpenAIFunctions()
		const tools = functions.map((fn)=>{
			return {
				type: "function",
				function: fn,
			}
		})
		return tools
	}

	/**
	 * Get executors for OpenAI function calling
	 * @returns Record of executor functions
	 */
	getExecutors(): Record<string, (args: any) => Promise<any>> {
		return this.executors
	}

	/**
	 * Get tools based on the configured provider
	 * - For 'ai-sdk': returns AI SDK tools
	 * - For 'openai': returns OpenAI functions and executors
	 */
	getTools(provider: MieltoToolsProvider):
		| Record<string, any>
		| {
				functions: OpenAI.FunctionDefinition[]
				executors: Record<string, (args: any) => Promise<any>>
		  } {
		if (provider === MieltoToolsProvider.AI_SDK) {
			return this.getAISDKTools()
		} else {
			return this.getOpenAITools()
		}
	}

	/**
	 * Get available tool names
	 */
	getToolNames(): string[] {
		return this.definitions.map((d) => d.name)
	}

	/**
	 * Get tool definitions
	 */
	getDefinitions() {
		return this.definitions
	}
}

