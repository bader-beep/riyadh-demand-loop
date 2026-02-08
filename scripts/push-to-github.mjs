import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

let connectionSettings;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

const OWNER = 'bader-beep';
const REPO = 'riyadh-demand-loop';
const BRANCH = 'main';
const COMMIT_MSG = 'feat: Apple-inspired design system — Inter+Cairo fonts, CSS variable theming, dark mode, RTL layout, design tokens';

const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', '.cache', 'dist', '.replit', '.upm', '.config', '.local', '__pycache__', '.pythonlibs']);
const IGNORE_FILES = new Set(['.replit', 'replit.nix']);

function collectFiles(dir, base = '') {
  const results = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    if (entry.name.startsWith('.replit')) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (IGNORE_FILES.has(entry.name)) continue;
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...collectFiles(path.join(dir, entry.name), relPath));
    } else if (entry.isFile()) {
      results.push(relPath);
    }
  }
  return results;
}

function isBinary(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.otf', '.db', '.sqlite', '.sqlite3', '.zip', '.tar', '.gz', '.pdf', '.mp3', '.mp4', '.webp', '.avif']);
  return binaryExts.has(ext);
}

async function main() {
  console.log('Connecting to GitHub...');
  const accessToken = await getAccessToken();
  const octokit = new Octokit({ auth: accessToken });

  console.log('Collecting project files...');
  const files = collectFiles('.');
  console.log(`Found ${files.length} files to push`);

  const { data: refData } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${BRANCH}` });
  const latestCommitSha = refData.object.sha;
  console.log(`Current remote HEAD: ${latestCommitSha}`);

  const { data: commitData } = await octokit.git.getCommit({ owner: OWNER, repo: REPO, commit_sha: latestCommitSha });
  const baseTreeSha = commitData.tree.sha;

  console.log('Creating blobs...');
  const treeItems = [];
  let count = 0;

  for (const filePath of files) {
    const fullPath = path.resolve('.', filePath);
    const binary = isBinary(filePath);

    let content, encoding;
    if (binary) {
      content = fs.readFileSync(fullPath).toString('base64');
      encoding = 'base64';
    } else {
      content = fs.readFileSync(fullPath, 'utf-8');
      encoding = 'utf-8';
    }

    try {
      const { data: blobData } = await octokit.git.createBlob({
        owner: OWNER, repo: REPO,
        content,
        encoding,
      });
      treeItems.push({ path: filePath, mode: '100644', type: 'blob', sha: blobData.sha });
      count++;
      if (count % 25 === 0) console.log(`  ${count}/${files.length} files processed...`);
    } catch (err) {
      console.error(`  Failed: ${filePath} — ${err.message}`);
    }
  }

  console.log(`\nCreating tree with ${treeItems.length} files...`);
  const { data: newTree } = await octokit.git.createTree({
    owner: OWNER, repo: REPO,
    base_tree: baseTreeSha,
    tree: treeItems
  });

  console.log('Creating commit...');
  const { data: newCommit } = await octokit.git.createCommit({
    owner: OWNER, repo: REPO,
    message: COMMIT_MSG,
    tree: newTree.sha,
    parents: [latestCommitSha]
  });

  console.log('Pushing to remote...');
  await octokit.git.updateRef({
    owner: OWNER, repo: REPO,
    ref: `heads/${BRANCH}`,
    sha: newCommit.sha
  });

  console.log(`\nDone! Pushed ${treeItems.length} files to https://github.com/${OWNER}/${REPO}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
