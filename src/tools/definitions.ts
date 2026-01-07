import { z } from "zod"
import type OpenAI from "openai"
import { SearchType } from "../types/collection"

/**
 * Tool definition interface
 */
export interface ToolDefinition {
	name: string
	description: string
	zodSchema: z.ZodObject<any>
	required: string[]
}

/**
 * Process a Zod type and return JSON Schema property
 */
function processZodType(zodType: z.ZodTypeAny): any {
	if (zodType instanceof z.ZodString) {
		return {
			type: "string",
			description: zodType.description || "",
		}
	} else if (zodType instanceof z.ZodNumber) {
		return {
			type: "number",
			description: zodType.description || "",
		}
	} else if (zodType instanceof z.ZodBoolean) {
		return {
			type: "boolean",
			description: zodType.description || "",
		}
	} else if (zodType instanceof z.ZodArray) {
		return {
			type: "array",
			items: { type: "string" }, // Default to string array, can be enhanced
			description: zodType.description || "",
		}
	} else if (zodType instanceof z.ZodObject) {
		return {
			type: "object",
			description: zodType.description || "",
			additionalProperties: true,
		}
	} else if (zodType instanceof z.ZodRecord) {
		return {
			type: "object",
			description: zodType.description || "",
			additionalProperties: true,
		}
	} else if (zodType instanceof z.ZodEnum) {
		// Extract enum values - handle both array and object formats
		const enumDef = zodType._def as any
		const enumValues = enumDef.values
		return {
			type: "string",
			enum: Array.isArray(enumValues) ? enumValues : Object.values(enumValues),
			description: zodType.description || "",
		}
	} else if (zodType instanceof z.ZodOptional) {
		// Handle optional - unwrap and process inner type
		return processZodType(zodType._def.innerType as z.ZodTypeAny)
	} else if (zodType instanceof z.ZodDefault) {
		// Handle default - unwrap and process inner type
		const result = processZodType(zodType._def.innerType as z.ZodTypeAny)
		const defaultValue = (zodType._def as any).defaultValue?.()
		if (defaultValue !== undefined) {
			result.default = defaultValue
		}
		return result
	} else {
		// Fallback for unknown types
		return {
			type: "object",
			description: zodType.description || "",
			additionalProperties: true,
		}
	}
}

/**
 * Convert Zod schema to OpenAI JSON Schema
 */
function zodToJsonSchema(
	zodSchema: z.ZodObject<any>,
	required: string[]
): OpenAI.FunctionDefinition["parameters"] {
	const shape = zodSchema.shape
	const properties: Record<string, any> = {}

	for (const [key, schema] of Object.entries(shape)) {
		const zodType = schema as z.ZodTypeAny
		properties[key] = processZodType(zodType)
	}

	return {
		type: "object",
		properties,
		required,
	}
}

/**
 * Create OpenAI function definition from tool definition
 */
export function createOpenAIFunction(
	definition: ToolDefinition
): OpenAI.FunctionDefinition {
	return {
		name: definition.name,
		description: definition.description,
		parameters: zodToJsonSchema(definition.zodSchema, definition.required),
	}
}

// Memory Tools Definitions

export const searchMemoriesDefinition: ToolDefinition = {
	name: "searchMemories",
	description:
		"Search (recall) memories/details/information about the user or other facts or entities. Run when explicitly asked or when context about user's past choices would be helpful.",
	zodSchema: z.object({
		query: z
			.string()
			.describe("Search query to find relevant memories"),
		userId: z
			.string()
			.optional()
			.describe("User ID to search memories for. If not provided, uses the configured userId."),
		limit: z
			.number()
			.optional()
			.default(10)
			.describe("Maximum number of results to return"),
		retrievalMethod: z
			.string()
			.optional()
			.describe("Retrieval method to use for search"),
	}),
	required: ["query"],
}

export const addMemoryDefinition: ToolDefinition = {
	name: "addMemory",
	description:
		"Add (remember) memories/details/information about the user or other facts or entities. Run when explicitly asked or when the user mentions any information generalizable beyond the context of the current conversation.",
	zodSchema: z.object({
		memory: z
			.string()
			.describe(
				"The text content of the memory to add. This should be a single sentence or a short paragraph.",
			),
		userId: z
			.string()
			.optional()
			.describe("User ID for the memory. If not provided, uses the configured userId."),
		memoryType: z
			.string()
			.optional()
			.describe("Type of memory (e.g., 'fact', 'preference', 'event')"),
		topics: z
			.array(z.string())
			.optional()
			.describe("Topics associated with this memory"),
		metadata: z
			.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
			.optional()
			.describe("Additional metadata for the memory"),
	}),
	required: ["memory"],
}

