import { MODULE_ID } from '../constants.js';
import { Logger } from '../utils/logger.js';
import { BeyondFoundryAPI } from '../api/BeyondFoundryAPI.js';

/**
 * Authentication dialog for D&D Beyond integration
 * Handles Cobalt token input and validation
 */
export class AuthDialog extends Application {
  static get defaultOptions(): ApplicationOptions {
    return mergeObject(super.defaultOptions, {
      id: `${MODULE_ID}-auth-dialog`,
      title: 'D&D Beyond Authentication',
      template: 'modules/beyond-foundry/templates/auth-dialog.hbs',
      width: 500,
      height: 'auto',
      classes: ['beyond-foundry', 'auth-dialog'],
      resizable: false,
      minimizable: false,
      closeOnSubmit: false,
      submitOnChange: false,
      submitOnClose: false,
    });
  }

  /**
   * Activate event listeners
   */
  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    // Handle form submission
    html.find('form').on('submit', this._onSubmitAuth.bind(this));
    
    // Handle test connection button
    html.find('.test-connection').on('click', this._onTestConnection.bind(this));
    
    // Handle help button
    html.find('.help-button').on('click', this._onShowHelp.bind(this));
  }

  /**
   * Handle authentication form submission
   */
  private async _onSubmitAuth(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const cobaltToken = formData.get('cobaltToken') as string;
    
    if (!cobaltToken || cobaltToken.trim() === '') {
      ui.notifications.error('Please enter your Cobalt session token');
      return;
    }

    try {
      Logger.info('Attempting D&D Beyond authentication...');
      
      // Show loading state
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Authenticating...';
      submitButton.disabled = true;

      const api = BeyondFoundryAPI.getInstance();
      const result = await api.authenticate(cobaltToken.trim());

      if (result.success) {
        ui.notifications.info('Authentication successful!');
        
        // Store token in settings for future use
        await game.settings.set(MODULE_ID, 'cobaltToken', cobaltToken.trim());
        
        this.close();
      } else {
        ui.notifications.error(`Authentication failed: ${result.message}`);
      }
      
      // Restore button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
      
    } catch (error) {
      Logger.error(`Authentication error: ${error.message}`);
      ui.notifications.error(`Authentication error: ${error.message}`);
    }
  }

  /**
   * Test proxy connection
   */
  private async _onTestConnection(event: Event): Promise<void> {
    event.preventDefault();
    
    try {
      const api = BeyondFoundryAPI.getInstance();
      const connected = await api.testProxyConnection();
      
      if (connected) {
        ui.notifications.info('Proxy connection successful!');
      } else {
        ui.notifications.error('Proxy connection failed. Check your ddb-proxy setup.');
      }
    } catch (error) {
      Logger.error(`Connection test error: ${error.message}`);
      ui.notifications.error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Show help information
   */
  private _onShowHelp(event: Event): void {
    event.preventDefault();
    
    new Dialog({
      title: 'Getting Your Cobalt Token',
      content: `
        <div class="beyond-foundry-help">
          <h3>How to find your Cobalt session token:</h3>
          <ol>
            <li>Log in to <a href="https://www.dndbeyond.com" target="_blank">D&D Beyond</a></li>
            <li>Open your browser's Developer Tools (F12)</li>
            <li>Go to the <strong>Application</strong> or <strong>Storage</strong> tab</li>
            <li>Look for <strong>Cookies</strong> under the D&D Beyond domain</li>
            <li>Find the cookie named <strong>CobaltSession</strong></li>
            <li>Copy its value (should be a long string)</li>
          </ol>
          <p><strong>Important:</strong> Keep this token private! It provides access to your D&D Beyond account.</p>
          <p><em>The token will expire periodically and you'll need to get a new one.</em></p>
        </div>
      `,
      buttons: {
        ok: {
          label: 'Got it!',
          callback: () => {}
        }
      }
    }).render(true);
  }

  /**
   * Get template data
   */
  getData(): any {
    return {
      isConnected: false, // TODO: Check if already authenticated
      proxyUrl: game.settings.get(MODULE_ID, 'proxyUrl')
    };
  }

  /**
   * Static method to show authentication dialog
   */
  static show(): AuthDialog {
    const dialog = new AuthDialog();
    dialog.render(true);
    return dialog;
  }
}
