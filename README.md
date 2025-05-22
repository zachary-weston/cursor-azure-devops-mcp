# Cursor Azure DevOps MCP Server

[![CI](https://github.com/maximtitovich/cursor-azure-devops-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/maximtitovich/cursor-azure-devops-mcp/actions/workflows/ci.yml)
[![Publish](https://github.com/maximtitovich/cursor-azure-devops-mcp/actions/workflows/publish.yml/badge.svg)](https://github.com/maximtitovich/cursor-azure-devops-mcp/actions/workflows/publish.yml)
[![Version Bump](https://github.com/maximtitovich/cursor-azure-devops-mcp/actions/workflows/version-bump.yml/badge.svg)](https://github.com/maximtitovich/cursor-azure-devops-mcp/actions/workflows/version-bump.yml)
[![npm version](https://img.shields.io/npm/v/cursor-azure-devops-mcp)](https://www.npmjs.com/package/cursor-azure-devops-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for integrating Azure DevOps with Cursor IDE. This tool allows Claude AI in Cursor to interact with Azure DevOps, providing access to projects, work items, repositories, and pull requests.

## Features

- Get Azure DevOps projects
- Retrieve work items by ID
- Fetch multiple work items
- List repositories in a project
- Get pull requests for a repository
- View pull request details and threads
- Retrieve work item attachments (images, PDFs, and other files)
- Get work item comments with metadata (including mentions and reactions)
- Get detailed code changes for pull requests (view file contents before and after changes)
- Create comments on pull requests (with support for replying to existing comments)
- Test Plan Management:
  - List all test plans in a project
  - Get test plan details by ID
  - List test suites in a test plan
  - Get test suite details by ID
  - List test cases in a test suite
  - Create new test cases in a test suite
- Work Item Management:
  - Execute WIQL (Work Item Query Language) queries
  - Update work item fields, relations, and add comments
- Smart Response Handling:
  - Automatic truncation of large responses to fit AI model limits
  - Preservation of essential fields in truncated responses
  - Metadata about truncation status and original size
- Project Configuration:
  - Default project support from configuration
  - Fallback to configuration when project is not specified
  - Proper error handling for missing project information

## Changelog

### Version 1.0.3

#### Added
- Test Plan Management Support:
  - New tool: `azure_devops_test_plans` - List all test plans for a project
  - New tool: `azure_devops_test_plan` - Get a test plan by ID
  - New tool: `azure_devops_test_suites` - List all test suites for a test plan
  - New tool: `azure_devops_test_suite` - Get a test suite by ID
  - New tool: `azure_devops_test_cases` - List all test cases for a test suite

#### Enhanced
- Response Size Management:
  - Added intelligent response truncation (max 50KB by default)
  - Preserved essential fields in truncated responses
  - Added truncation metadata in responses
- Project Configuration:
  - Added support for default project from configuration
  - Improved project parameter handling in all test-related methods
  - Added proper error handling for missing project information

#### Fixed
- Parameter ordering in test suite methods to comply with TypeScript requirements
- Error handling improvements in test-related API calls
- Response formatting for large test suite responses

### Version 1.1.2

#### Added
- Advanced Work Item Management:
  - New tool: `azure_devops_wiql_query` - Execute WIQL queries to find and filter work items
  - New tool: `azure_devops_update_work_item` - Update work item fields, relations, and add comments
  - New tool: `azure_devops_create_test_case` - Create new test cases in a test suite

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

The server can be configured using multiple sources, with the following priority:

1. Command line arguments
2. VSCode/Cursor IDE settings
3. Environment variables / `.env` file
4. Default values

### Command Line Arguments

You can configure the server using command line arguments:

```bash
npx cursor-azure-devops-mcp --azure-org-url=https://dev.azure.com/your-organization --azure-token=your-token --azure-project=YourProject
```

Available options:

| Option | Alias | Description |
|--------|-------|-------------|
| `--azure-org-url` | `--org` | Azure DevOps organization URL |
| `--azure-token` | `--token` | Azure DevOps personal access token |
| `--azure-project` | `--project` | Default Azure DevOps project name |
| `--port` | `-p` | Server port (for HTTP mode) |
| `--host` | `-h` | Server hostname (for HTTP mode) |
| `--log-level` | `--log` | Logging level (error, warn, info, debug) |
| `--help` | `-?` | Show help |

### VSCode/Cursor IDE Settings

You can configure the server in your VSCode or Cursor IDE settings:

1. Global settings: `~/.vscode/settings.json` or `~/.cursor/settings.json`
2. Workspace settings: `.vscode/settings.json` or `.cursor/settings.json`

Example settings:

```json
{
  "azureDevOps.organization": "your-organization",
  "azureDevOps.token": "your-personal-access-token",
  "azureDevOps.project": "YourProject",
  "cursor-azure-devops-mcp": {
    "port": 3000,
    "logLevel": "info"
  }
}
```

### Environment Variables

Create a `.env` file in your project root with the following variables:

```
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/your-organization
AZURE_DEVOPS_TOKEN=your-personal-access-token
AZURE_DEVOPS_PROJECT=YourProject
PORT=3000
LOG_LEVEL=info
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

### Windows Users

If you're using Windows and experiencing issues with the command mode, try this format:

```
cmd /k npx cursor-azure-devops-mcp
```

### mcp.json installation

```json
{
    "azure-devops": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "cursor-azure-devops-mcp",
        "--azure-org-url",
        "https://your-organization.visualstudio.com",
        "--azure-token",
        "your-personal-access-token",
        "--azure-project",
        "your-project"
      ]
    }
}
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

| Tool Name | Description | Required Parameters |
|-----------|-------------|-------------------|
| `azure_devops_projects` | Get all projects | None |
| `azure_devops_work_item` | Get a specific work item | `id` (number) |
| `azure_devops_work_items` | Get multiple work items | `ids` (array of numbers) |
| `azure_devops_repositories` | Get repositories for a project | `project` (string) |
| `azure_devops_pull_requests` | Get pull requests from a repository | `repositoryId` (string), `project` (string) |
| `azure_devops_pull_request_by_id` | Get a specific pull request | `repositoryId` (string), `pullRequestId` (number), `project` (string) |
| `azure_devops_pull_request_threads` | Get threads from a pull request | `repositoryId` (string), `pullRequestId` (number), `project` (string) |
| `azure_devops_work_item_attachments` | Get attachments for a work item | `id` (number) |
| `azure_devops_work_item_comments` | Get comments for a work item | `id` (number) |
| `azure_devops_pull_request_changes` | Get detailed PR code changes | `repositoryId` (string), `pullRequestId` (number), `project` (string) |
| `azure_devops_pull_request_file_content` | Get content of a specific file in a pull request | `repositoryId` (string), `pullRequestId` (number), `filePath` (string), `objectId` (string), `project` (string), optional: `returnPlainText` (boolean), `startPosition` (number), `length` (number) |
| `azure_devops_branch_file_content` | Get file content directly from a branch | `repositoryId` (string), `branchName` (string), `filePath` (string), `project` (string), optional: `returnPlainText` (boolean), `startPosition` (number), `length` (number) |
| `azure_devops_create_pr_comment` | Create a comment on a pull request | `repositoryId` (string), `pullRequestId` (number), `project` (string), `content` (string), and other optional parameters |
| `azure_devops_test_plans` | List all test plans for a project | `project` (string) |
| `azure_devops_test_plan` | Get a test plan by ID | `project` (string), `testPlanId` (number) |
| `azure_devops_test_suites` | List all test suites for a test plan | `project` (string), `testPlanId` (number) |
| `azure_devops_test_suite` | Get a test suite by ID | `project` (string), `testPlanId` (number), `testSuiteId` (number) |
| `azure_devops_test_cases` | List all test cases for a test suite | `project` (string), `testPlanId` (number), `testSuiteId` (number) |
| `azure_devops_wiql_query` | Execute a WIQL query | `query` (string), optional: `project` (string), `timeZone` (string) |
| `azure_devops_update_work_item` | Update a work item | `id` (number), optional: `fields` (object), `relations` (array), `comments` (array), `project` (string) |
| `azure_devops_create_test_case` | Create a new test case | `testSuiteId` (number), `testPlanId` (number), `workItemFields` (object), optional: `project` (string) |

### Test Management Tools

The test management tools provide comprehensive access to Azure DevOps test plans, suites, and cases:

- **Automatic Project Handling**: All test tools support using the default project from configuration
- **Smart Response Truncation**: Large responses are automatically truncated to fit AI model limits while preserving essential information
- **Metadata Preservation**: Even in truncated responses, important metadata like IDs, names, and relationships are preserved
- **Error Handling**: Comprehensive error handling with detailed error messages

#### Example Usage:

**List all test plans in a project:**
```json
{
  "project": "YourProject"
}
```

**Get a specific test suite:**
```json
{
  "project": "YourProject",
  "testPlanId": 185735,
  "testSuiteId": 186771
}
```

**List test cases in a suite:**
```json
{
  "project": "YourProject",
  "testPlanId": 185735,
  "testSuiteId": 186771
}
```

When working with test management tools, you should:

1. First retrieve the test plans for your project using `azure_devops_test_plans`
2. Use a specific test plan ID to get test suites with `azure_devops_test_suites`
3. Finally, get test cases for a specific suite using `azure_devops_test_cases`

The response format includes truncation metadata when necessary:
```json
{
  "items": [...],
  "totalCount": 100,
  "isTruncated": true,
  "truncatedCount": 80,
  "message": "Response was truncated. Showing 20 of 100 items."
}
```

### WIQL Query Tool

The WIQL (Work Item Query Language) query tool allows you to execute powerful SQL-like queries against work items in Azure DevOps.

#### Example WIQL Queries:

**Find all active bugs assigned to the current user:**
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.State] FROM WorkItems WHERE [System.WorkItemType] = 'Bug' AND [System.State] = 'Active' AND [System.AssignedTo] = @Me",
  "project": "YourProject"
}
```

**Find all user stories that were created in the last 30 days:**
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.CreatedDate] FROM WorkItems WHERE [System.WorkItemType] = 'User Story' AND [System.CreatedDate] >= @Today-30",
  "project": "YourProject"
}
```

**Find all work items linked to a specific work item:**
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.State] FROM WorkItemLinks WHERE [Source].[System.Id] = 123 AND [System.Links.LinkType] = 'Related' MODE (MustContain)",
  "project": "YourProject"
}
```

### Work Item Update Tool

The work item update tool allows you to modify work items by updating fields, adding/removing relations, and adding comments to the history.

#### Example Usage:

**Update work item fields:**
```json
{
  "id": 123,
  "fields": {
    "System.Title": "Updated Title",
    "System.State": "Active",
    "System.AssignedTo": "user@example.com",
    "System.Description": "This is the updated description",
    "Microsoft.VSTS.Common.Priority": 1
  },
  "project": "YourProject"
}
```

**Add a comment to a work item:**
```json
{
  "id": 123,
  "comments": ["This is a new comment on the work item."],
  "project": "YourProject"
}
```

**Add a parent-child relation:**
```json
{
  "id": 123,
  "relations": [
    {
      "rel": "System.LinkTypes.Hierarchy-Reverse",
      "url": "https://dev.azure.com/organization/project/_apis/wit/workItems/456"
    }
  ],
  "project": "YourProject"
}
```

### Test Case Creation Tool

The test case creation tool enables you to create new test cases directly in a test suite.

#### Example Usage:

**Create a basic test case:**
```json
{
  "testSuiteId": 186771,
  "testPlanId": 185735,
  "workItemFields": {
    "System.Title": "Verify login functionality",
    "System.Description": "Test case to verify user login with valid credentials",
    "Microsoft.VSTS.TCM.Steps": "<steps><step id='1'><parameterizedString>Navigate to login page</parameterizedString><parameterizedString>Login page is displayed</parameterizedString></step><step id='2'><parameterizedString>Enter valid credentials and click login</parameterizedString><parameterizedString>User is successfully logged in</parameterizedString></step></steps>"
  },
  "project": "YourProject"
}
```

**Create a test case with custom fields:**
```json
{
  "testSuiteId": 186771,
  "testPlanId": 185735,
  "workItemFields": {
    "System.Title": "Verify error message for invalid login",
    "System.Description": "Test case to verify error message when invalid credentials are used",
    "Microsoft.VSTS.TCM.Steps": "<steps><step id='1'><parameterizedString>Navigate to login page</parameterizedString><parameterizedString>Login page is displayed</parameterizedString></step><step id='2'><parameterizedString>Enter invalid credentials and click login</parameterizedString><parameterizedString>Error message is displayed</parameterizedString></step></steps>",
    "Microsoft.VSTS.Common.Priority": 1,
    "System.AreaPath": "YourProject\\Area",
    "System.IterationPath": "YourProject\\Sprint 1"
  },
  "project": "YourProject"
}
```