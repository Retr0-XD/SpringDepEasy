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
          vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview'))
        ]
      }
    );

    // Set webview content 
    updateWebviewContent(context, panel);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'addDependency':
            await addDependencyToPom(message.dependency);
            vscode.window.showInformationMessage(`Added ${message.dependency.artifactId} to pom.xml`);
            return;
          case 'init':
            // The webview is requesting the initial state
            panel.webview.postMessage({ 
              command: 'setState',
              backendUrl: 'http://localhost:8080' // Will configure later based on settings
            });
            return;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  // Register command to remove a dependency
  let removeDependencyCommand = vscode.commands.registerCommand('springdepeasy.removeDependency', async () => {
    // Find the pom.xml
    const pomPath = await findPomXml();
    if (!pomPath) {
      vscode.window.showErrorMessage('No pom.xml found in the workspace.');
      return;
    }

    try {
      // Read and parse pom.xml
      const pomContent = fs.readFileSync(pomPath, 'utf-8');
      const parser = new xml2js.Parser();
      const pomXml = await parser.parseStringPromise(pomContent);

      // Check if dependencies section exists
      if (!pomXml.project.dependencies || !pomXml.project.dependencies[0].dependency) {
        vscode.window.showInformationMessage('No dependencies found in pom.xml.');
        return;
      }

      // Extract dependencies for display
      const dependencies = pomXml.project.dependencies[0].dependency.map((dep: any) => {
        return {
          groupId: dep.groupId[0],
          artifactId: dep.artifactId[0],
          version: dep.version ? dep.version[0] : 'N/A',
          label: `${dep.groupId[0]}:${dep.artifactId[0]}:${dep.version ? dep.version[0] : 'N/A'}`
        };
      });

      // Show quickpick to select dependency to remove
      const selected = await vscode.window.showQuickPick(
        dependencies.map(dep => dep.label),
        { placeHolder: 'Select a dependency to remove' }
      );

      if (selected) {
        // Find the selected dependency
        const dependency = dependencies.find(dep => dep.label === selected);
        if (dependency) {
          // Remove the dependency
          pomXml.project.dependencies[0].dependency = pomXml.project.dependencies[0].dependency.filter(
            (dep: any) => !(dep.groupId[0] === dependency.groupId && dep.artifactId[0] === dependency.artifactId)
          );

          // Write back to pom.xml
          const builder = new xml2js.Builder();
          const updatedPomContent = builder.buildObject(pomXml);
          fs.writeFileSync(pomPath, updatedPomContent);

          vscode.window.showInformationMessage(`Removed ${dependency.artifactId} from pom.xml`);
        }
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Error removing dependency: ${error}`);
    }
  });

  // Register command to manage dependencies
  let manageDependenciesCommand = vscode.commands.registerCommand('springdepeasy.manageDependencies', () => {
    const panel = vscode.window.createWebviewPanel(
      'springDepEasy',
      'SpringDepEasy: Manage Dependencies',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview'))
        ]
      }
    );

    // Set webview content 
    updateWebviewContent(context, panel);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'addDependency':
            await addDependencyToPom(message.dependency);
            vscode.window.showInformationMessage(`Added ${message.dependency.artifactId} to pom.xml`);
            return;
          case 'removeDependency':
            await removeDependencyFromPom(message.dependency);
            vscode.window.showInformationMessage(`Removed ${message.dependency.artifactId} from pom.xml`);
            return;
          case 'init':
            // The webview is requesting the initial state
            panel.webview.postMessage({ 
              command: 'setState',
              backendUrl: 'http://localhost:8080'
            });
            return;
        }
      },
      undefined,
      context.subscriptions
    );
  });

  context.subscriptions.push(addDependencyCommand);
  context.subscriptions.push(removeDependencyCommand);
  context.subscriptions.push(manageDependenciesCommand);
}

// Updates the webview content
function updateWebviewContent(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): void {
  // Find the built webview content
  const webviewDistPath = path.join(context.extensionPath, 'dist', 'webview');
  
  // Check if webview is built
  if (fs.existsSync(webviewDistPath) && fs.existsSync(path.join(webviewDistPath, 'index.html'))) {
    try {
      // Read the built HTML
      const indexHtml = fs.readFileSync(path.join(webviewDistPath, 'index.html'), 'utf-8');
      
      // Get base URI for webview resources
      const baseUri = panel.webview.asWebviewUri(vscode.Uri.file(webviewDistPath));
      
      // Update resource paths to use VS Code webview URIs
      const updatedHtml = indexHtml
        .replace(/(src|href)="(?!http|#|data:)(.*?)"/g, (match, attr, url) => {
          return `${attr}="${baseUri}/${url}"`;
        });
      
      panel.webview.html = updatedHtml;
      
    } catch (error) {
      console.error('Error loading webview HTML:', error);
      panel.webview.html = getPlaceholderWebviewContent();
    }
  } else {
    // Use placeholder content during development
    panel.webview.html = getPlaceholderWebviewContent();
  }
}

// Returns a placeholder webview content
function getPlaceholderWebviewContent(): string {
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
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #4CAF50;
          margin-top: 0;
        }
        .card {
          border: 1px solid #e0e0e0;
          padding: 16px;
          margin-bottom: 16px;
          border-radius: 4px;
          background-color: #fff;
        }
        .card h3 {
          margin-top: 0;
        }
        .desc {
          color: #666;
          margin-bottom: 8px;
        }
        .button {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .button:hover {
          background-color: #3e8e41;
        }
        .search {
          width: 100%;
          padding: 8px;
          margin-bottom: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SpringDepEasy</h1>
        <p>Search for Spring Boot dependencies and add them to your project.</p>
        
        <input type="text" class="search" placeholder="Search dependencies (e.g., web, jpa, security)">
        
        <div class="card">
          <h3>spring-boot-starter-web</h3>
          <div class="desc">org.springframework.boot:spring-boot-starter-web:3.1.0</div>
          <p>Starter for building web applications with Spring MVC</p>
          <button class="button">Add Dependency</button>
        </div>
        
        <div class="card">
          <h3>spring-boot-starter-data-jpa</h3>
          <div class="desc">org.springframework.boot:spring-boot-starter-data-jpa:3.1.0</div>
          <p>Starter for using Spring Data JPA with Hibernate</p>
          <button class="button">Add Dependency</button>
        </div>
        
        <p><i>The React-based UI will be integrated in Week 5.</i></p>
      </div>
    </body>
    </html>
  `;
}

// Find pom.xml in the current workspace
async function findPomXml(): Promise<string | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return undefined;
  }

  const pomFiles = await vscode.workspace.findFiles('**/pom.xml', '**/node_modules/**');
  if (pomFiles.length === 0) {
    return undefined;
  }

  if (pomFiles.length === 1) {
    return pomFiles[0].fsPath;
  }

  // If multiple pom.xml files found, ask the user to select one
  const items = pomFiles.map(file => {
    const relativePath = vscode.workspace.asRelativePath(file);
    return {
      label: relativePath,
      description: file.fsPath,
      file
    };
  });

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a pom.xml file'
  });

  return selected ? selected.file.fsPath : undefined;
}

