/**
 * Represents a note in the application
 */
export interface Note {
  /** Unique identifier for the note */
  id: string;
  
  /** Title of the note */
  title: string;
  
  /** Content/body of the note */
  content: string;
  
  /** Timestamp when the note was created (milliseconds since epoch) */
  createdAt: number;
  
  /** Timestamp when the note was last updated (milliseconds since epoch) */
  updatedAt: number;
}

/**
 * Sort order options for notes
 */
export type NoteSortOrder = 'newest' | 'oldest' | 'alphabetical';