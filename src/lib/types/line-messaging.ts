// 🚀 LINE Messaging Types
// Security-First TYPE definitions for LINE Bot messaging functionality

// Types for LINE messaging
export interface LineMessage {
  type: string;
  [key: string]: any;
}

export interface FlexCarouselMessage {
  type: "flex";
  altText: string;
  contents: {
    type: "carousel";
    contents: any[];
  };
}

export interface ImageMessage {
  type: "image";
  originalContentUrl: string;
  previewImageUrl: string;
}

export interface UploadResult {
  originalUrl: string;
  previewUrl: string;
}

// Image processing types
export interface ProcessedImage {
  originalBuffer: Buffer;
  previewBuffer: Buffer;
}

export interface FileInfo {
  originalFilename: string;
  previewFilename: string;
  originalPath: string;
  previewPath: string;
}

export interface UrlResult {
  originalUrl: string;
  previewUrl: string;
}
