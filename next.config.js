const { mkdirSync, writeFileSync } = require('fs');
const { resolve } = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  webpack: (config, { isServer, nextRuntime }) => {
    if (isServer && nextRuntime === 'nodejs') {
      const distDir = resolve(__dirname, 'dist');
      mkdirSync(distDir, { recursive: true });
      const launcher = `const { spawn } = require("child_process");
const path = require("path");
const port = process.env.PORT || 5000;
process.env.PORT = String(port);
const next = spawn("npx", ["next", "start", "-p", port], {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: { ...process.env },
});
next.on("error", (err) => { console.error("Failed to start:", err); process.exit(1); });
next.on("close", (code) => { process.exit(code || 0); });
`;
      writeFileSync(resolve(distDir, 'index.cjs'), launcher);
    }
    return config;
  },
};

module.exports = nextConfig;
