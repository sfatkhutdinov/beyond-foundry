import { MODULE_ID } from '../constants.js';
import { Logger, getErrorMessage } from '../utils/logger.js';
import { BeyondFoundryAPI } from '../api/BeyondFoundryAPI.js';
import { AuthDialog } from './AuthDialog.js';
import type { DDBCharacter, ImportOptions } from '../../types/index.js';

interface PendingCharacter {
  id: string;
  loading: boolean;
  loaded: boolean;
  error?: string;
  character?: DDBCharacter;
}

/**
 * Character import dialog for manual character ID input and importing
 */
export class CharacterImportDialog extends Application {
  private pendingCharacters: Map<string, PendingCharacter> = new Map();
  private loading: boolean = false;

  static override get defaultOptions(): ApplicationOptions {
    return mergeObject(super.defaultOptions, {
      id: `${MODULE_ID}-character-import-dialog`,
      title: 'Import D&D Beyond Characters',
      template: 'modules/beyond-foundry/templates/character-import-dialog-v2.hbs',
      width: 700,
      height: 600,
      classes: ['beyond-foundry', 'character-import-dialog'],
      resizable: true,
      minimizable: false,
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
    });
  }

  /**
   * Activate event listeners
   */
  override activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Authentication button
    html.find('.authenticate').on('click', this._onAuthenticate.bind(this));

    // Add single character button
    html.find('.add-character-btn').on('click', this._onAddCharacter.bind(this));

    // Add bulk characters button
    html.find('.add-bulk-characters-btn').on('click', this._onAddBulkCharacters.bind(this));

    // Remove character buttons (using event delegation for dynamic elements)
    html.on('click', '.remove-character-btn', this._onRemoveCharacter.bind(this));

    // Preview all characters button
    html.find('.preview-all-btn').on('click', this._onPreviewAllCharacters.bind(this));

    // Clear all characters button
    html.find('.clear-all-btn').on('click', this._onClearAllCharacters.bind(this));

    // Import characters button
    html.find('.import-characters').on('click', this._onImportCharacters.bind(this));

