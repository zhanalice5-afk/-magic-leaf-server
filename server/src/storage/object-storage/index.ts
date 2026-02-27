import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * S3 Compatible Object Storage Service
 * Used for file upload, download, and management
 */
class ObjectStorageService {
  private storage: S3Storage;

  constructor() {
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
  }

  /**
   * Upload file buffer to object storage
   * @param fileContent - File buffer content
   * @param fileName - File name (will be prefixed with UUID)
   * @param contentType - MIME type
   * @returns The actual key of the uploaded file
   */
  async uploadFile(
    fileContent: Buffer,
    fileName: string,
    contentType: string
  ): Promise<string> {
    const key = await this.storage.uploadFile({
      fileContent,
      fileName,
      contentType,
    });
    return key;
  }

  /**
   * Generate a presigned URL for file access
   * @param key - File key (returned from uploadFile)
   * @param expireTime - URL expiration time in seconds (default: 1 day)
   * @returns Presigned URL
   */
  async generatePresignedUrl(key: string, expireTime = 86400): Promise<string> {
    return await this.storage.generatePresignedUrl({ key, expireTime });
  }

  /**
   * Read file content from object storage
   * @param key - File key
   * @returns File buffer
   */
  async readFile(key: string): Promise<Buffer> {
    return await this.storage.readFile({ fileKey: key });
  }

  /**
   * Delete file from object storage
   * @param key - File key
   * @returns Whether deletion was successful
   */
  async deleteFile(key: string): Promise<boolean> {
    return await this.storage.deleteFile({ fileKey: key });
  }

  /**
   * Check if file exists
   * @param key - File key
   * @returns Whether file exists
   */
  async fileExists(key: string): Promise<boolean> {
    return await this.storage.fileExists({ fileKey: key });
  }

  /**
   * Upload file from URL
   * @param url - Source URL
   * @param timeout - Download timeout
   * @returns The actual key of the uploaded file
   */
  async uploadFromUrl(url: string, timeout = 30000): Promise<string> {
    return await this.storage.uploadFromUrl({ url, timeout });
  }

  /**
   * List files with prefix
   * @param prefix - Key prefix
   * @param maxKeys - Maximum keys to return
   * @returns List of file keys
   */
  async listFiles(prefix?: string, maxKeys = 100): Promise<string[]> {
    const result = await this.storage.listFiles({ prefix, maxKeys });
    return result.keys;
  }
}

// Create singleton instance
const objectStorage = new ObjectStorageService();

/**
 * Upload file to storage and return presigned URL
 * @param fileContent - File buffer
 * @param fileName - File name
 * @param contentType - MIME type
 * @returns Object with key and url
 */
async function uploadToStorage(
  fileContent: Buffer,
  fileName: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = await objectStorage.uploadFile(fileContent, fileName, contentType);
  const url = await objectStorage.generatePresignedUrl(key);
  return { key, url };
}

// Export
export { objectStorage, uploadToStorage };
