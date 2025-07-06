#!/usr/bin/env node

/**
 * Package Manager Enforcement Script
 * Ensures only pnpm is used for this project
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkLockFiles() {
  const projectRoot = process.cwd();
  const violations = [];

  // Check for forbidden lock files
  const forbiddenLockFiles = ["package-lock.json", "yarn.lock", "bun.lockb"];

  forbiddenLockFiles.forEach((lockFile) => {
    const lockPath = path.join(projectRoot, lockFile);
    if (fs.existsSync(lockPath)) {
      violations.push(`Found forbidden lock file: ${lockFile}`);
    }
  });

  // Check for required pnpm lock file
  const pnpmLockPath = path.join(projectRoot, "pnpm-lock.yaml");
  if (!fs.existsSync(pnpmLockPath)) {
    violations.push("Missing required pnpm-lock.yaml file");
  }

  return violations;
}

function checkPackageJson() {
  const violations = [];
  const packageJsonPath = path.join(process.cwd(), "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    violations.push("package.json not found");
    return violations;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

    // Check engines field
    if (!packageJson.engines) {
      violations.push("Missing engines field in package.json");
    } else {
      if (!packageJson.engines.pnpm) {
        violations.push("Missing pnpm version requirement in engines");
      }
      if (packageJson.engines.npm !== "please-use-pnpm") {
        violations.push('npm engine should be set to "please-use-pnpm"');
      }
      if (packageJson.engines.yarn !== "please-use-pnpm") {
        violations.push('yarn engine should be set to "please-use-pnpm"');
      }
    }

    // Check packageManager field
    if (
      !packageJson.packageManager ||
      !packageJson.packageManager.startsWith("pnpm@")
    ) {
      violations.push(
        'Missing or incorrect packageManager field (should start with "pnpm@")'
      );
    }
  } catch (error) {
    violations.push(`Error reading package.json: ${error.message}`);
  }

  return violations;
}

function checkNpmrc() {
  const violations = [];
  const npmrcPath = path.join(process.cwd(), ".npmrc");

  if (!fs.existsSync(npmrcPath)) {
    violations.push("Missing .npmrc file");
    return violations;
  }

  try {
    const npmrcContent = fs.readFileSync(npmrcPath, "utf8");

    if (!npmrcContent.includes("engine-strict=true")) {
      violations.push('.npmrc missing "engine-strict=true"');
    }

    if (!npmrcContent.includes("node-linker=hoisted")) {
      violations.push(
        '.npmrc missing "node-linker=hoisted" for Next.js compatibility'
      );
    }
  } catch (error) {
    violations.push(`Error reading .npmrc: ${error.message}`);
  }

  return violations;
}

function checkCurrentPackageManager() {
  const violations = [];

  try {
    // Check if pnpm is available
    execSync("pnpm --version", { stdio: "ignore" });
  } catch (error) {
    violations.push("pnpm is not installed globally. Run: npm install -g pnpm");
  }

  return violations;
}

function fixCommonIssues() {
  log("\n🔧 Attempting to fix common issues...", YELLOW);

  const projectRoot = process.cwd();
  let fixed = false;

  // Remove forbidden lock files
  const forbiddenLockFiles = ["package-lock.json", "yarn.lock", "bun.lockb"];
  forbiddenLockFiles.forEach((lockFile) => {
    const lockPath = path.join(projectRoot, lockFile);
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      log(`✅ Removed ${lockFile}`, GREEN);
      fixed = true;
    }
  });

  if (fixed) {
    log('🔄 Run "pnpm install" to regenerate pnpm-lock.yaml', YELLOW);
  }

  return fixed;
}

function main() {
  log("🔍 Checking package manager compliance...", YELLOW);

  const allViolations = [
    ...checkLockFiles(),
    ...checkPackageJson(),
    ...checkNpmrc(),
    ...checkCurrentPackageManager(),
  ];

  if (allViolations.length === 0) {
    log("✅ All package manager checks passed!", GREEN);
    process.exit(0);
  }

  log("\n❌ Package manager violations found:", RED);
  allViolations.forEach((violation) => {
    log(`  • ${violation}`, RED);
  });

  // Offer to fix common issues
  if (process.argv.includes("--fix")) {
    fixCommonIssues();
  } else {
    log("\n💡 Run with --fix to automatically resolve common issues", YELLOW);
  }

  log("\n📖 See .cursor/rules/pnpm.mdc for detailed guidelines", YELLOW);
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  checkLockFiles,
  checkPackageJson,
  checkNpmrc,
  checkCurrentPackageManager,
};
