// Prompt Library Service - Handles API communication
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { 
  Article, 
  ArticleContent, 
  ApiArticleResponse, 
  ApiArticleContentResponse 
} from '../models/article.model';

@Injectable({
  providedIn: 'root'
})
export class PromptLibraryService {
  private readonly http = inject(HttpClient);
  
  private readonly baseUrl = 'https://prompt-lib.azurewebsites.net';
  private readonly authToken = 'eyJpZCI6MSwiZW1haWwiOiJtb2hhbmlzaC5naGFuc2h5YW0ta2hvdGVsZUBjYXBnZW1pbmkuY29tIiwibmFtZSI6Ik1vaGFuaXNoIEtob3RlbGUifQ==';

  private readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': this.authToken
    })
  };

  /**
   * Gets all approved articles from the API
   */
  getAllArticles(): Observable<Article[]> {
    const url = `${this.baseUrl}/getAllArticles/1/?getby=approvalid`;
    
    return this.http.get<ApiArticleResponse[]>(url, this.httpOptions)
      .pipe(
        retry(2), // Retry failed requests up to 2 times
        map(response => this.mapArticleResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Gets specific article content by ID
   */
  getArticleContent(articleId: string | number): Observable<ArticleContent> {
    const url = `${this.baseUrl}/getArticlesByArticleId/1/${articleId}?q=getapproved`;
    
    return this.http.get<ApiArticleContentResponse[]>(url, this.httpOptions)
      .pipe(
        retry(2),
        map(response => {
          if (!response || response.length === 0) {
            throw new Error('Article not found');
          }
          return this.mapArticleContentResponse(response[0]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Maps API article response to internal Article model
   */
  private mapArticleResponse(response: ApiArticleResponse[]): Article[] {
    if (!Array.isArray(response)) {
      console.warn('Invalid API response format for articles');
      return [];
    }

    return response.map(item => ({
      label: item.articleName || 'Untitled',
      link: item.articleId,
      description: item.description
    }));
  }

  /**
   * Maps API article content response to internal ArticleContent model
   */
  private mapArticleContentResponse(response: ApiArticleContentResponse): ArticleContent {
    return {
      title: response.title || 'Untitled',
      description: response.description || '',
      AiTool: response.AiTool,
      Category: response.Category,
      SubCategory: response.SubCategory,
      isPublished: response.isPublished,
      publishedBy: response.publishedBy,
      publishedDate: response.publishedDate,
      lastUpdatedBy: response.lastUpdatedBy,
      updatedDate: response.updatedDate
    };
  }

  /**
   * Centralized error handling
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        case 401:
          errorMessage = 'Authentication failed. Please try again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Internal server error. Please try again later.';
          break;
        default:
          errorMessage = `Server returned code: ${error.status}, error message is: ${error.message}`;
      }
    }

    console.error('PromptLibraryService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}