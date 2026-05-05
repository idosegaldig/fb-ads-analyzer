declare module 'bidi-js' {
  export function getEmbeddingLevels(text: string, defaultDirection?: 'ltr' | 'rtl'): any;
  export function getReorderedString(text: string, embeddingLevels: any): string;
}
