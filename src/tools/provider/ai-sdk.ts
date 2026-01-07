
import { MieltoTools } from "../mielto-tools"

/**
 * Create Mielto tools for AI SDK
 * @deprecated Use MieltoTools class instead: new MieltoTools(apiKey, config, { provider: 'ai-sdk' }).getAISDKTools()
 */
export function getAISDKTools(
	client: MieltoTools,
): Record<string, any> {
	return client.getAISDKTools()
}
export const addMemoryTool = (
	client: MieltoTools,
) => {
	return client.getAISDKTools().addMemory
}

export const listMemoriesTool = (
	client: MieltoTools,
) => {
	return client.getAISDKTools().listMemories
}

export const searchCollectionTool = (
	client: MieltoTools,
) => {
	return client.getAISDKTools().searchCollection
}

export const insertToCollectionTool = (
	client: MieltoTools,
) => {
	return client.getAISDKTools().insertToCollection
}

export const listCollectionsTool = (
	client: MieltoTools,
) => {
	return client.getAISDKTools().listCollections
}

export const searchAvailableToolsTool = (
	client: MieltoTools,
) => {
	return client.getAISDKTools().searchAvailableTools
}
