import type OpenAI from "openai"
import { MieltoTools } from "../mielto-tools"

/**
 * Get OpenAI function definitions for Mielto tools
 * 
 * @deprecated Use MieltoTools class instead: new MieltoTools(apiKey, config, { provider: 'openai' }).getOpenAIFunctions()
 */
export function getOpenAIFunctions(
	client: MieltoTools,
): OpenAI.FunctionDefinition[] {
	return client.getOpenAIFunctions()
}

/**
 * Create function executors for OpenAI function calling
 * 
 * @deprecated Use MieltoTools class instead: new MieltoTools(apiKey, config, { provider: 'openai' }).getExecutors()
 */
export function getExecutors(
	client: MieltoTools,
): Record<string, (args: any) => Promise<any>> {
	return client.getExecutors()
}

export function getOpenAITools(
	client: MieltoTools,
): Record<string, any> {
	return client.getOpenAITools()
}