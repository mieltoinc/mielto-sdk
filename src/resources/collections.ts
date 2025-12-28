/** Collection resource for interacting with the Mielto Collections API. */

import { BaseClient } from '../clients/base';
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
  CollectionStoreType,
} from '../types/collection';
import { detectMimetypeFromFile, detectMimetypeFromBuffer } from '../utils';

export class Collections {
  constructor(private client: BaseClient) {}

  async create(collectionData: CollectionCreate | Record<string, any>): Promise<Collection> {
    const payload = collectionData;
    if (payload.store_type) {
      const validStoreTypes = Object.values(CollectionStoreType);
      if (!validStoreTypes.includes(payload.store_type)) {
        throw new Error('Invalid store type');
      }
    } else {
      payload.store_type = CollectionStoreType.PGVECTOR;
    }
    return this.client.post<Collection>('/collections', payload);
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
        
        // Auto-detect mimetype if not provided
        let detectedMimetype = options.mimetype || options.file.type;
        if (!detectedMimetype) {
          const detected = await detectMimetypeFromFile(options.file);
          if (detected) {
            detectedMimetype = detected;
          }
        }

        filesList.push({
          file: fileBase64,
          label: label,
          mimetype: detectedMimetype || 'application/octet-stream',
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
        const fs = await import('fs/promises');
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
          // Try using file-type library (works in both Node.js and browser environments)
          detectedMimetype = await detectMimetypeFromBuffer(fileBuffer);
          
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

  async insertDirectory(options: {
    collection_id: string;
    directory_path: string;
    recursive?: boolean;
    file_extensions?: string[];
    exclude_patterns?: string[];
    metadata?: Record<string, any>;
    ingest?: boolean;
    reader?: string | Record<string, any>;
    batch_size?: number;
    show_progress?: boolean;
  }): Promise<UploadResponse[]> {
    try {
      // Dynamic import for Node.js modules (only works in Node.js)
      // This will fail in browser environments, which is expected
      const fs = await import('fs/promises');
      const path = await import('path');

      const directoryPath = options.directory_path;
      const recursive = options.recursive !== false; // Default to true
      const fileExtensions = options.file_extensions;
      const excludePatterns = options.exclude_patterns || [];
      const batchSize = options.batch_size || 10;
      const showProgress = options.show_progress !== false; // Default to true

      // Check if directory exists
      try {
        const stats = await fs.stat(directoryPath);
        if (!stats.isDirectory()) {
          throw new Error(`Not a directory: ${directoryPath}`);
        }
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          throw new Error(`Directory not found: ${directoryPath}`);
        }
        throw error;
      }

      // Collect all files
      const filesToUpload = await this._collectFiles(
        fs,
        path,
        directoryPath,
        recursive,
        fileExtensions,
        excludePatterns
      );

      if (filesToUpload.length === 0) {
        if (showProgress) {
          console.log('No files found to upload');
        }
        return [];
      }

      if (showProgress) {
        console.log(`Found ${filesToUpload.length} file(s) to upload`);
      }

      // Upload in batches
      const responses: UploadResponse[] = [];
      const totalBatches = Math.ceil(filesToUpload.length / batchSize);

      for (let i = 0; i < filesToUpload.length; i += batchSize) {
        const batch = filesToUpload.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        if (showProgress) {
          console.log(`Uploading batch ${batchNumber}/${totalBatches} (${batch.length} file(s))`);
        }

        // Prepare files for this batch
        const filesList: FileUpload[] = [];

        for (const filePath of batch) {
          try {
            // Read file
            const fileBuffer = await fs.readFile(filePath);

            // Convert to base64
            const fileBase64 = fileBuffer.toString('base64');

            // Get relative path for label
            let label: string;
            try {
              const relativePath = path.relative(directoryPath, filePath);
              label = relativePath;
            } catch {
              label = path.basename(filePath);
            }

            // Auto-detect mimetype
            let detectedMimetype = await detectMimetypeFromBuffer(fileBuffer);

            // Fallback to extension-based detection
            if (!detectedMimetype) {
              const ext = path.extname(filePath).toLowerCase();
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

            filesList.push({
              file: fileBase64,
              label: label,
              mimetype: detectedMimetype,
            });
          } catch (error: any) {
            if (showProgress) {
              console.warn(`Failed to read file "${filePath}": ${error.message}`);
            }
            // Continue with other files in the batch
          }
        }

        if (filesList.length === 0) {
          if (showProgress) {
            console.warn(`Batch ${batchNumber} had no valid files to upload`);
          }
          continue;
        }

        // Upload batch using the existing insert method structure
        const uploadReq: UploadRequest = {
          collection_id: options.collection_id,
          content_type: 'file',
          files: filesList,
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

        try {
          const response = await this.client.post<UploadResponse>('/upload', payload);
          responses.push(response);
        } catch (error: any) {
          if (showProgress) {
            console.error(`Failed to upload batch ${batchNumber}: ${error.message}`);
          }
          // Continue with next batch
        }
      }

      if (showProgress) {
        console.log(`Completed: ${responses.length}/${totalBatches} batch(es) uploaded successfully`);
      }

      return responses;
    } catch (error: any) {
      // If fs import fails, we're not in Node.js
      if (
        error.code === 'ERR_MODULE_NOT_FOUND' ||
        error.message?.includes('Cannot find module') ||
        error.message?.includes('fs') ||
        error.code === 'ERR_UNSUPPORTED_DIR_IMPORT'
      ) {
        throw new Error(
          'insert_directory requires Node.js environment with fs module. ' +
          'This feature is not available in browser environments. ' +
          'Error: ' + error.message
        );
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Collect files from directory based on filters.
   * @private
   */
  private async _collectFiles(
    fs: any,
    path: any,
    directoryPath: string,
    recursive: boolean,
    fileExtensions?: string[],
    excludePatterns?: string[]
  ): Promise<string[]> {
    const files: string[] = [];

    async function walkDirectory(dir: string, isRecursive: boolean): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (isRecursive) {
              // Check if directory should be excluded
              if (excludePatterns && excludePatterns.some(pattern => {
                // Simple pattern matching - support exact match and wildcard patterns
                if (pattern.includes('*')) {
                  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                  return regex.test(entry.name);
                }
                return entry.name === pattern;
              })) {
                continue;
              }
              await walkDirectory(fullPath, isRecursive);
            }
          } else if (entry.isFile()) {
            // Check if file should be excluded
            if (excludePatterns && excludePatterns.some(pattern => {
              // Simple pattern matching
              if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(entry.name);
              }
              return entry.name === pattern;
            })) {
              continue;
            }

            // Check file extension
            if (fileExtensions && fileExtensions.length > 0) {
              const ext = path.extname(fullPath).toLowerCase();
              if (!fileExtensions.some(extPattern => ext === extPattern.toLowerCase())) {
                continue;
              }
            }

            files.push(fullPath);
          }
        }
      } catch (error: any) {
        // Skip directories we can't read
        if (error.code !== 'EACCES' && error.code !== 'EPERM') {
          throw error;
        }
      }
    }

    await walkDirectory(directoryPath, recursive);
    return files;
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

