import { Mielto, MieltoOptions } from "../clients/mielto"

/**
 * Mielto tools configuration
 */
export interface MieltoToolsConfig {

	/**
	 * Mielto API key
	 */
	apiKey: string
	/**
	 * User ID for memory operations
	 */
	userId?: string
	/**
	 * Collection ID for collection operations
	 */
	collectionId?: string
	/**
	 * Base URL for the Mielto API
	 */
	baseUrl?: string
	/**
	 * Timeout for API requests
	 */
	timeout?: number
	/**
	 * Maximum number of retries
	 */
	maxRetries?: number
}

/**
 * Tool types to include
 */
export type ToolType = "memory" | "collection" | "both"

/**
 * Create a Mielto client instance
 */
export function createMieltoClient(
	config: MieltoToolsConfig
): Mielto {
	const clientOptions: MieltoOptions = {
		apiKey: config.apiKey,
		baseUrl: config.baseUrl,
		timeout: config.timeout,
		maxRetries: config.maxRetries,
	}
	return new Mielto(clientOptions)
}

