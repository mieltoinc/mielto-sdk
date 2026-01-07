/**
 * Utility functions for file type detection and mimetype detection.
 */

/**
 * Detect mimetype from a File or Blob object (browser environment).
 * Uses file-type library which works in both Node.js and browser.
 * 
 * @param file - File or Blob object
 * @returns Detected mimetype or undefined if detection fails
 */
export async function detectMimetypeFromFile(file: File | Blob): Promise<string | undefined> {
  try {
    const { fileTypeFromBlob, fileTypeFromBuffer } = await import('file-type');
    
    if (fileTypeFromBlob) {
      // Use fileTypeFromBlob for File/Blob objects (browser)
      const fileType = await fileTypeFromBlob(file);
      return fileType?.mime;
    } else if (fileTypeFromBuffer) {
      // Fallback to fileTypeFromBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const fileType = await fileTypeFromBuffer(uint8Array);
      return fileType?.mime;
    }
  } catch {
    // file-type not available or detection failed
    return undefined;
  }
  return undefined;
}

/**
 * Detect mimetype from a Buffer or Uint8Array (Node.js environment).
 * Uses file-type library which works in both Node.js and browser.
 * 
 * @param buffer - Buffer or Uint8Array
 * @returns Detected mimetype or undefined if detection fails
 */
export async function detectMimetypeFromBuffer(buffer: Buffer | Uint8Array): Promise<string | undefined> {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    if (fileTypeFromBuffer) {
      // Convert Buffer to Uint8Array for file-type
      const uint8Array = buffer instanceof Uint8Array 
        ? buffer 
        : new Uint8Array(buffer);
      const fileType = await fileTypeFromBuffer(uint8Array);
      return fileType?.mime;
    }
  } catch {
    // file-type not available or detection failed
    return undefined;
  }
  return undefined;
}
