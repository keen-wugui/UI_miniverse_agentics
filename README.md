# Agentic Workflow Dashboard

An intelligent, web-based management interface that provides comprehensive visibility and control over business-specific RAG (Retrieval-Augmented Generation) workflows.

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.17.0 (required for Next.js 15)
- **pnpm** >= 8.0.0 (required - see Package Manager section below)

### Installation

```bash
# 1. Install pnpm globally (if not already installed)
npm install -g pnpm

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```

## 📦 Package Manager: pnpm Only

This project **exclusively uses pnpm** for package management. Using npm, yarn, or bun is not allowed.

### Why pnpm?

- **⚡ 2-3x faster** installations than npm
- **💾 40% less disk space** usage  
- **🔒 Strict dependency isolation** prevents phantom dependencies
- **🚀 Better performance** for complex projects with multiple dependencies

### ❌ Blocked Commands

```bash
# These commands are BLOCKED:
npm install     # ❌
yarn install    # ❌
bun install     # ❌
```

### ✅ Correct Commands

```bash
# Use these instead:
pnpm install    # ✅
pnpm add <pkg>  # ✅
pnpm dev        # ✅
pnpm build      # ✅
```

### Enforcement Mechanisms

1. **`.npmrc`** - Contains `engine-strict=true` to block npm/yarn
2. **`package.json`** - Engines field blocks non-pnpm usage
3. **`.gitignore`** - Ignores npm/yarn lock files
4. **Pre-commit script** - Automatically checks for violations
5. **Cursor rules** - IDE guidance for developers

## 🛠️ Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler check
pnpm test         # Run tests (when implemented)
```

### Checking Package Manager Compliance

```bash
# Check for violations
node scripts/check-package-manager.js

# Auto-fix common issues
node scripts/check-package-manager.js --fix
```

## 🏗️ Architecture

Built with:

- **Next.js 15** - App Router with Turbopack bundler for modern React development
- **TypeScript** - Type safety and developer experience
- **shadcn/ui** - High-quality UI components
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Data fetching and state management
- **Recharts** - Data visualization

## 📁 Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # Reusable UI components
│   ├── ui/                # shadcn/ui components
│   └── dashboard/         # Dashboard-specific components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
├── styles/                # Global styles
├── scripts/               # Utility scripts
│   └── check-package-manager.js
└── .cursor/rules/         # IDE rules and guidelines
    └── pnpm.mdc          # Package manager enforcement
```

## 🔧 Configuration Files

- **`.npmrc`** - pnpm configuration and enforcement
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`next.config.js`** - Next.js configuration
- **`.eslintrc.json`** - ESLint configuration

## 🚨 Troubleshooting

### Mixed Package Managers

If you accidentally used npm or yarn:

```bash
# Clean up
rm -rf node_modules
rm package-lock.json  # or yarn.lock, bun.lockb
pnpm install
```

### pnpm Not Installed

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### IDE Issues

- Enable pnpm support in your IDE
- Install the pnpm extension for VS Code
- Configure terminal to use pnpm by default

## 📋 Features

### Core Dashboard Components

- **📊 System Health Monitoring** - Real-time performance metrics
- **📁 Document Management** - Upload, organize, and process documents
- **⚙️ RAG Configuration** - Manage AI workflow configurations
- **📈 Analytics Dashboard** - Business metrics and insights
- **🔄 Workflow Management** - Monitor and control automated processes

### Advanced Features

- **🎨 Responsive Design** - Works on all device sizes
- **♿ Accessibility** - WCAG compliant interface
- **⚡ Performance Optimized** - Lazy loading, caching, virtualization
- **🔒 Error Handling** - Comprehensive error boundaries and feedback
- **📊 Data Visualization** - Interactive charts and graphs

## 🤝 Contributing

1. **Use pnpm only** - Never use npm, yarn, or bun
2. **Follow TypeScript** - All code must be properly typed
3. **Follow ESLint rules** - Run `pnpm lint` before committing
4. **Test your changes** - Ensure all features work correctly
5. **Update documentation** - Keep README and comments current

### Commit Guidelines

```bash
# Before committing
pnpm lint
pnpm type-check
node scripts/check-package-manager.js

# Commit with descriptive message
git commit -m "feat: add document upload functionality"
```

## 📚 Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [pnpm Documentation](https://pnpm.io/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Query Guide](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 📄 License

[MIT License](LICENSE)

---

**Remember**: Always use `pnpm` for this project. It's not just a preference—it's enforced! 🔒 