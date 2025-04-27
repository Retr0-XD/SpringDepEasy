import * as vscode from 'vscode';
import * as path from 'path';
import * as xml2js from 'xml2js';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
  console.log('SpringDepEasy extension is now active!');

  // Register command to add a dependency
  let addDependencyCommand = vscode.commands.registerCommand('springdepeasy.addDependency', () => {
    const panel = vscode.window.createWebviewPanel(
      'springDepEasy',
      'SpringDepEasy: Add Dependency',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))
        ]
      }
    );

    // Set webview content 
    panel.webview.html = getWebviewContent(context, panel.webview);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'addDependency':
            await addDependencyToPom(message.dependency);
            vscode.window.showInformationMessage(`Added ${message.dependency.artifactId} to pom.xml`);
            return;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  // Register command to remove a dependency
  let removeDependencyCommand = vscode.commands.registerCommand('springdepeasy.removeDependency', async () => {
    // Implementation will go here in Week 4
    vscode.window.showInformationMessage('Remove Dependency command triggered');
  });

  // Register command to manage dependencies
  let manageDependenciesCommand = vscode.commands.registerCommand('springdepeasy.manageDependencies', () => {
    // Implementation will go here in Week 6
    vscode.window.showInformationMessage('Manage Dependencies command triggered');
  });

  context.subscriptions.push(addDependencyCommand);
  context.subscriptions.push(removeDependencyCommand);
  context.subscriptions.push(manageDependenciesCommand);
}

// This function will be expanded in Week 4
function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview): string {
  // For now, just return a simple HTML page
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SpringDepEasy</title>
      <style>
        body {
          padding: 20px;
          font-family: sans-serif;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
        }
        h1 {
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SpringDepEasy</h1>
        <p>Search for Spring Boot dependencies and add them to your project.</p>
        <p>This is a placeholder UI. The React-based UI will be integrated in Week 5.</p>
      </div>
    </body>
    </html>
  `;
}

// This function will be expanded in Week 4
async function addDependencyToPom(dependency: any): Promise<void> {
  try {
    // Find the pom.xml file in the workspace
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder found. Please open a project.');
      return;
    }

    const pomPath = path.join(workspaceFolders[0].uri.fsPath, 'pom.xml');
    
    // Check if pom.xml exists
    if (!fs.existsSync(pomPath)) {
      vscode.window.showErrorMessage('No pom.xml found in the workspace root.');
      return;
    }

    // Read and parse pom.xml
    const pomContent = fs.readFileSync(pomPath, 'utf-8');
    const parser = new xml2js.Parser();
    const pomXml = await parser.parseStringPromise(pomContent);

    // Check if dependencies section exists, if not create it
    if (!pomXml.project.dependencies) {
      pomXml.project.dependencies = [{ dependency: [] }];
    }

    // Add new dependency
    pomXml.project.dependencies[0].dependency.push({
      groupId: dependency.groupId,
      artifactId: dependency.artifactId,
      version: dependency.version
    });

    // Convert back to XML and write to file
    const builder = new xml2js.Builder();
    const updatedPomContent = builder.buildObject(pomXml);
    fs.writeFileSync(pomPath, updatedPomContent);

  } catch (error) {
    vscode.window.showErrorMessage(`Error adding dependency: ${error}`);
  }
}

export function deactivate() {}