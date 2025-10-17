import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
  IonLabel, IonIcon, IonFab, IonFabButton, IonSearchbar,
  IonItemSliding, IonItemOptions, IonItemOption, IonSelect, IonSelectOption,
  IonNote, IonButtons, IonText, AlertController, AlertInput, AlertButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, create, trash, search, filter } from 'ionicons/icons';
import { StorageService } from '../services/storage.service';
import { Note, NoteSortOrder } from '../models/note.model';
import { Subscription } from 'rxjs';

/**
 * Interface for note form data
 */
interface NoteFormData {
  title: string;
  content: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, 
    IonLabel, IonIcon, IonFab, IonFabButton, IonSearchbar,
    IonItemSliding, IonItemOptions, IonItemOption, IonSelect, IonSelectOption,
    IonNote, IonButtons, IonText
  ],
})
export class HomePage implements OnInit, OnDestroy {
  notes: Note[] = [];
  searchTerm: string = '';
  sortOrder: NoteSortOrder = 'newest';
  
  // Subscriptions for better memory management
  private notesSubscription: Subscription | null = null;
  private sortOrderSubscription: Subscription | null = null;

  constructor(
    private storageService: StorageService,
    private alertController: AlertController
  ) {
    addIcons({ add, create, trash, search, filter });
  }

  ngOnInit(): void {
    // Subscribe to notes changes
    this.notesSubscription = this.storageService.notes$.subscribe(() => {
      this.refreshNotes();
    });

    // Subscribe to sort order changes
    this.sortOrderSubscription = this.storageService.sortOrder$.subscribe(order => {
      this.sortOrder = order;
      this.refreshNotes();
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.notesSubscription?.unsubscribe();
    this.sortOrderSubscription?.unsubscribe();
  }

  /**
   * Refresh notes list with current search term and sort order
   */
  private refreshNotes(): void {
    this.notes = this.storageService.getSortedNotes(this.searchTerm);
  }

  /**
   * Create alert inputs for note form
   * @param note Optional note for edit mode
   * @returns Array of alert inputs
   */
  private createNoteInputs(note?: Note): AlertInput[] {
    return [
      {
        name: 'title',
        type: 'text',
        placeholder: 'Title',
        value: note?.title || '',
        cssClass: 'custom-input'
      },
      {
        name: 'content',
        type: 'textarea',
        placeholder: 'Content',
        value: note?.content || '',
        cssClass: 'custom-textarea',
        attributes: {
          rows: '8'
        }
      }
    ];
  }

  /**
   * Add animation to alert element
   */
  private animateAlert(): void {
    const alertElement = document.querySelector('.custom-alert');
    if (alertElement) {
      setTimeout(() => {
        alertElement.classList.add('animate-in');
      }, 50);
    }
  }

  /**
   * Open modal to add a new note
   */
  async addNote(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'New Note',
      cssClass: 'custom-alert',
      inputs: this.createNoteInputs(),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'custom-button-cancel'
        },
        {
          text: 'Save',
          cssClass: 'custom-button-save',
          handler: (data: NoteFormData) => {
            if (data.title.trim() && data.content.trim()) {
              this.storageService.addNote(data.title, data.content);
            }
          }
        }
      ]
    });

    await alert.present();
    this.animateAlert();
  }

  /**
   * Open modal to edit an existing note
   * @param note Note to edit
   */
  async editNote(note: Note): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Edit Note',
      cssClass: 'custom-alert',
      inputs: this.createNoteInputs(note),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'custom-button-cancel'
        },
        {
          text: 'Save',
          cssClass: 'custom-button-save',
          handler: (data: NoteFormData) => {
            if (data.title.trim() && data.content.trim()) {
              const updatedNote = { 
                ...note, 
                title: data.title, 
                content: data.content 
              };
              this.storageService.updateNote(updatedNote);
            }
          }
        }
      ]
    });

    await alert.present();
    this.animateAlert();
  }

  /**
   * Show confirmation dialog and delete note if confirmed
   * @param id ID of the note to delete
   */
  async deleteNote(id: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Delete',
      message: 'Are you sure you want to delete this note?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'custom-button-cancel'
        },
        {
          text: 'Delete',
          cssClass: 'custom-button-delete',
          handler: () => {
            this.storageService.deleteNote(id);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Convenience method to open edit modal
   * @param note Note to edit
   */
  openEditModal(note: Note): void {
    this.editNote(note);
  }

  /**
   * Convenience method to open add modal
   */
  openAddModal(): void {
    this.addNote();
  }

  /**
   * Handle search input changes
   * @param event Search input event
   */
  onSearch(event: CustomEvent): void {
    this.searchTerm = event.detail.value;
    this.refreshNotes();
  }

  /**
   * Handle sort order changes
   * @param event Select change event
   */
  changeSortOrder(event: CustomEvent): void {
    const order = event.detail.value as NoteSortOrder;
    this.storageService.setSortOrder(order);
  }
}
