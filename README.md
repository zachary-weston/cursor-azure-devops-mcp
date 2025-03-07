# Cursor Azure DevOps MCP Server

A Model Context Protocol (MCP) server for integrating Azure DevOps with Cursor IDE. This tool allows Claude AI in Cursor to interact with Azure DevOps, providing access to projects, work items, repositories, and pull requests.

## Features

- Get Azure DevOps projects
- Retrieve work items by ID
- Fetch multiple work items
- List repositories in a project
- Get pull requests for a repository
- View pull request details and threads
- Retrieve work item attachments (images, PDFs, and other files)
- Get detailed code changes for pull requests (view file contents before and after changes)
- Create comments on pull requests (with support for replying to existing comments)

## Installation

### Global Installation

```bash
npm install -g cursor-azure-devops-mcp
```

### Local Installation

```bash
npm install cursor-azure-devops-mcp
```

## Configuration

Create a `.env` file in your project root with the following variables:

```
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/your-organization
AZURE_DEVOPS_TOKEN=your-personal-access-token
```

You can also copy the provided `.env.example` file:

```bash
cp .env.example .env
```

Then edit the file with your Azure DevOps credentials.

## Usage

### Running with npx

The easiest way to use this MCP server is with npx:

```bash
npx cursor-azure-devops-mcp
```

### Setting up in Cursor IDE (Version 0.46.9+)

Cursor IDE supports two methods for connecting to MCP servers: Command mode and SSE mode.

#### Option 1: Command Mode (Recommended)

The Command mode runs the MCP server as a process directly from Cursor. This is the **most reliable method** and should be your first choice:

1. Open Cursor IDE
2. Go to Settings > Features > MCP Servers
3. Click "Add New MCP Server"
4. Enter a name for your server (e.g., "Azure DevOps")
5. Select "command" from the dropdown
6. Enter the command to run the server:
   ```
   cursor-azure-devops-mcp
   ```
   
   If you haven't installed it globally, you can use npx:
   ```
   npx cursor-azure-devops-mcp
   ```

7. Click "Add"

**Important**: When using Command mode, the server will automatically use your environment variables from your system or from a `.env` file in your current working directory. Make sure your `.env` file is properly set up with your Azure DevOps credentials.

**Troubleshooting Command Mode**:

If you encounter the error "server.setRequestHandler is not a function" or similar errors:
1. Make sure you have the latest version of the package installed
2. Try reinstalling the package: `npm install -g cursor-azure-devops-mcp`
3. Check that your `.env` file is correctly set up with your Azure DevOps credentials

