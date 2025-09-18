// Article model interfaces for type safety
export interface Article {
  label: string;        // Article name/title
  link: string | number; // Article ID for API calls
  description?: string; // Optional description for search/display
}

export interface ArticleContent {
  title: string;
  description: string;
  AiTool?: string;
  Category?: string;
  SubCategory?: string;
  isPublished?: boolean;
  publishedBy?: string;
  publishedDate?: string;
  lastUpdatedBy?: string;
  updatedDate?: string;
}

export interface PromptComponent {
  Prompt: string;
  PromptDesc: string;
  Code: string;
}

// API response types
export interface ApiArticleResponse {
  articleName: string;
  articleId: string | number;
  description?: string;
}

export interface ApiArticleContentResponse {
  title: string;
  description: string;
  [key: string]: any; // Allow for additional properties
}