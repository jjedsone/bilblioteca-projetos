// server/types.ts
export type Chapter = {
  id: string;
  title: string;
  text: string;
  paragraphs?: string[];
  richParagraphs?: string[];
};

export type Book = {
  id: string;
  title: string;
  chapters: Chapter[];
  coverDataUrl?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  originalFilename?: string;
};

export type ReadingPosition = {
  chapterIndex: number;
  pageNumber: number;
  timestamp: Date;
};

export type Bookmark = {
  id: string;
  chapterIndex: number;
  pageNumber: number;
  note?: string;
  createdAt: Date;
};

export type Annotation = {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  startChar: number;
  endChar: number;
  text: string;
  note: string;
  createdAt: Date;
  color?: string;
};

export type Comment = {
  id: string;
  chapterIndex: number;
  paragraphIndex: number;
  text: string;
  createdAt: Date;
  author?: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  book?: Book;
  finalized?: boolean;
  finalizedAt?: Date;
  readingPosition?: ReadingPosition;
  bookmarks?: Bookmark[];
  readingHistory?: ReadingPosition[];
  annotations?: Annotation[];
  comments?: Comment[];
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  isRead?: boolean;
  isReading?: boolean;
  readAt?: Date;
  paragraphFontSettings?: Record<string, Record<number, boolean>>;
};

export interface CreateProjectRequest {
  name: string;
}

export interface UpdateProjectRequest {
  name?: string;
  book?: Book;
  finalized?: boolean;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  isRead?: boolean;
  isReading?: boolean;
}

export interface CreateBookRequest {
  title: string;
  chapters: Chapter[];
  coverDataUrl?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  originalFilename?: string;
}

export interface UpdateBookRequest {
  title?: string;
  chapters?: Chapter[];
  coverDataUrl?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  originalFilename?: string;
}

