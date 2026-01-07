/** Compress resource for text compression via Mielto API. */

import { BaseClient } from '../clients/base';
import { CompressRequest, CompressResponse } from '../types/compress';

export class Compress {
  constructor(private client: BaseClient) {}

  async compress(request: CompressRequest): Promise<CompressResponse> {
    const payload: any = {
      content: request.content,
      strategy: request.strategy || 'ai_compress',
      include_metadata: request.include_metadata || false,
    };
    if (request.webhook_url) payload.webhook_url = request.webhook_url;

    return this.client.post<CompressResponse>('/compress', payload);
  }
}