// Add a dependency to the pom.xml
async function addDependencyToPom(dependency: any): Promise<void> {
  try {
    // Find the pom.xml file
    const pomPath = await findPomXml();
    if (!pomPath) {
      vscode.window.showErrorMessage('No pom.xml found in the workspace.');
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

    // Check if dependency already exists
    const existingDep = pomXml.project.dependencies[0].dependency?.find(
      (dep: any) => 
        dep.groupId[0] === dependency.groupId && 
        dep.artifactId[0] === dependency.artifactId
    );

    if (existingDep) {
      // Update version if provided
      if (dependency.version) {
        existingDep.version = [dependency.version];
        vscode.window.showInformationMessage(
          `Updated ${dependency.artifactId} to version ${dependency.version}`
        );
      } else {
        vscode.window.showInformationMessage(
          `Dependency ${dependency.artifactId} already exists in pom.xml`
        );
      }
    } else {
      // Add new dependency
      const newDep: any = {
        groupId: [dependency.groupId],
        artifactId: [dependency.artifactId]
      };
      
      if (dependency.version) {
        newDep.version = [dependency.version];
      }
      
      if (dependency.scope) {
        newDep.scope = [dependency.scope];
      }
      
      if (!pomXml.project.dependencies[0].dependency) {
        pomXml.project.dependencies[0].dependency = [];
      }
      
      pomXml.project.dependencies[0].dependency.push(newDep);
    }

    // Convert back to XML and write to file
    const builder = new xml2js.Builder();
    const updatedPomContent = builder.buildObject(pomXml);
    fs.writeFileSync(pomPath, updatedPomContent);

  } catch (error) {
    vscode.window.showErrorMessage(`Error adding dependency: ${error}`);
  }
}

// Remove a dependency from the pom.xml
async function removeDependencyFromPom(dependency: any): Promise<void> {
  try {
    // Find the pom.xml file
    const pomPath = await findPomXml();
    if (!pomPath) {
      vscode.window.showErrorMessage('No pom.xml found in the workspace.');
      return;
    }

    // Read and parse pom.xml
    const pomContent = fs.readFileSync(pomPath, 'utf-8');
    const parser = new xml2js.Parser();
    const pomXml = await parser.parseStringPromise(pomContent);

    // Check if dependencies section exists
    if (!pomXml.project.dependencies || !pomXml.project.dependencies[0].dependency) {
      vscode.window.showInformationMessage('No dependencies found in pom.xml.');
      return;
    }

    // Find and remove the dependency
    const initialLength = pomXml.project.dependencies[0].dependency.length;
    pomXml.project.dependencies[0].dependency = pomXml.project.dependencies[0].dependency.filter(
      (dep: any) => !(dep.groupId[0] === dependency.groupId && dep.artifactId[0] === dependency.artifactId)
    );

    if (pomXml.project.dependencies[0].dependency.length === initialLength) {
      vscode.window.showInformationMessage(
        `Dependency ${dependency.artifactId} not found in pom.xml`
      );
      return;
    }

    // Convert back to XML and write to file
    const builder = new xml2js.Builder();
    const updatedPomContent = builder.buildObject(pomXml);
    fs.writeFileSync(pomPath, updatedPomContent);

  } catch (error) {
    vscode.window.showErrorMessage(`Error removing dependency: ${error}`);
  }
}

export function deactivate() {}