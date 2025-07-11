# MCP (Model Context Protocol) Setup Guide

This guide explains how to set up MCP servers for both Cursor and Claude Code in this project.

## Overview

MCP servers provide additional capabilities to AI assistants like task management and database access. This project uses:
- **task-master-ai**: Advanced task management and AI coordination
- **dbhub-postgres**: PostgreSQL database access via Docker

## Security Notice

⚠️ **IMPORTANT**: Never commit API keys or sensitive credentials to version control!

## Setup Instructions

### 1. Create Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your actual API keys:
- `ANTHROPIC_API_KEY`: Required for task-master-ai
- Other API keys as needed for your providers
- `POSTGRES_DSN`: Your PostgreSQL connection string

### 2. Claude Code Configuration

The `.mcp.json` file is already configured for Claude Code. It uses environment variable substitution for security:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        // ... other API keys
      }
    }
  }
}
```

### 3. Cursor Configuration

⚠️ **WARNING**: The `.cursor/mcp.json` file contains hardcoded API keys and should NOT be committed to version control. It's already in `.gitignore`.

To use MCP with Cursor:
1. Update `.cursor/mcp.json` with your actual API keys
2. Ensure the file remains in `.gitignore`
3. Consider using environment variables if Cursor supports them in future updates

### 4. Docker Setup (for dbhub-postgres)

Ensure Docker is installed and running:

```bash
# Check Docker installation
docker --version

# Pull the dbhub image
docker pull bytebase/dbhub
```

### 5. Testing MCP Servers

For Claude Code:
```bash
# The MCP servers will be automatically available when using Claude Code
# Check the Claude Code documentation for usage
```

For Cursor:
- MCP servers should appear in Cursor's interface
- Check Cursor's MCP panel for server status

## Troubleshooting

### API Key Issues
- Ensure `.env.local` exists and contains valid API keys
- Check that environment variables are properly loaded
- Verify API key formats match the examples in `.env.example`

### Docker Connection Issues
- Ensure Docker Desktop is running
- Check `DOCKER_HOST` environment variable
- Verify PostgreSQL container is accessible

### MCP Server Not Found
- Ensure you've run `pnpm install` to install dependencies
- Check that npx can access the task-master-ai package
- Verify network connectivity for package downloads

## Best Practices

1. **Never commit sensitive data**: Always use environment variables
2. **Keep `.env.local` private**: This file should never be shared
3. **Rotate API keys regularly**: Update keys periodically for security
4. **Use minimal permissions**: Only grant necessary access to API keys
5. **Document changes**: Update this guide when modifying MCP configuration