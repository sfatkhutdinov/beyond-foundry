// scripts/auto-create-issues.js
// Automates GitHub issue creation for TODO/FIXME and parser errors
// Usage: node scripts/auto-create-issues.js

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const REPO_OWNER = 'sfatkhutdinov';
const REPO_NAME = 'beyond-foundry';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable not set.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Utility: Find TODO/FIXME in codebase
function findTodos(dir, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findTodos(fullPath, results);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (/TODO|FIXME/.test(line)) {
          results.push({ file: fullPath, line: idx + 1, text: line.trim() });
        }
      });
    }
  }
  return results;
}

// Utility: Parse parser-test-results for errors
function findParserErrors() {
  const dir = path.join(__dirname, '../parser-test-results');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  let errors = [];
  for (const file of files) {
    if (file.endsWith('.json')) {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      if (data.errors && Array.isArray(data.errors)) {
        errors = errors.concat(data.errors.map(e => ({ file, ...e })));
      }
    }
  }
  return errors;
}

// Utility: Check if issue already exists
async function issueExists(title) {
  const { data: issues } = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100
  });
  return issues.some(issue => issue.title === title);
}

// Main: Create issues for TODO/FIXME
async function createTodoIssues() {
  const todos = findTodos(path.join(__dirname, '../src'));
  for (const todo of todos) {
    const title = `[AUTO] ${todo.text}`;
    if (!(await issueExists(title))) {
      await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title,
        body: `Found in ${todo.file} at line ${todo.line}`,
        labels: ['auto', 'todo']
      });
      console.log('Created issue:', title);
    }
  }
}

// Main: Create issues for parser errors
async function createParserErrorIssues() {
  const errors = findParserErrors();
  for (const error of errors) {
    const title = `[AUTO] Parser Error: ${error.message || error.type || 'Unknown'}`;
    if (!(await issueExists(title))) {
      await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title,
        body: `Error in ${error.file}:\n\n${JSON.stringify(error, null, 2)}`,
        labels: ['auto', 'parser-error']
      });
      console.log('Created issue:', title);
    }
  }
}

(async () => {
  await createTodoIssues();
  await createParserErrorIssues();
})();
