import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromptLibraryComponent } from './components/prompt-library/prompt-library.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PromptLibraryComponent],
  template: `
    <div class="app">
      <app-prompt-library></app-prompt-library>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
      background-color: #f8f9fa;
    }
  `]
})
export class AppComponent {
  title = 'Prompt Library';
}