![Command Mode Setup](https://raw.githubusercontent.com/yourusername/cursor-azure-devops-mcp/main/docs/images/command-mode-setup.png)

#### Option 2: SSE Mode (Alternative)

**Note**: SSE mode is more prone to connection issues. If you're experiencing problems, please use Command mode instead.

The SSE mode connects to an HTTP server with Server-Sent Events:

1. First, start the HTTP server with SSE support:
   ```bash
   npm run sse-server
   ```
   or
   ```bash
   npx cursor-azure-devops-mcp-sse
   ```
   This will start a server on port 3000 by default.

2. Open Cursor IDE
3. Go to Settings > Features > MCP Servers
4. Click "Add New MCP Server"
5. Enter a name for your server (e.g., "Azure DevOps SSE")
6. Select "sse" from the dropdown
7. Enter the SSE endpoint URL:
   ```
   http://localhost:3000/sse
   ```
8. Click "Add"

![SSE Mode Setup](https://raw.githubusercontent.com/yourusername/cursor-azure-devops-mcp/main/docs/images/sse-mode-setup.png)

### Windows Users

If you're using Windows and experiencing issues with the command mode, try this format:

```
cmd /k npx cursor-azure-devops-mcp
```

### Using in Your Code

```javascript
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { registerTools } = require('cursor-azure-devops-mcp');
const azureDevOpsService = require('cursor-azure-devops-mcp/lib/azure-devops-service');

// Create MCP server
const server = new McpServer({
  name: 'cursor-azure-devops-mcp',
  version: '1.0.0'
});

// Register Azure DevOps tools with the server
registerTools(server, azureDevOpsService);

// Connect to your transport of choice
// ...
```

## Available Tools

| Tool Name                           | Description                         | Required Parameters                                                   |
| ----------------------------------- | ----------------------------------- | --------------------------------------------------------------------- |
| `azure_devops_projects`             | Get all projects                    | None                                                                  |
| `azure_devops_work_item`            | Get a specific work item            | `id` (number)                                                         |
| `azure_devops_work_items`           | Get multiple work items             | `ids` (array of numbers)                                              |
| `azure_devops_repositories`         | Get repositories for a project      | `project` (string)                                                    |
| `azure_devops_pull_requests`        | Get pull requests from a repository | `repositoryId` (string), `project` (string)                           |
| `azure_devops_pull_request_by_id`   | Get a specific pull request         | `repositoryId` (string), `pullRequestId` (number), `project` (string) |
| `azure_devops_pull_request_threads` | Get threads from a pull request     | `repositoryId` (string), `pullRequestId` (number), `project` (string) |
| `azure_devops_work_item_attachments`| Get attachments for a work item     | `id` (number)                                                         |
| `azure_devops_pull_request_changes` | Get detailed PR code changes        | `repositoryId` (string), `pullRequestId` (number), `project` (string) |
| `azure_devops_create_pr_comment`    | Create a comment on a pull request  | `repositoryId` (string), `pullRequestId` (number), `project` (string), `content` (string), and other optional parameters |

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Azure DevOps account with a personal access token

### Setup

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/cursor-azure-devops-mcp.git
   cd cursor-azure-devops-mcp
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Create a `.env` file with your Azure DevOps credentials

   ```bash
   cp .env.example .env
   ```

4. Build the TypeScript code
   ```bash
   npm run build
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

### TypeScript Implementation

This project is implemented in TypeScript using the latest MCP SDK features:

- Uses ESM modules for better compatibility
- Leverages Zod for schema validation
- Provides proper type definitions
- Follows modern JavaScript/TypeScript best practices

### Testing

To test the connection to Azure DevOps:

```bash
npm run test-connection
```

## Publishing

To publish to npm:

```bash
npm run build
npm publish
```

## Troubleshooting

### Summary of Common Issues and Solutions

1. **Best Practices for Connection**:
   - Use Command mode when possible (more reliable)
   - If using SSE mode, set the port directly in the command line with `PORT=9836 npm run sse-server`
   - Always verify the server is running before trying to connect from Cursor

2. **Port Configuration**:
   - The most reliable way to change the port is using the environment variable directly: `PORT=9836 npm run sse-server`
   - Make sure to use the same port in Cursor when adding the MCP server: `http://localhost:9836/sse`

3. **Session Management Issues**:
   - If you see "Session not found" errors in the console, try restarting both the server and Cursor
   - Clear Cursor's application data (Help > Clear Application Data) if problems persist

4. **Connection Errors**:
   - For "Failed to create client" errors, make sure the server is running and accessible
   - Check that no firewalls or security software are blocking the connection
   - Try using a different port if the default port (3000) is in use

### MCP Server Not Connecting

- Make sure your Azure DevOps credentials in the `.env` file are correct
- Check that your personal access token has the necessary permissions:
  - Code (read)
  - Pull Request Threads (read)
  - Work Items (read)
- If using SSE mode, ensure the server is running before adding the MCP server in Cursor

### Command Not Found

- If running with npx, make sure you have Node.js installed
- If using the global installation, try reinstalling: `npm install -g cursor-azure-devops-mcp`

### SSE Connection Issues

If you encounter JSON validation errors when connecting via SSE mode:

1. **Use Command Mode Instead**: The command mode is more reliable and recommended for most users.

2. **Check Cursor Version**: Ensure you're using Cursor version 0.46.9 or newer, as older versions had known issues with SSE connections.

3. **Run with Debug Logs**: Start the SSE server with debug logs:
   ```bash
   DEBUG=* npm run sse-server
   ```

4. **Port Conflicts**: Make sure no other service is using port 3000. You can change the port by setting the `PORT` environment variable:
   ```bash
   PORT=3001 npm run sse-server
   ```
   Then use `http://localhost:3001/sse` as the SSE endpoint URL.

5. **Network Issues**: Make sure your firewall isn't blocking the connection.

6. **Verify Server is Running**: Make sure you can access the server's home page at `http://localhost:3000`

### "Cannot set headers after they are sent to the client" Error

If you encounter this error when running the SSE server:

1. **Check for duplicate header settings**: This error occurs when the application tries to set HTTP headers after they've already been sent. In the SSE implementation, make sure you're not manually setting headers that the `SSEServerTransport` already sets.

2. **Avoid manual header manipulation**: The `SSEServerTransport` class from the MCP SDK handles the necessary headers for SSE connections. Don't set these headers manually:
   ```javascript
   // Don't set these manually in your route handlers
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader('Cache-Control', 'no-cache, no-transform');
   res.setHeader('Connection', 'keep-alive');
   ```

3. **Check response handling**: Ensure you're not sending multiple responses to the same request. Each HTTP request should have exactly one response.

### Port Configuration Issues

If you're changing the port in your `.env` file but the server still runs on port 3000, try one of these solutions:

1. **Set the PORT directly in the command line**:
   ```bash
   PORT=9836 npm run sse-server
   ```
   
   This is the most reliable way to change the port. The server will output the actual port it's using:
   ```
   Server running on port 9836
   SSE endpoint: http://localhost:9836/sse
   Message endpoint: http://localhost:9836/message
   ```

2. **Verify your `.env` file is being loaded**:
   Make sure your `.env` file is in the root directory of the project and has the correct format:
   ```
   PORT=9836
   HOST=localhost
   AZURE_DEVOPS_ORG_URL=https://dev.azure.com/your-organization
   AZURE_DEVOPS_TOKEN=your-personal-access-token
   ```

3. **Use Command mode instead**:
   The Command mode is more reliable and doesn't require managing a separate HTTP server.

### Connecting to Cursor with Custom Port

If you're running the SSE server on a custom port (e.g., 9836), make sure to use the correct port when adding the MCP server in Cursor:

1. Start the server with your custom port:
   ```bash
   PORT=9836 npm run sse-server
   ```

2. In Cursor IDE, when adding the MCP server, use the correct port in the SSE endpoint URL:
   ```
   http://localhost:9836/sse
   ```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
