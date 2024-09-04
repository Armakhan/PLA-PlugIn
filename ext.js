const vscode = require('vscode');
const axios = require('axios');
const https = require('https');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  https.globalAgent.options.rejectUnauthorized = false;
  const res = await axios.get('https://prompt-lib.azurewebsites.net/articles');
  const articles = res.data.map((article) => {
    return {
      label: article.title,
      //detail: article.description,
      link: article.id,
    };
  });

  // Function to format ISO date string to a readable format
  // function formatDate(dateString) {
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString('en-US', {
  //     year: 'numeric',
  //     month: 'short',
  //     day: 'numeric',
  //   });
  // }

  // Function to convert API response to Markdown format
  function convertToMarkdown(apiResponse) {
    let markdown = `# ${apiResponse.title}\n\n`;
    // markdown += `**Tool:** ${apiResponse.AiTool}\n\n`;
    // markdown += `**Category:** ${apiResponse.Category}\n\n`;
    // markdown += `**SubCategory:** ${apiResponse.SubCategory}\n\n`;
    // markdown += `**Published:** ${apiResponse.isPublished ? 'true' : 'false'}\n\n`;
    // markdown += `**Published By:** ${apiResponse.publishedBy}\n\n`;
    // markdown += `**Published Date:** ${formatDate(apiResponse.publishedDate)}\n\n`;
    // markdown += `**Last Updated By:** ${apiResponse.lastUpdatedBy}\n\n`;
    // markdown += `**Last Updated Date:** ${formatDate(apiResponse.updatedDate)}\n\n`;

    // Extracting description from JSON string
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
      const article = await vscode.window.showQuickPick(articles, {
        matchOnDetail: true,
      });

      // if (article == null) return;
      // vscode.env.openExternal(
      //   'https://prompt-lib.azurewebsites.net/get-article/' + article.link
      // );
      // console.log(article.id);

      //==================================================================================//
      if (article == null) return;

      const articleContentResponse = await axios.get(
        'https://prompt-lib.azurewebsites.net/get-article/' + article.link
      );
      const articleContent = articleContentResponse.data[0]; // Assuming the content is in the 'content' field, change this as needed
      console.log(articleContent);
      // Generate Markdown content
      const markdownContent = convertToMarkdown(articleContent);

      // Create a new untitled document with the article content
      const document = await vscode.workspace.openTextDocument({
        content: markdownContent,
        language: 'markdown', // Assuming the content is in Markdown format, change this as needed
      });

      // Show the document in a new editor tab
      await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
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
