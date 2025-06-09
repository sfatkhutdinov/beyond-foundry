// scripts/auto-release.js
// Builds, zips, and creates a GitHub release with the latest module
// Usage: node scripts/auto-release.js

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const archiver = require('archiver');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'sfatkhutdinov'; // Based on module.json author
const REPO_NAME = 'beyond-foundry';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable not set.');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// Step 1: Build the module
console.log('Running build...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Collect files to zip
const filesToInclude = [
  'module.json',
  'build/',
  'data/',
  'lang/',
  'templates/',
  'README.md',
  'CHANGELOG.md',
];
const zipName = `beyond-foundry-latest.zip`;
const output = fs.createWriteStream(zipName);
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`Created zip: ${zipName} (${archive.pointer()} bytes)`);
  createRelease();
});

archive.on('error', err => { throw err; });
archive.pipe(output);

for (const item of filesToInclude) {
  const fullPath = path.join(__dirname, '..', item);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      archive.directory(fullPath, item);
    } else {
      archive.file(fullPath, { name: item });
    }
  }
}
archive.finalize();

// Step 3: Read version from module.json
function getVersion() {
  const mod = JSON.parse(fs.readFileSync(path.join(__dirname, '../module.json'), 'utf8'));
  return mod.version || 'latest';
}

// Step 4: Create GitHub release and upload zip
async function createRelease() {
  const version = getVersion();
  const tag = `v${version}`;
  // Check if release already exists
  try {
    await octokit.repos.getReleaseByTag({ owner: REPO_OWNER, repo: REPO_NAME, tag });
    console.log('Release already exists for this version.');
    return;
  } catch {
    // Release not found, continue with creation
  }
  // Create release
  const release = await octokit.repos.createRelease({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    tag_name: tag,
    name: `Beyond Foundry ${version}`,
    body: `Automated release for version ${version}`,
    draft: false,
    prerelease: false
  });
  // Upload asset
  const asset = fs.readFileSync(zipName);
  await octokit.repos.uploadReleaseAsset({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    release_id: release.data.id,
    name: zipName,
    data: asset,
    headers: {
      'content-type': 'application/zip',
      'content-length': asset.length
    }
  });
  console.log('Release created and asset uploaded.');
}
