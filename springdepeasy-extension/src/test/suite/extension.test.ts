import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('SpringDepEasy Extension Tests', () => {
  vscode.window.showInformationMessage('Starting SpringDepEasy tests');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('springdepeasy.springdepeasy'));
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    const springDepEasyCommands = commands.filter(cmd => cmd.startsWith('springdepeasy.'));
    
    assert.ok(springDepEasyCommands.includes('springdepeasy.addDependency'));
    assert.ok(springDepEasyCommands.includes('springdepeasy.removeDependency'));
    assert.ok(springDepEasyCommands.includes('springdepeasy.manageDependencies'));
  });

  // More tests will be added in Week 7
});