// scripts/pr-todo-detect.js
// Detects new actionable TODO/FIXME comments introduced in a PR and comments on the PR if any are found
import { Octokit } from '@octokit/rest';
import crypto from 'crypto';

const GITHUB_TOKEN = process.env.GH_PAT || process.env.GITHUB_TOKEN;
const REPO_OWNER = 'sfatkhutdinov';
const REPO_NAME = 'beyond-foundry';
const PR_NUMBER = process.env.PR_NUMBER;
const BASE_REF = process.env.BASE_REF;
const HEAD_REF = process.env.HEAD_REF;

if (!GITHUB_TOKEN || !PR_NUMBER || !BASE_REF || !HEAD_REF) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

function hashTodo(todo) {
  return crypto.createHash('sha1').update(`${todo.file}:${todo.line}:${todo.text}`).digest('hex');
}

function findTodosInContent(content, file) {
  const actionableRegex = /\b(?:TODO|FIXME)\b\s*(?:\([^)]+\)|:[^\w]?|\[[^\]]+\]|\s+.+)/i;
  const lines = content.split('\n');
  const todos = [];
  lines.forEach((line, idx) => {
    if (actionableRegex.test(line)) {
      const todo = { file, line: idx + 1, text: line.trim() };
      todo.hash = hashTodo(todo);
      todos.push(todo);
    }
  });
  return todos;
}

async function getChangedFiles() {
  const { data: files } = await octokit.pulls.listFiles({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    pull_number: PR_NUMBER
  });
  // Support more file types for TODO/FIXME detection
  const supportedExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.cjs', '.mjs', '.py', '.sh', '.md'
  ];
  return files.filter(f => supportedExtensions.some(ext => f.filename.endsWith(ext)));
}

// Fuzzy matching for edited TODOs (Levenshtein distance <= 5)
function fuzzyMatch(hash, hashes, todos, threshold = 5) {
  for (const t of todos) {
    if (levenshtein(hash, t.hash) <= threshold) return true;
  }
  return false;
}

// Levenshtein distance implementation
function levenshtein(a, b) {
  if (a === b) return 0;
  const matrix = Array.from({ length: a.length + 1 }, () => []);
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

async function getFileContent(ref, file) {
  const { data } = await octokit.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: file,
    ref
  });
  if (data.type === 'file') {
    return Buffer.from(data.content, data.encoding).toString('utf8');
  }
  return '';
}

async function main() {
  const changedFiles = await getChangedFiles();
  let newTodos = [];
  for (const file of changedFiles) {
    const baseContent = await getFileContent(BASE_REF, file.filename);
    const headContent = await getFileContent(HEAD_REF, file.filename);
    const baseTodos = findTodosInContent(baseContent, file.filename);
    const baseHashes = baseTodos.map(t => t.hash);
    const headTodos = findTodosInContent(headContent, file.filename);
    for (const todo of headTodos) {
      // If not an exact match, check for fuzzy match
      if (!baseHashes.includes(todo.hash) && !fuzzyMatch(todo.hash, baseHashes, baseTodos)) {
        newTodos.push(todo);
      }
    }
  }
  if (newTodos.length > 0) {
    const body = `:warning: New actionable TODOs/FIXMEs detected in this PR!\n\n` +
      newTodos.map(t => `- ${t.text} (_${t.file}: line ${t.line}_)`).join('\n');
    await octokit.issues.createComment({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      issue_number: PR_NUMBER,
      body
    });
    console.log('Commented on PR with new TODOs.');
    process.exit(1); // Optionally fail the check if new TODOs are found
  } else {
    console.log('No new actionable TODOs/FIXMEs detected.');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
