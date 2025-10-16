export type AspectRatio = '16:9' | '9:16';
export type Resolution = '720p' | '1080p';
export type VEOModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';

export interface GenerationConfig {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  model: VEOModel;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
}
