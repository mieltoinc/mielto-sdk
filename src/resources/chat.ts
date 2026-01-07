/** Chat completion resources for Mielto API. */

import { BaseClient } from '../clients/base';
import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionRequest,
} from '../types/chat';
// @ts-ignore - axios types should be available from dependencies
import axios from 'axios';

export class Completions {
  constructor(private client: BaseClient) {}

  async create(
    request: ChatCompletionRequest
  ): Promise<ChatCompletion | AsyncIterable<ChatCompletionChunk>> {
    const payload: any = {
      model: request.model,
      messages: request.messages,
    };

    // Add optional parameters
    if (request.temperature !== undefined) payload.temperature = request.temperature;
    if (request.top_p !== undefined) payload.top_p = request.top_p;
    if (request.n !== undefined) payload.n = request.n;
    if (request.stream !== undefined) payload.stream = request.stream;
    if (request.stop !== undefined) payload.stop = request.stop;
    if (request.max_tokens !== undefined) payload.max_tokens = request.max_tokens;
    if (request.presence_penalty !== undefined) payload.presence_penalty = request.presence_penalty;
    if (request.frequency_penalty !== undefined) payload.frequency_penalty = request.frequency_penalty;
    if (request.logit_bias !== undefined) payload.logit_bias = request.logit_bias;
    if (request.user !== undefined) payload.user = request.user;
    if (request.tools !== undefined) payload.tools = request.tools;
    if (request.tool_choice !== undefined) payload.tool_choice = request.tool_choice;
    if (request.response_format !== undefined) payload.response_format = request.response_format;
    if (request.seed !== undefined) payload.seed = request.seed;
    if (request.logprobs !== undefined) payload.logprobs = request.logprobs;
    if (request.top_logprobs !== undefined) payload.top_logprobs = request.top_logprobs;

    // Add Mielto-specific parameters
    if (request.user_id !== undefined) payload.user_id = request.user_id;
    if (request.conversation_id !== undefined) payload.conversation_id = request.conversation_id;
    if (request.session_id !== undefined) payload.session_id = request.session_id;
    if (request.workspace_id !== undefined) payload.workspace_id = request.workspace_id;
    if (request.collection_ids !== undefined) payload.collection_ids = request.collection_ids;

    if (request.stream) {
      return this.createStream(payload);
    } else {
      const response = await this.client.post<ChatCompletion>('chat/completions', payload);
      return response;
    }
  }

  private async *createStream(payload: any): AsyncIterable<ChatCompletionChunk> {
    // Note: Streaming requires Node.js environment with axios stream support
    // For browser environments, consider using fetch API with ReadableStream
    const url = this.client['buildUrl']('chat/completions');
    const headers = this.client['getHeaders']();

    try {
      const response = await axios({
        method: 'POST',
        url,
        data: payload,
        headers,
        responseType: 'stream',
        timeout: (this.client as any).timeout,
      });

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              return;
            }
            try {
              const chunkData = JSON.parse(data);
              yield chunkData as ChatCompletionChunk;
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error: any) {
      if (axios.isAxiosError && axios.isAxiosError(error)) {
        (this.client as any).handleResponseError(error);
      }
      throw error;
    }
  }
}

export class Chat {
  public completions: Completions;

  constructor(client: BaseClient) {
    this.completions = new Completions(client);
  }
}

