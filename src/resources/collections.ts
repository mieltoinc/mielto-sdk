/** Collection resource for interacting with the Mielto Collections API. */

import { BaseClient } from '../clients/base.js';
import {
  Collection,
  CollectionCreate,
  CollectionUpdate,
  SearchRequest,
  SearchResponse,
  ChunksResponse,
  UploadRequest,
  UploadResponse,
  FileUpload,
} from '../types/collection.js';

export class Collections {
  constructor(private client: BaseClient) {}

  async create(collectionData: CollectionCreate | Record<string, any>): Promise<Collection> {
    const payload = collectionData;
    return this.client.post<Collection>('/collections', payload);
  }

  async get(collectionId: string): Promise<Collection> {
    return this.client.get<Collection>(`/collections/${collectionId}`);
  }

  async list(options: {
    skip?: number;
    limit?: number;
    status?: string;
    visibility?: string;
    search?: string;
    tags?: string;
  } = {}): Promise<{ data: Collection[]; total: number }> {
    const params: Record<string, any> = {
      skip: options.skip || 0,
      limit: options.limit || 100,
    };
    if (options.status) params.status = options.status;
    if (options.visibility) params.visibility = options.visibility;
    if (options.search) params.search = options.search;
    if (options.tags) params.tags = options.tags;

    return this.client.get<{ data: Collection[]; total: number }>('/collections', params);
  }

  async update(collectionId: string, collectionData: CollectionUpdate | Record<string, any>): Promise<Collection> {
    const payload = collectionData;
    return this.client.put<Collection>(`/collections/${collectionId}`, payload);
  }

  async delete(collectionId: string): Promise<any> {
    return this.client.delete(`/collections/${collectionId}`);
  }

  async search(searchRequest: SearchRequest | Record<string, any>): Promise<SearchResponse> {
    const payload = searchRequest;
    return this.client.post<SearchResponse>('/collections/search', payload);
  }