export const listMemoriesDefinition: ToolDefinition = {
	name: "listMemories",
	description:
		"List memories for a user. Useful for getting an overview of stored memories.",
	zodSchema: z.object({
		userId: z
			.string()
			.optional()
			.describe("User ID to list memories for. If not provided, uses the configured userId."),
		limit: z
			.number()
			.optional()
			.default(50)
			.describe("Maximum number of memories to return"),
		cursor: z
			.string()
			.optional()
			.describe("Cursor for pagination"),
		sortBy: z
			.string()
			.optional()
			.default("updated_at")
			.describe("Field to sort by"),
		sortOrder: z
			.enum(["asc", "desc"])
			.optional()
			.default("desc")
			.describe("Sort order"),
	}),
	required: [],
}

// Collection Tools Definitions

export const searchCollectionDefinition: ToolDefinition = {
	name: "searchCollection",
	description:
		"Search within a collection for relevant content. Use this to find information stored in collections.",
	zodSchema: z.object({
		query: z
			.string()
			.describe("Search query to find relevant content"),
		collectionId: z
			.string()
			.optional()
			.describe("Collection ID to search in. If not provided, uses the configured collectionId."),
		searchType: z
			.nativeEnum(SearchType)
			.optional()
			.describe("Type of search: hybrid, vector, or keyword"),
		maxResults: z
			.number()
			.optional()
			.describe("Maximum number of results to return"),
		minScore: z
			.number()
			.optional()
			.describe("Minimum relevance score threshold"),
		filters: z
			.record(z.string(), z.any())
			.optional()
			.describe("Additional filters for the search"),
		metadataFilters: z
			.record(z.string(), z.any())
			.optional()
			.describe("Metadata filters for the search"),
	}),
	required: ["query"],
}

export const insertToCollectionDefinition: ToolDefinition = {
	name: "insertToCollection",
	description:
		"Insert content into a collection. Can insert text, files, or URLs.",
	zodSchema: z.object({
		collectionId: z
			.string()
			.optional()
			.describe("Collection ID to insert into. If not provided, uses the configured collectionId."),
		content: z
			.string()
			.optional()
			.describe("Text content to insert"),
		urls: z
			.array(z.string())
			.optional()
			.describe("URLs to insert and process"),
		label: z
			.string()
			.optional()
			.describe("Label for the content"),
		description: z
			.string()
			.optional()
			.describe("Description of the content"),
		metadata: z
			.record(z.string(), z.any())
			.optional()
			.describe("Metadata for the content"),
		ingest: z
			.boolean()
			.optional()
			.default(true)
			.describe("Whether to ingest the content for search"),
	}),
	required: [],
}

export const listCollectionsDefinition: ToolDefinition = {
	name: "listCollections",
	description:
		"List available collections. Useful for discovering what collections are available.",
	zodSchema: z.object({
		skip: z
			.number()
			.optional()
			.default(0)
			.describe("Number of collections to skip"),
		limit: z
			.number()
			.optional()
			.default(100)
			.describe("Maximum number of collections to return"),
		status: z
			.string()
			.optional()
			.describe("Filter by status"),
		visibility: z
			.string()
			.optional()
			.describe("Filter by visibility"),
		search: z
			.string()
			.optional()
			.describe("Search term to filter collections"),
		tags: z
			.string()
			.optional()
			.describe("Filter by tags (comma-separated)"),
	}),
	required: [],
}

// Utility Tools Definitions

export const searchAvailableToolsDefinition: ToolDefinition = {
	name: "searchAvailableTools",
	description:
		"Search for and list available Mielto tools. Use this to discover what tools are available and their capabilities.",
	zodSchema: z.object({
		searchTerm: z
			.string()
			.optional()
			.describe("Optional search term to filter tools by name or description"),
	}),
	required: [],
}

/**
 * Get all tool definitions by type
 */
export function getToolDefinitions(toolTypes: "memory" | "collection" | "both"): ToolDefinition[] {
	const definitions: ToolDefinition[] = []

	if (toolTypes === "memory" || toolTypes === "both") {
		definitions.push(
			searchMemoriesDefinition,
			addMemoryDefinition,
			listMemoriesDefinition
		)
	}

	if (toolTypes === "collection" || toolTypes === "both") {
		definitions.push(
			searchCollectionDefinition,
			insertToCollectionDefinition,
			listCollectionsDefinition
		)
	}

	// Always include searchAvailableTools
	definitions.push(searchAvailableToolsDefinition)

	return definitions
}

