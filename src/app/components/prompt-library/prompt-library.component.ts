// Prompt Library Component - Modern Angular implementation
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, map, catchError, finalize } from 'rxjs/operators';
import { PromptLibraryService } from '../../services/prompt-library.service';
import { Article, ArticleContent } from '../../models/article.model';
import { ClipboardService } from '../../services/clipboard.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-prompt-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-library.component.html',
  styleUrls: ['./prompt-library.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromptLibraryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new BehaviorSubject<string>('');
  private readonly articlesSubject = new BehaviorSubject<Article[]>([]);
  
  // Injected services using modern Angular inject function
  private readonly promptService = inject(PromptLibraryService);
  private readonly clipboardService = inject(ClipboardService);
  private readonly notificationService = inject(NotificationService);

  // Component state
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  // Reactive data streams
  articles$ = this.articlesSubject.asObservable();
  
  filteredArticles$: Observable<Article[]> = combineLatest([
    this.articles$,
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    )
  ]).pipe(
    map(([articles, searchTerm]) => this.filterArticles(articles, searchTerm))
  );

  // For template binding (when not using async pipe)
  filteredArticles: Article[] = [];

  ngOnInit(): void {
    this.setupSearchSubscription();
    this.loadArticles();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Sets up the search subscription for reactive filtering
   */
  private setupSearchSubscription(): void {
    this.filteredArticles$
      .pipe(takeUntil(this.destroy$))
      .subscribe(articles => {
        this.filteredArticles = articles;
      });
  }

  /**
   * Loads articles from the API
   */
  loadArticles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.promptService.getAllArticles()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.errorMessage = 'Failed to load prompts. Please try again.';
          console.error('Error loading articles:', error);
          return [];
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(articles => {
        this.articlesSubject.next(articles);
      });
  }

  /**
   * Handles search input changes
   */
  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Triggers search (for search button click)
   */
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  /**
   * Handles article selection
   */
  onArticleSelect(article: Article): void {
    this.promptService.getArticleContent(article.link)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.notificationService.showError('Failed to load article content');
          console.error('Error loading article content:', error);
          throw error;
        })
      )
      .subscribe(content => {
        this.displayArticleContent(content);
      });
  }

  /**
   * Handles viewing a prompt
   */
  onViewPrompt(article: Article, event: Event): void {
    event.stopPropagation();
    this.onArticleSelect(article);
  }

  /**
   * Handles copying a prompt to clipboard
   */
  onCopyPrompt(article: Article, event: Event): void {
    event.stopPropagation();
    
    this.promptService.getArticleContent(article.link)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.notificationService.showError('Failed to copy prompt');
          console.error('Error copying prompt:', error);
          throw error;
        })
      )
      .subscribe(content => {
        const markdownContent = this.convertToMarkdown(content);
        this.clipboardService.copyToClipboard(markdownContent)
          .then(() => {
            this.notificationService.showSuccess('Prompt copied to clipboard!');
          })
          .catch(() => {
            this.notificationService.showError('Failed to copy to clipboard');
          });
      });
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByArticleId(index: number, article: Article): string | number {
    return article.link;
  }

  /**
   * Filters articles based on search term
   */
  private filterArticles(articles: Article[], searchTerm: string): Article[] {
    if (!searchTerm.trim()) {
      return articles;
    }

    const term = searchTerm.toLowerCase();
    return articles.filter(article =>
      article.label.toLowerCase().includes(term) ||
      (article.description && article.description.toLowerCase().includes(term))
    );
  }

  /**
   * Displays article content (could open in modal, new tab, etc.)
   */
  private displayArticleContent(content: ArticleContent): void {
    const markdownContent = this.convertToMarkdown(content);
    
    // For now, we'll create a new document/tab
    // In a real app, this might open a modal or navigate to a detail view
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Prompt: ${content.title}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; line-height: 1.6; }
              h1, h2 { color: #333; }
              pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
              code { background: #f0f0f0; padding: 2px 4px; border-radius: 3px; }
            </style>
          </head>
          <body>
            <pre>${markdownContent}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  }

  /**
   * Converts article content to markdown format
   */
  private convertToMarkdown(content: ArticleContent): string {
    let markdown = `# ${content.title}\n\n`;

    try {
      const descriptionArray = JSON.parse(content.description);
      if (Array.isArray(descriptionArray) && descriptionArray.length > 0) {
        descriptionArray.forEach((component: any) => {
          markdown += `## Description\n\n`;
          markdown += `**Prompt:** ${component.Prompt}\n\n`;
          markdown += `**Prompt Description:** ${component.PromptDesc}\n\n`;
          markdown += `**Code:** ${component.Code}\n\n`;
        });
      }
    } catch (error) {
      // If description is not valid JSON, treat as plain text
      markdown += `## Description\n\n${content.description}\n\n`;
    }

    return markdown;
  }
}