# PROMPT LIBRARY APPLICATION

This extension provides a modern, web-based interface for browsing and using AI prompts within VSCode. The extension features a clean, responsive UI with advanced search and filtering capabilities.

## Features

### 🎨 Modern WebView Interface
- **Card-based Layout**: Browse prompts in an intuitive grid or list view
- **Advanced Search**: Real-time search across titles, descriptions, categories, and tags
- **Smart Filtering**: Quick filter chips for common technologies and categories
- **Responsive Design**: Adapts to different screen sizes and VSCode themes
- **Dark Theme Integration**: Seamlessly integrates with VSCode's color scheme

### 📚 Prompt Management
- **Detailed View**: Modal dialogs with full prompt content and metadata
- **Quick Actions**: Copy prompts to clipboard or open directly in VSCode editor
- **Category Organization**: Prompts organized by technology, framework, and use case
- **Tag System**: Automatic tag detection for better discoverability

### ⚡ User Experience
- **Fast Loading**: Optimized for quick startup and smooth interactions
- **Keyboard Shortcuts**: 
  - `Ctrl+F` - Focus search input
  - `Escape` - Close modal dialogs
- **Error Handling**: Graceful error states with retry functionality
- **Loading States**: Visual feedback during data fetching

## Usage

### Opening the Prompt Library

1. **Command Palette**: Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and search for `Prompt Library`
2. **Keyboard Shortcut**: Use `Ctrl+Alt+P` to quickly activate the extension

### Browsing Prompts

- **Search**: Type in the search bar to find prompts by title, description, or technology
- **Filter**: Click filter chips to narrow results by specific technologies
- **View Modes**: Toggle between grid and list views using the view toggle buttons

### Using Prompts

- **Quick Copy**: Click "Quick Copy" to copy prompt content to clipboard
- **View Details**: Click "View Details" or click on a card to see full content in a modal
- **Open in Editor**: Use "Open in Editor" to create a new markdown file with the prompt content

## Technical Architecture

The extension uses a modern webview-based architecture with:

- **Clean Separation**: Main extension logic separated from UI components
- **Component-Based Design**: Modular HTML, CSS, and JavaScript components
- **State Management**: Centralized application state with reactive updates
- **API Integration**: Secure communication with the Prompt Library backend
- **Performance Optimized**: Efficient rendering and minimal resource usage

## Development

To contribute to this extension:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run lint` to check code quality
4. Press `F5` in VSCode to start debugging the extension

## Requirements

- VS Code 1.52.0 or higher
- Internet connection for fetching prompts from the library