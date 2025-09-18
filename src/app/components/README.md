# Angular Prompt Library Components

This directory contains modern Angular components that replicate the UI design for the Prompt Library application. The components follow Angular best practices and modern design patterns.

## 🎨 Design Analysis & Implementation

### Layout
- **Grid-based layout** using CSS Grid for responsive article cards
- **Flexbox** for component internal layout and alignment
- **Mobile-first responsive design** with breakpoints at 768px and 480px
- **Centered container** with max-width for optimal reading experience

### Colors & Theme
- **Primary Color**: `#007acc` (VS Code blue) for buttons and active states
- **Background**: `#ffffff` on `#f8f9fa` surface for clean contrast
- **Text**: `#212529` primary, `#6c757d` for muted text
- **Borders**: `#e9ecef` for subtle separation
- **Shadows**: Subtle elevation with `box-shadow` for depth
- **Dark mode support** via CSS custom properties and `prefers-color-scheme`

### Typography
- **Font Family**: Inter (fallback to system fonts)
- **Font Sizes**: Modular scale from 0.875rem to 1.875rem
- **Font Weights**: 400 (regular), 500 (medium), 600 (semibold)
- **Line Height**: 1.5 for optimal readability
- **Letter Spacing**: -0.025em for large headings

### UI Elements

#### Search Component
- **Input Field**: Full-width with padding and border-radius
- **Search Icon**: SVG icon with hover states
- **Focus States**: Blue border with subtle shadow

#### Article Cards
- **Card Layout**: Vertical stack with header, content, and actions
- **Hover Effects**: Lift animation with increased shadow
- **Badges**: Rounded corners with primary color background
- **Meta Information**: Icons with descriptive text
- **Action Buttons**: Primary and secondary button styles

#### Interactive States
- **Hover**: Smooth transitions with transform and color changes
- **Focus**: Keyboard navigation with visible focus rings
- **Loading**: Animated spinner with descriptive text
- **Error**: Red color scheme with retry functionality

## 🏗️ Component Architecture

### PromptLibraryComponent
**Main container component with:**
- Reactive search functionality using RxJS
- State management for loading/error states
- Accessibility features (ARIA labels, keyboard navigation)
- Responsive grid layout for article cards

### Services

#### PromptLibraryService
- HTTP client integration with error handling
- API response mapping and transformation
- Retry logic for failed requests
- Type-safe interfaces for data models

#### ClipboardService
- Modern Clipboard API with fallback support
- Cross-browser compatibility
- Promise-based async operations

#### NotificationService
- Centralized notification system
- Multiple notification types (success, error, warning, info)
- Auto-dismiss functionality

## 📱 Responsive Design

### Desktop (>768px)
- Multi-column grid layout (auto-fill, minmax(350px, 1fr))
- Horizontal button layout in cards
- Full search container width

### Tablet (768px)
- Single column grid
- Maintained card spacing
- Adjusted search container margins

### Mobile (480px)
- Compact padding and spacing
- Vertical button layout in cards
- Smaller typography scale
- Touch-friendly interactive elements

## ♿ Accessibility Features

- **Semantic HTML**: Proper heading hierarchy and landmark elements
- **ARIA Labels**: Descriptive labels for interactive elements
- **Keyboard Navigation**: Full keyboard support with visible focus states
- **Screen Reader Support**: Meaningful alt text and descriptions
- **Color Contrast**: WCAG compliant color combinations
- **Focus Management**: Logical tab order and focus trapping

## 🎯 Modern Angular Best Practices

### Standalone Components
- No NgModule dependencies
- Tree-shakable and lazy-loadable
- Simplified component architecture

### Reactive Programming
- RxJS for state management and async operations
- Observables for data streams
- Proper subscription cleanup with `takeUntil`

### TypeScript
- Strict type checking enabled
- Interface-driven development
- Generic types for reusability

### Performance
- OnPush change detection strategy
- TrackBy functions for ngFor optimization
- Lazy loading and code splitting ready

### Modern CSS
- CSS Custom Properties for theming
- CSS Grid and Flexbox for layout
- CSS-in-JS avoided in favor of SCSS modules

## 🚀 Usage

```typescript
import { PromptLibraryComponent } from './components/prompt-library/prompt-library.component';

@Component({
  standalone: true,
  imports: [PromptLibraryComponent],
  template: '<app-prompt-library></app-prompt-library>'
})
export class AppComponent {}
```

## 🔧 Development

### Building
```bash
ng build
```

### Testing
```bash
ng test
```

### Linting
```bash
ng lint
```

This implementation provides a modern, accessible, and responsive UI that can be easily integrated into any Angular application.