  async insert(options: {
    collection_id: string;
    content?: string;
    file_path?: string;
    file_base64?: string;
    file?: File; // Browser File object
    urls?: string[];
    label?: string;
    description?: string;
    metadata?: Record<string, any>;
    mimetype?: string;
    ingest?: boolean;
    reader?: string | Record<string, string>;
  }): Promise<UploadResponse> {
    const filesList: FileUpload[] = [];

    // Handle browser File object
    if (options.file) {
      // Check if File API is available (browser environment)
      if (typeof File === 'undefined' || !(options.file instanceof File)) {
        throw new Error(
          'file option requires browser environment with File API. ' +
          'In Node.js, use file_path or file_base64 instead.'
        );
      }

      try {
        // Convert File to base64 using FileReader
        const fileBase64 = await this.fileToBase64(options.file);
        const label = options.label || options.file.name;
        const mimetype = options.mimetype || options.file.type || 'application/octet-stream';

        filesList.push({
          file: fileBase64,
          label: label,
          mimetype: mimetype,
        });
      } catch (error: any) {
        throw new Error(`Failed to read File object: ${error.message}`);
      }
    }

    // Handle file path (Node.js only)
    if (options.file_path) {
      try {
        // Dynamic import for Node.js modules (only works in Node.js)
        // This will fail in browser environments, which is expected
        // @ts-expect-error - Node.js modules, only available in Node.js runtime
        const fs = await import('fs/promises');
        // @ts-expect-error - Node.js modules, only available in Node.js runtime
        const path = await import('path');

        // Read file
        const fileBuffer = await fs.readFile(options.file_path);
        
        // Convert to base64
        const fileBase64 = fileBuffer.toString('base64');

        // Get filename from path
        const fileName = path.basename(options.file_path);
        const label = options.label || fileName;

        // Auto-detect mimetype if not provided
        let detectedMimetype = options.mimetype;
        if (!detectedMimetype) {
          // Try using file-type library if available (optional dependency)
          try {
            // @ts-expect-error - Optional dependency, may not be installed
            const { fileTypeFromBuffer } = await import('file-type');
            if (fileTypeFromBuffer) {
              const fileType = await fileTypeFromBuffer(fileBuffer);
              detectedMimetype = fileType?.mime;
            }
          } catch {
            // file-type not available, continue with extension-based detection
          }
          
          // Fallback to extension-based detection
          if (!detectedMimetype) {
            const ext = path.extname(options.file_path).toLowerCase();
            const mimeTypes: Record<string, string> = {
              '.pdf': 'application/pdf',
              '.doc': 'application/msword',
              '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              '.txt': 'text/plain',
              '.md': 'text/markdown',
              '.html': 'text/html',
              '.json': 'application/json',
              '.csv': 'text/csv',
              '.xls': 'application/vnd.ms-excel',
              '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              '.ppt': 'application/vnd.ms-powerpoint',
              '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              '.png': 'image/png',
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.gif': 'image/gif',
              '.svg': 'image/svg+xml',
            };
            detectedMimetype = mimeTypes[ext] || 'application/octet-stream';
          }
        }

        filesList.push({
          file: fileBase64,
          label: label,
          mimetype: detectedMimetype,
        });
      } catch (error: any) {
        // If fs import fails, we're not in Node.js
        if (error.code === 'ERR_MODULE_NOT_FOUND' || 
            error.message?.includes('Cannot find module') ||
            error.message?.includes('fs') ||
            error.code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
          throw new Error(
            'file_path option requires Node.js environment with fs module. ' +
            'In browser environments, use file_base64 or the File API instead. ' +
            'Error: ' + error.message
          );
        }
        // Re-throw other errors (file not found, permission errors, etc.)
        throw new Error(`Failed to read file from path "${options.file_path}": ${error.message}`);
      }
    }

    // Handle base64 file
    if (options.file_base64) {
      filesList.push({
        file: options.file_base64,
        label: options.label || 'file',
        mimetype: options.mimetype,
      });
    }

    const uploadReq: UploadRequest = {
      collection_id: options.collection_id,
      content_type: options.content ? 'text' : options.urls ? 'url' : 'file',
      files: filesList.length > 0 ? filesList : undefined,
      content: options.content,
      urls: options.urls,
      label: options.label,
      description: options.description,
      metadata: options.metadata,
      ingest: options.ingest !== false,
      reader: options.reader,
    };

    const payload: any = { ...uploadReq };
    // Remove undefined fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    return this.client.post<UploadResponse>('/upload', payload);
  }

  async insertDirectory(_options: {
    collection_id: string;
    directory_path: string;
    recursive?: boolean;
    file_extensions?: string[];
    exclude_patterns?: string[];
    metadata?: Record<string, any>;
    ingest?: boolean;
    reader?: string | Record<string, string>;
    batch_size?: number;
    show_progress?: boolean;
  }): Promise<UploadResponse[]> {
    // This would require Node.js fs module
    // For now, throw an error indicating this is a Node.js-only feature
    throw new Error('insert_directory requires Node.js environment with fs module');
  }

  async getChunks(options: {
    collection_id: string;
    limit?: number;
    cursor?: string;
    include_embedding?: boolean;
    content_id?: string;
  }): Promise<ChunksResponse> {
    const params: Record<string, any> = {
      limit: options.limit || 50,
      include_embedding: options.include_embedding || false,
    };
    if (options.cursor) params.cursor = options.cursor;
    if (options.content_id) params.content_id = options.content_id;

    const headers = {
      'X-Collection-Id': options.collection_id,
    };

    return this.client.get<ChunksResponse>('/chunks', params, headers);
  }

  /**
   * Convert a browser File object to base64 string.
   * @private
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check if FileReader is available (browser only)
      if (typeof FileReader === 'undefined') {
        reject(new Error('FileReader API is not available. This method requires a browser environment.'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      
      reader.onerror = (error: ProgressEvent<FileReader>) => {
        reject(new Error(`Failed to read file: ${error}`));
      };
      
      reader.readAsDataURL(file);
    });
  }
}

