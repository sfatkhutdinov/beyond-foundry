// scripts/auto-create-issues.js
// Automates GitHub issue creation for TODO/FIXME and parser errors
// Usage: node scripts/auto-create-issues.js

import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const REPO_OWNER = 'sfatkhutdinov';
const REPO_NAME = 'beyond-foundry';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable not set.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Utility: Find actionable/tagged TODO/FIXME in codebase, skip trivial notes
// Only match TODO/FIXME with a tag, e.g. TODO(ISSUE), TODO: [tag], TODO: description
// Also add a unique hash for deduplication
function hashTodo(todo) {
  // Hash file, line, and text for uniqueness
  return crypto.createHash('sha1').update(`${todo.file}:${todo.line}:${todo.text}`).digest('hex');
}

function findTodos(dir, results = []) {
  const actionableRegex = /\b(?:TODO|FIXME)\b\s*(?:\([^)]+\)|:[^\w]?|\[[^\]]+\]|\s+.+)/i;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findTodos(fullPath, results);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (actionableRegex.test(line)) {
          const todo = { file: fullPath, line: idx + 1, text: line.trim() };
          todo.hash = hashTodo(todo);
          results.push(todo);
        }
      });
    }
  }
  return results;
}

// Utility: Parse parser-test-results for errors
function findParserErrors() {
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '../parser-test-results');
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

// Utility: Find TODO hashes in open issues
async function getOpenTodoIssueHashes() {
  const { data: issues } = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100
  });
  const hashToIssue = {};
  for (const issue of issues) {
    const match = issue.body && issue.body.match(/<!-- AUTO-TODO-HASH: ([a-f0-9]{40}) -->/);
    if (match) hashToIssue[match[1]] = issue.number;
  }
  return hashToIssue;
}

// Utility: Label issues based on file path/content
function getLabelsForTodo(todo) {
  const labels = ['auto', 'todo'];
  // Example: label by directory
  if (todo.file.includes('/parsers/')) labels.push('parser');
  if (todo.file.includes('/module/')) labels.push('module');
  if (todo.file.includes('/types/')) labels.push('types');
  // Example: label by TODO type
  if (/FIXME/.test(todo.text)) labels.push('fixme');
  // Add more rules as needed
  return labels;
}

// Utility: Get CODEOWNERS for a file (if present)
function getCodeOwnerForFile(filePath) {
  const codeownersPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../.github/CODEOWNERS');
  if (!fs.existsSync(codeownersPath)) return null;
  const lines = fs.readFileSync(codeownersPath, 'utf8').split('\n');
  for (const line of lines) {
    const [pattern, owner] = line.trim().split(/\s+/);
    if (!pattern || !owner) continue;
    // Simple glob match (could be improved)
    if (filePath.includes(pattern.replace('*', ''))) return owner.replace('@', '');
  }
  return null;
}

// Main: Create issues for TODO/FIXME with deduplication by hash, contextual labels, and assignment
async function createTodoIssues() {
  const todos = findTodos(path.join(path.dirname(new URL(import.meta.url).pathname), '../src'));
  const { data: issues } = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'open',
    per_page: 100
  });
  const existingHashes = new Set();
  for (const issue of issues) {
    const match = issue.body && issue.body.match(/<!-- AUTO-TODO-HASH: ([a-f0-9]{40}) -->/);
    if (match) existingHashes.add(match[1]);
  }
  for (const todo of todos) {
    if (!existingHashes.has(todo.hash)) {
      const title = `[AUTO] ${todo.text}`;
      const body = `Found in ${todo.file} at line ${todo.line}\n\n<!-- AUTO-TODO-HASH: ${todo.hash} -->`;
      const labels = getLabelsForTodo(todo);
      let assignees = [];
      const codeowner = getCodeOwnerForFile(todo.file);
      if (codeowner) assignees.push(codeowner);
      await octokit.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title,
        body,
        labels,
        assignees
      });
      console.log('Created issue:', title, labels, assignees);
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