    // Enter key handling for character ID input
    html.find('#character-id-input').on('keypress', event => {
      if (event.which === 13) {
        // Enter key
        event.preventDefault();
        // Create a fake event for compatibility
        const fakeEvent = { preventDefault: () => {} } as Event;
        this._onAddCharacter(fakeEvent);
      }
    });
  }

  /**
   * Add a single character by ID
   */
  private async _onAddCharacter(event: Event): Promise<void> {
    event.preventDefault();

    const input = this.element.find('#character-id-input')[0] as HTMLInputElement;
    const characterId = input.value.trim();

    if (!characterId) {
      ui.notifications.warn('Please enter a character ID');
      return;
    }

    if (!/^\d+$/.test(characterId)) {
      ui.notifications.error('Character ID must be a number');
      return;
    }

    if (this.pendingCharacters.has(characterId)) {
      ui.notifications.warn('Character already added');
      return;
    }

    // Add character to pending list
    this.pendingCharacters.set(characterId, {
      id: characterId,
      loading: false,
      loaded: false,
    });

    // Clear input
    input.value = '';

    // Re-render to show the new character
    this.render();
  }

  /**
   * Add multiple characters from bulk input
   */
  private async _onAddBulkCharacters(event: Event): Promise<void> {
    event.preventDefault();

    const textarea = this.element.find('#bulk-character-ids')[0] as HTMLTextAreaElement;
    const text = textarea.value.trim();

    if (!text) {
      ui.notifications.warn('Please enter character IDs');
      return;
    }

    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    let added = 0;
    let skipped = 0;

    for (const line of lines) {
      if (!/^\d+$/.test(line)) {
        ui.notifications.warn(`Skipping invalid character ID: ${line}`);
        skipped++;
        continue;
      }

      if (this.pendingCharacters.has(line)) {
        skipped++;
        continue;
      }

      this.pendingCharacters.set(line, {
        id: line,
        loading: false,
        loaded: false,
      });
      added++;
    }

    // Clear textarea
    textarea.value = '';

    if (added > 0) {
      ui.notifications.info(`Added ${added} character(s)`);
    }

    if (skipped > 0) {
      ui.notifications.warn(`Skipped ${skipped} character(s) (invalid or already added)`);
    }

    // Re-render to show the new characters
    this.render();
  }

  /**
   * Remove a character from the pending list
   */
  private _onRemoveCharacter(event: Event): void {
    event.preventDefault();

    const button = event.target as HTMLElement;
    const characterId =
      button.dataset.characterId ||
      button.closest('[data-character-id]')?.getAttribute('data-character-id');

    if (characterId && this.pendingCharacters.has(characterId)) {
      this.pendingCharacters.delete(characterId);
      this.render();
    }
  }

  /**
   * Preview all characters (load their data)
   */
  private async _onPreviewAllCharacters(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading) return;

    const unloadedCharacters = Array.from(this.pendingCharacters.values()).filter(
      char => !char.loading && !char.loaded && !char.error
    );

    if (unloadedCharacters.length === 0) {
      ui.notifications.info('All characters are already loaded');
      return;
    }

    this.loading = true;

    // Mark all as loading
    for (const char of unloadedCharacters) {
      char.loading = true;
    }

    this.render();

    const api = BeyondFoundryAPI.getInstance();

    // Load characters in parallel
    const promises = unloadedCharacters.map(async char => {
      try {
        const result = await api.getCharacter(char.id);
        if (result && result.success && result.character) {
          char.character = result.character;
          char.loaded = true;
          delete char.error;
        } else {
          char.error = result?.error || 'Failed to load character';
          char.loaded = false;
        }
      } catch (error) {
        char.error = getErrorMessage(error);
        char.loaded = false;
      } finally {
        char.loading = false;
      }
    });

    await Promise.all(promises);

    this.loading = false;
    this.render();

    const successful = unloadedCharacters.filter(char => char.loaded).length;
    const failed = unloadedCharacters.length - successful;

    if (successful > 0) {
      ui.notifications.info(`Successfully loaded ${successful} character(s)`);
    }

    if (failed > 0) {
      ui.notifications.warn(`Failed to load ${failed} character(s)`);
    }
  }

  /**
   * Clear all characters from the pending list
   */
  private _onClearAllCharacters(event: Event): void {
    event.preventDefault();

    this.pendingCharacters.clear();
    this.render();
  }

  /**
   * Open authentication dialog
   */
  private async _onAuthenticate(event: Event): Promise<void> {
    event.preventDefault();

    const authDialog = AuthDialog.show();

    // Listen for successful authentication
    authDialog.element.on('close', () => {
      // Refresh the dialog to show updated auth status
      this.render();
    });
  }

  /**
   * Get import options from form inputs
   */
  private _getImportOptions(): Partial<ImportOptions> {
    const importSpells =
      (this.element.find('#import-spells')[0] as HTMLInputElement)?.checked ?? true;
    const importItems =
      (this.element.find('#import-items')[0] as HTMLInputElement)?.checked ?? true;
    const updateExisting =
      (this.element.find('#update-existing')[0] as HTMLInputElement)?.checked ?? false;
    const spellPreparationMode =
      (this.element.find('#spell-preparation-mode')[0] as HTMLSelectElement)?.value ?? 'prepared';

    return {
      importSpells,
      importItems,
      updateExisting,
      spellPreparationMode: spellPreparationMode as any,
      createCompendiumItems: false, // Default to false for now
    };
  }

  /**
   * Import all loaded characters
   */
  private async _onImportCharacters(event: Event): Promise<void> {
    event.preventDefault();

    const readyCharacters = Array.from(this.pendingCharacters.values()).filter(
      char => char.loaded && char.character
    );

    if (readyCharacters.length === 0) {
      ui.notifications.warn('No characters are ready to import. Please preview characters first.');
      return;
    }

    // Get import options from form
    const importOptions = this._getImportOptions();

    const button = event.target as HTMLButtonElement;
    const originalText = button.textContent;
    button.textContent = 'Importing...';
    button.disabled = true;

    try {
      const api = BeyondFoundryAPI.getInstance();
      const results = [];

      for (const pendingChar of readyCharacters) {
        Logger.info(`Importing character: ${pendingChar.character!.name} (ID: ${pendingChar.id})`);

        const result = await api.importCharacter(pendingChar.id, importOptions);
        results.push({
          characterId: pendingChar.id,
          characterName: pendingChar.character!.name,
          result,
        });
      }

      // Show results
      const successful = results.filter(r => r.result.success).length;
      const failed = results.length - successful;

      if (successful > 0) {
        ui.notifications.info(`Successfully imported ${successful} character(s)`);
      }

      if (failed > 0) {
        ui.notifications.warn(`Failed to import ${failed} character(s)`);

        // Log failed imports
        results
          .filter(r => !r.result.success)
          .forEach(r => {
            Logger.error(`Failed to import ${r.characterName}: ${r.result.errors?.join(', ')}`);
          });
      }

      // Show spell import warnings if any
      results.forEach(r => {
        if (r.result.warnings && r.result.warnings.length > 0) {
          Logger.warn(`Warnings for ${r.characterName}: ${r.result.warnings.join(', ')}`);
        }
      });

      // Close dialog if all successful
      if (failed === 0) {
        this.close();
      }
    } catch (error) {
      Logger.error(`Import error: ${getErrorMessage(error)}`);
      ui.notifications.error(`Import failed: ${getErrorMessage(error)}`);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  /**
   * Check if user is authenticated
   */
  private _isAuthenticated(): boolean {
    const settings = game.settings.get(MODULE_ID, 'cobaltToken') as string;
    return !!(settings && settings.trim() !== '');
  }

  /**
   * Get template data
   */
  override getData(): any {
    const pendingCharactersList = Array.from(this.pendingCharacters.values());
    const readyToImport = pendingCharactersList.filter(char => char.loaded && char.character);

    return {
      isAuthenticated: this._isAuthenticated(),
      pendingCharacters: pendingCharactersList,
      readyToImport: readyToImport.length > 0,
      readyCount: readyToImport.length,
      loading: this.loading,
    };
  }

  /**
   * Static method to show character import dialog
   */
  static show(): CharacterImportDialog {
    const dialog = new CharacterImportDialog();
    dialog.render(true);
    return dialog;
  }
}
