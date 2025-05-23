export interface UnknownWord {
  id: number;
  word: string;
  translation: string;
  article: string | null;
  status: "learned" | "learning";
  timesSeen: number;
  exampleSentence: string;
  exampleSentenceTranslation: string;
}
