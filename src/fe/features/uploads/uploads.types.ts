export interface CreateUserPresignedUploadInput {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface PresignedUploadResponse {
  key: string;
  url: string;
  publicUrl: string;
  bucket: string;
  method: string;
  headers: Record<string, string>;
  expiresIn: number;
}