// Utility: Update closed TODO issues with PR link if closed by PR
async function closeResolvedTodoIssues() {
  const todos = findTodos(path.join(path.dirname(new URL(import.meta.url).pathname), '../src'));
  const currentHashes = new Set(todos.map(t => t.hash));
  const hashToIssue = await getOpenTodoIssueHashes();
  for (const hash in hashToIssue) {
    if (!currentHashes.has(hash)) {
      // TODO was removed, close the issue
      // Try to find a PR that closed this issue (optional, best effort)
      let closingPr = null;
      try {
        const { data: events } = await octokit.issues.listEvents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          issue_number: hashToIssue[hash],
        });
        const closedByPr = events.find(e => e.event === 'closed' && e.commit_id);
        if (closedByPr) closingPr = closedByPr.commit_id;
      } catch {}
      await octokit.issues.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: hashToIssue[hash],
        state: 'closed'
      });
      if (closingPr) {
        await octokit.issues.createComment({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          issue_number: hashToIssue[hash],
          body: `Closed by commit/PR: ${closingPr}`
        });
      }
      console.log('Closed resolved TODO issue:', hashToIssue[hash]);
    }
  }
}

// Utility: Find new TODOs in a PR diff (for workflow usage)
// This is a stub for future GitHub Actions integration
async function findNewTodosInPR(prNumber) {
  // This would use octokit.pulls.listFiles and compare with main branch
  // For now, just a placeholder for workflow integration
  return [];
}

// Optionally: Comment on PR if new TODOs are introduced (for workflow usage)
async function commentOnPRIfNewTodos(prNumber, newTodos) {
  if (newTodos.length === 0) return;
  const body = `:warning: New TODOs/FIXMEs detected in this PR!\n\n` +
    newTodos.map(t => `- ${t.text} (${t.file}:${t.line})`).join('\n');
  await octokit.issues.createComment({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    issue_number: prNumber,
    body
  });
}

// Utility: Append closed TODO/FIXME issues to CHANGELOG.md
async function appendClosedTodosToChangelog() {
  // Get recently closed issues with [AUTO] in the title and a TODO hash
  const { data: issues } = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'closed',
    per_page: 50,
    sort: 'updated',
    direction: 'desc'
  });
  const closedTodos = issues.filter(issue =>
    issue.title.startsWith('[AUTO]') &&
    /<!-- AUTO-TODO-HASH: [a-f0-9]{40} -->/.test(issue.body || '') &&
    new Date(issue.closed_at) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // last 2 days
  );
  if (closedTodos.length === 0) return;
  const changelogPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../CHANGELOG.md');
  let changelog = fs.readFileSync(changelogPath, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  // Find the most recent release section (## [x.x.x] ...)
  const releaseHeaderIdx = changelog.indexOf('## [');
  if (releaseHeaderIdx === -1) return; // fallback: do nothing
  // Find the next section after the release header
  const nextSectionIdx = changelog.indexOf('## [', releaseHeaderIdx + 1);
  const insertIdx = nextSectionIdx !== -1 ? nextSectionIdx : changelog.length;
  // Build the section
  let section = `\n### ✅ Resolved TODOs/FIXMEs (${today})\n`;
  for (const issue of closedTodos) {
    section += `- ${issue.title.replace('[AUTO] ', '')} (closed #${issue.number})\n`;
  }
  // Insert the section after the most recent release
  changelog = changelog.slice(0, insertIdx) + section + changelog.slice(insertIdx);
  fs.writeFileSync(changelogPath, changelog, 'utf8');
  console.log('Appended closed TODOs to CHANGELOG.md');
}

// Utility: Generate a summary markdown file of all open TODOs/FIXMEs
async function generateTodoSummary() {
  const todos = findTodos(path.join(path.dirname(new URL(import.meta.url).pathname), '../src'));
  if (!todos.length) return;
  // Group by label
  const grouped = {};
  for (const todo of todos) {
    const labels = getLabelsForTodo(todo);
    for (const label of labels) {
      if (!grouped[label]) grouped[label] = [];
      grouped[label].push(todo);
    }
  }
  let summary = `# TODO/FIXME Summary Dashboard\n\n`;
  summary += `This file is automatically generated by the automation script.\n\n`;
  summary += `## Open TODOs/FIXMEs (as of ${new Date().toISOString().slice(0, 10)})\n`;
  for (const label of Object.keys(grouped).sort()) {
    summary += `\n### ${label}\n`;
    for (const todo of grouped[label]) {
      summary += `- ${todo.text}  
  _at ${todo.file.replace(process.cwd() + '/', '')}: line ${todo.line}_\n`;
    }
  }
  const summaryPath = path.join(path.dirname(new URL(import.meta.url).pathname), '../TODO_SUMMARY.md');
  fs.writeFileSync(summaryPath, summary, 'utf8');
  console.log('Updated TODO_SUMMARY.md');
}

// Call this at the end of the script
(async () => {
  await createTodoIssues();
  await closeResolvedTodoIssues();
  await createParserErrorIssues();
  await appendClosedTodosToChangelog();
  await generateTodoSummary();
})();
