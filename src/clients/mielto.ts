/** Main Mielto client class. */

import { BaseClient, BaseClientOptions } from './base.js';
import { Chat } from '../resources/chat.js';
import { Memories } from '../resources/memories.js';
import { Collections } from '../resources/collections.js';
import { Compress } from '../resources/compress.js';

export interface MieltoOptions {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export class Mielto {
  private _client: BaseClient;
  public memories: Memories;
  public collections: Collections;
  public compress: Compress;
  public chat: Chat;

  constructor(options: MieltoOptions | string) {
    // Handle both string (API key) and options object
    let opts: MieltoOptions;
    if (typeof options === 'string') {
      opts = { apiKey: options };
    } else {
      opts = options;
    }

    this._client = new BaseClient({
      apiKey: opts.apiKey,
      baseUrl: opts.baseUrl,
      timeout: opts.timeout,
      maxRetries: opts.maxRetries,
    });

    // Initialize resources
    this.memories = new Memories(this._client);
    this.collections = new Collections(this._client);
    this.compress = new Compress(this._client);
    this.chat = new Chat(this._client);
  }

  close(): void {
    this._client.close();
  }
}

