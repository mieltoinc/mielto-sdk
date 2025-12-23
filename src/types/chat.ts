/** Chat completion types for Mielto API. */

export type ChatRole = 'system' | 'user' | 'assistant' | 'tool' | 'function';

export interface ChatMessage {
  role: ChatRole;
  content?: string | Array<Record<string, any>>;
  name?: string;
  tool_calls?: Array<Record<string, any>>;
  tool_call_id?: string;
  function_call?: Record<string, any>;
}

export interface ChatDelta {
  role?: ChatRole;
  content?: string | Array<Record<string, any>>;
  name?: string;
  tool_calls?: Array<Record<string, any>>;
  tool_call_id?: string;
  function_call?: Record<string, any>;
}

export interface FunctionDefinition {
  name: string;
  description?: string;
  parameters: Record<string, any>;
}

export interface ToolDefinition {
  type: 'function';
  function: FunctionDefinition;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason?: string | null;
  logprobs?: Record<string, any> | null;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatCompletion {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatDelta;
  finish_reason?: string | null;
  logprobs?: Record<string, any> | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: Array<ChatMessage | Record<string, any>>;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
  tools?: Array<ToolDefinition | Record<string, any>>;
  tool_choice?: string | Record<string, any>;
  response_format?: Record<string, any>;
  seed?: number;
  logprobs?: boolean;
  top_logprobs?: number;
  // Mielto-specific fields
  user_id?: string;
  conversation_id?: string;
  session_id?: string;
  workspace_id?: string;
  collection_ids?: string[];
}

