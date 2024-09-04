const vscode = require('vscode');
const axios = require('axios');
const https = require('https');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  https.globalAgent.options.rejectUnauthorized = false;

  let authToken = null;

  async function signIn() {
    const username = await vscode.window.showInputBox({
      prompt: 'Enter your username',
    });
    const password = await vscode.window.showInputBox({
      prompt: 'Enter your password',
      password: true,
    });

    if (!username || !password) {
      vscode.window.showErrorMessage('Username and password are required');
      return;
    }

    try {
      const response = await axios.post(
        'https://jsonplaceholder.typicode.com/posts',
        { username, password }
      );
      authToken = response.data.token;
      vscode.window.showInformationMessage('Sign-in successful');
    } catch (error) {
      vscode.window.showErrorMessage('Sign-in failed: ' + error.message);
    }
  }

  async function fetchArticles() {
    if (!authToken) {
      await signIn();
      if (!authToken) return;
    }

    try {
      const res = await axios.get(
        'https://prompt-lib.azurewebsites.net/articles',
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return res.data.map((article) => {
        return {
          label: article.title,
          link: article.id,
        };
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        'Failed to fetch articles: ' + error.message
      );
      return [];
    }
  }

  function convertToMarkdown(apiResponse) {
    let markdown = `# ${apiResponse.title}\n\n`;

    const descriptionArray = JSON.parse(apiResponse.description);
    if (descriptionArray.length > 0) {
      descriptionArray.forEach((component) => {
        markdown += `## Description\n\n`;
        markdown += `**Prompt:** ${component.Prompt}\n\n`;
        markdown += `**Prompt Description:** ${component.PromptDesc}\n\n`;
        markdown += `**Code:** ${component.Code}\n\n`;
      });
      markdown += '\n';
    }

    return markdown;
  }

  let disposable = vscode.commands.registerCommand(
    'prompt-library.prompt-library',
    async function () {
      const articles = await fetchArticles();
      if (articles.length === 0) return;

      const article = await vscode.window.showQuickPick(articles, {
        matchOnDetail: true,
      });

      if (article == null) return;

      try {
        const articleContentResponse = await axios.get(
          'https://prompt-lib.azurewebsites.net/get-article/' + article.link,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        const articleContent = articleContentResponse.data[0];
        const markdownContent = convertToMarkdown(articleContent);

        const document = await vscode.workspace.openTextDocument({
          content: markdownContent,
          language: 'markdown',
        });

        await vscode.window.showTextDocument(
          document,
          vscode.ViewColumn.Beside
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          'Failed to fetch article content: ' + error.message
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
