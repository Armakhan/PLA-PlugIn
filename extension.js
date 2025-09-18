const vscode = require('vscode');
const axios = require('axios');
const https = require('https');
const path = require('path');
const fs = require('fs');

/**
 * Modern Prompt Library Extension with WebView UI
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  https.globalAgent.options.rejectUnauthorized = false;

  // Store the current webview panel
  let currentPanel = undefined;

  // Create the webview panel
  function createWebviewPanel() {
    const panel = vscode.window.createWebviewPanel(
      'promptLibrary',
      'Prompt Library',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'src', 'webview'))
        ]
      }
    );

    panel.webview.html = getWebviewContent(context, panel.webview);
    
    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'fetchArticles':
            try {
              const articles = await fetchArticles();
              panel.webview.postMessage({
                command: 'articlesResponse',
                data: articles
              });
            } catch (error) {
              panel.webview.postMessage({
                command: 'articlesResponse',
                error: error.message
              });
            }
            break;
            
          case 'fetchArticleContent':
            try {
              const content = await fetchArticleContent(message.articleId);
              panel.webview.postMessage({
                command: 'articleContentResponse',
                articleId: message.articleId,
                content: content
              });
            } catch (error) {
              panel.webview.postMessage({
                command: 'articleContentResponse',
                articleId: message.articleId,
                error: error.message
              });
            }
            break;
            
          case 'openInEditor':
            await openContentInEditor(message.content);
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    // Clean up when panel is closed
    panel.onDidDispose(() => {
      currentPanel = undefined;
    }, null, context.subscriptions);

    return panel;
  }

  // Fetch articles from API
  async function fetchArticles() {
    try {
      const response = await axios.get(
        'https://prompt-lib.azurewebsites.net/getAllArticles/1/?getby=approvalid',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'eyJpZCI6MSwiZW1haWwiOiJtb2hhbmlzaC5naGFuc2h5YW0ta2hvdGVsZUBjYXBnZW1pbmkuY29tIiwibmFtZSI6Ik1vaGFuaXNoIEtob3RlbGUifQ==',
          },
        }
      );
      
      return response.data.map((article) => ({
        articleId: article.articleId,
        articleName: article.articleName,
        description: article.description || 'No description available',
        category: article.category || 'General',
        publishedDate: article.publishedDate || new Date().toISOString()
      }));
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to fetch articles: ${error.message}`);
      throw error;
    }
  }

  // Fetch individual article content
  async function fetchArticleContent(articleId) {
    try {
      const response = await axios.get(
        `https://prompt-lib.azurewebsites.net/getArticlesByArticleId/1/${articleId}?q=getapproved`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'eyJpZCI6MSwiZW1haWwiOiJtb2hhbmlzaC5naGFuc2h5YW0ta2hvdGVsZUBjYXBnZW1pbmkuY29tIiwibmFtZSI6Ik1vaGFuaXNoIEtob3RlbGUifQ==',
          },
        }
      );
      
      const articleContent = response.data.data[0];
      return convertToMarkdown(articleContent);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to fetch article content: ${error.message}`);
      throw error;
    }
  }

  // Convert API response to Markdown format
  function convertToMarkdown(apiResponse) {
    let markdown = `# ${apiResponse.articleName || 'Untitled'}\n\n`;
    
    try {
      const descriptionArray = JSON.parse(apiResponse.description);
      if (descriptionArray && descriptionArray.length > 0) {
        descriptionArray.forEach((component) => {
          if (component.Prompt) {
            markdown += `## Prompt\n\n**${component.Prompt}**\n\n`;
          }
          if (component.PromptDesc) {
            markdown += `### Description\n\n${component.PromptDesc}\n\n`;
          }
          if (component.Code) {
            markdown += `### Code\n\n\`\`\`\n${component.Code}\n\`\`\`\n\n`;
          }
        });
      }
    } catch (e) {
      // Fallback if description is not valid JSON
      if (apiResponse.description) {
        markdown += `${apiResponse.description}\n\n`;
      }
    }
    
    return markdown;
  }

  // Open content in VS Code editor
  async function openContentInEditor(content) {
    try {
      const document = await vscode.workspace.openTextDocument({
        content: typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        language: 'markdown'
      });
      
      await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open in editor: ${error.message}`);
    }
  }

  // Register the command to open the prompt library
  const disposable = vscode.commands.registerCommand(
    'prompt-library.prompt-library',
    () => {
      if (currentPanel) {
        // If panel already exists, just show it
        currentPanel.reveal(vscode.ViewColumn.One);
      } else {
        // Create new panel
        currentPanel = createWebviewPanel();
      }
    }
  );

  context.subscriptions.push(disposable);
}

// Generate the HTML content for the webview
function getWebviewContent(context, webview) {
  // Get file paths for webview resources
  const htmlPath = path.join(context.extensionPath, 'src', 'webview', 'index.html');
  const cssPath = path.join(context.extensionPath, 'src', 'webview', 'styles.css');
  const jsPath = path.join(context.extensionPath, 'src', 'webview', 'app.js');

  // Read the HTML file
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Convert CSS and JS to webview URIs
  const cssUri = webview.asWebviewUri(vscode.Uri.file(cssPath));
  const jsUri = webview.asWebviewUri(vscode.Uri.file(jsPath));

  // Replace the resource links in HTML
  html = html.replace('href="styles.css"', `href="${cssUri}"`);
  html = html.replace('src="app.js"', `src="${jsUri}"`);

  // Add VS Code specific CSP
  html = html.replace(
    '<meta http-equiv="Content-Security-Policy"',
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https: data:;"`
  );

  return html;
}

exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
