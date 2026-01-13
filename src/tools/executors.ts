import { Mielto } from "../clients/mielto"
import { MieltoToolsConfig } from "./base"
import { SearchType } from "../types/collection"
import { getToolDefinitions } from "./definitions"

/**
 * Create executors for all Mielto tools
 */
export function createExecutors(
	client: Mielto,
	config?: MieltoToolsConfig,
	toolTypes: "memory" | "collection" | "both" = "both"
): Record<string, (args: any) => Promise<any>> {
	const definitions = getToolDefinitions(toolTypes)
	const executors: Record<string, (args: any) => Promise<any>> = {}

	if (toolTypes === "memory" || toolTypes === "both") {
		executors.searchMemories = async (args: {
			query: string
			userId?: string
			limit?: number
			retrievalMethod?: string
		}) => {
			try {
				const response = await client.memories.search({
					query: args.query,
					user_id: args.userId || config?.userId,
					limit: args.limit || 10,
					retrieval_method: args.retrievalMethod,
				})

				return {
					success: true,
					memories: response.memories,
					totalResults: response.total_results,
					query: response.query,
					retrievalMethod: response.retrieval_method,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}

		executors.addMemory = async (args: {
			memory: string
			userId?: string
			memoryType?: string
			topics?: string[]
			metadata?: Record<string, any>
		}) => {
			try {
				if (!args.userId && !config?.userId) {
					return {
						success: false,
						error: "userId is required. Provide it in the request or in the config.",
					}
				}

				const response = await client.memories.create({
					user_id: args.userId || config?.userId!,
					memory: args.memory,
					memory_type: args.memoryType,
					topics: args.topics,
					metadata: args.metadata,
				})

				return {
					success: true,
					memory: response,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}

		executors.listMemories = async (args: {
			userId?: string
			limit?: number
			cursor?: string
			sortBy?: string
			sortOrder?: "asc" | "desc"
		}) => {
			try {
				const response = await client.memories.list({
					user_id: args.userId || config?.userId,
					limit: args.limit || 50,
					cursor: args.cursor,
					sort_by: args.sortBy || "updated_at",
					sort_order: args.sortOrder || "desc",
				})

				return {
					success: true,
					memories: response.data,
					totalCount: response.total_count,
					hasMore: response.has_more,
					nextCursor: response.next_cursor,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}
	}

	if (toolTypes === "collection" || toolTypes === "both") {
		executors.searchCollection = async (args: {
			query: string
			collectionId?: string
			searchType?: SearchType
			k?: number
			scoreThreshold?: number
			filters?: Record<string, any>
			metadataFilters?: Record<string, any>
		}) => {
			try {
				const targetCollectionId = args.collectionId || config?.collectionId
				if (!targetCollectionId) {
					return {
						success: false,
						error: "collectionId is required. Provide it in the request or in the config.",
					}
				}

				const response = await client.collections.search({
					query: args.query,
					collection_id: targetCollectionId,
					search_type: args.searchType,
					k: args.k,
					score_threshold: args.scoreThreshold,
					filters: args.filters,
					metadata_filters: args.metadataFilters,
				})

				return {
					success: true,
					results: response.results,
					totalResults: response.total_results,
					query: response.query,
					searchType: response.search_type,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}

		executors.insertToCollection = async (args: {
			collectionId?: string
			content?: string
			urls?: string[]
			label?: string
			description?: string
			metadata?: Record<string, any>
			ingest?: boolean
		}) => {
			try {
				const targetCollectionId = args.collectionId || config?.collectionId
				if (!targetCollectionId) {
					return {
						success: false,
						error: "collectionId is required. Provide it in the request or in the config.",
					}
				}

				if (!args.content && !args.urls) {
					return {
						success: false,
						error: "Either content or urls must be provided.",
					}
				}

				const response = await client.collections.insert({
					collection_id: targetCollectionId,
					content: args.content,
					urls: args.urls,
					label: args.label,
					description: args.description,
					metadata: args.metadata,
					ingest: args.ingest !== false,
				})

				return {
					success: true,
					response,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}

		executors.listCollections = async (args: {
			skip?: number
			limit?: number
			status?: string
			visibility?: string
			search?: string
			tags?: string
		}) => {
			try {
				const response = await client.collections.list({
					skip: args.skip || 0,
					limit: args.limit || 100,
					status: args.status,
					visibility: args.visibility,
					search: args.search,
					tags: args.tags,
				})

				return {
					success: true,
					collections: response.data,
					total: response.total_count,
				}
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				}
			}
		}
	}

	// Always include searchAvailableTools
	executors.searchAvailableTools = async (args: { searchTerm?: string }) => {
		try {
			const availableTools = definitions
				.filter(d => d.name !== "searchAvailableTools")
				.map((definition) => ({
					name: definition.name,
					description: definition.description,
				}))

			let filteredTools = availableTools
			if (args.searchTerm) {
				const lowerSearchTerm = args.searchTerm.toLowerCase()
				filteredTools = availableTools.filter(
					(t) =>
						t.name.toLowerCase().includes(lowerSearchTerm) ||
						t.description.toLowerCase().includes(lowerSearchTerm)
				)
			}

			return {
				success: true,
				tools: filteredTools,
				total: filteredTools.length,
				allTools: availableTools.map((t) => t.name),
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			}
		}
	}

	return executors
}

