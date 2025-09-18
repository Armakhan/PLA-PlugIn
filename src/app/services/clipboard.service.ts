// Clipboard Service - Handles copying content to clipboard
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {

  /**
   * Copies text to clipboard using modern Clipboard API with fallback
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return;
      }
      
      // Fallback for older browsers or non-secure contexts
      await this.fallbackCopyToClipboard(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      throw new Error('Failed to copy to clipboard');
    }
  }

  /**
   * Fallback method for copying to clipboard
   */
  private async fallbackCopyToClipboard(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      
      document.body.appendChild(textArea);
      
      try {
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (successful) {
          resolve();
        } else {
          reject(new Error('Copy command failed'));
        }
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(textArea);
      }
    });
  }

  /**
   * Checks if clipboard API is available
   */
  isClipboardSupported(): boolean {
    return !!(navigator.clipboard || document.execCommand);
  }
}