declare module "arabic-persian-reshaper" {
  const reshaper: {
    PersianShaper: {
      convertArabic(text: string): string
      convertArabicBack(text: string): string
    }
    ArabicShaper: {
      convertArabic(text: string): string
      convertArabicBack(text: string): string
    }
  }
  export default reshaper
}

declare module "bidi-js" {
  type EmbeddingLevels = {
    levels: Uint8Array
    paragraphs: Array<{ start: number; end: number; level: number }>
  }

  type Bidi = {
    getEmbeddingLevels(text: string, direction?: "ltr" | "rtl"): EmbeddingLevels
    getReorderSegments(text: string, embedding: EmbeddingLevels, start?: number, end?: number): Array<[number, number]>
    getMirroredCharactersMap(text: string, embedding: EmbeddingLevels, start?: number, end?: number): Map<number, string>
  }

  export default function bidiFactory(): Bidi
}
