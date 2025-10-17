import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';
import { Note, NoteSortOrder } from '../models/note.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null;
  private _notes = new BehaviorSubject<Note[]>([]);
  private _sortOrder = new BehaviorSubject<NoteSortOrder>('newest');

  /** Observable for notes changes */
  notes$ = this._notes.asObservable();
  
  /** Observable for sort order changes */
  sortOrder$ = this._sortOrder.asObservable();

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    const storage = await this.storage.create();
    this._storage = storage;
    this.loadNotes();
    this.loadSortPreference();
  }

  async loadNotes() {
    try {
      const notes = await this._storage?.get('notes') || [];
      this._notes.next(notes);
    } catch (error) {
      console.error('Error loading notes', error);
    }
  }

  async loadSortPreference() {
    try {
      const sortOrder = await this._storage?.get('sortOrder') || 'newest';
      this._sortOrder.next(sortOrder);
    } catch (error) {
      console.error('Error loading sort preference', error);
    }
  }

  async addNote(title: string, content: string): Promise<Note> {
    const timestamp = Date.now();
    const newNote: Note = {
      id: uuidv4(),
      title,
      content,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const currentNotes = this._notes.value;
    const updatedNotes = [...currentNotes, newNote];
    
    await this._storage?.set('notes', updatedNotes);
    this._notes.next(updatedNotes);
    
    return newNote;
  }

  async updateNote(note: Note): Promise<Note> {
    const currentNotes = this._notes.value;
    const updatedNote = { ...note, updatedAt: Date.now() };
    
    const updatedNotes = currentNotes.map(n => 
      n.id === updatedNote.id ? updatedNote : n
    );
    
    await this._storage?.set('notes', updatedNotes);
    this._notes.next(updatedNotes);
    
    return updatedNote;
  }

  async deleteNote(id: string): Promise<void> {
    const currentNotes = this._notes.value;
    const updatedNotes = currentNotes.filter(note => note.id !== id);
    
    await this._storage?.set('notes', updatedNotes);
    this._notes.next(updatedNotes);
  }

  /**
   * Set the sort order for notes
   * @param order The sort order to use
   */
  async setSortOrder(order: NoteSortOrder): Promise<void> {
    await this._storage?.set('sortOrder', order);
    this._sortOrder.next(order);
  }

  getSortedNotes(searchTerm: string = ''): Note[] {
    const notes = this._notes.value;
    const filteredNotes = searchTerm 
      ? notes.filter(note => 
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          note.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : notes;
    
    return this.sortNotes(filteredNotes);
  }

  private sortNotes(notes: Note[]): Note[] {
    const sortOrder = this._sortOrder.value;
    
    return [...notes].sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.createdAt - a.createdAt;
      } else {
        return a.createdAt - b.createdAt;
      }
    });
  }
}