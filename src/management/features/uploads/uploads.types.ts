export interface CreatePresignedUploadInput {
  fileName: string;
  mimeType: string;
  size: number;
  path?: string;
  baseName?: string;
}

export interface PresignedUploadResponse {
  key: string;
  url: string;
  publicUrl: string;
  bucket: string;
  method: string;
  headers: Record<string, string>;
  expiresIn: number;
  [key: string]: unknown;
}
