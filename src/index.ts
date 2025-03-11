#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { azureDevOpsService } from './azure-devops-service.js';
import { configManager } from './config-manager.js';

// Create MCP server
const server = new McpServer({
  name: 'cursor-azure-devops-mcp',
  version: '1.0.0',
  description: 'MCP Server for Azure DevOps integration with Cursor IDE',
});

// Register Azure DevOps tools
server.tool('azure_devops_projects', 'List all projects', {}, async () => {
  try {
    const result = await azureDevOpsService.getProjects();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error('Error executing azure_devops_projects:', error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: String(error) }, null, 2),
        },
      ],
    };
  }
});

server.tool(
  'azure_devops_work_item',
  'Get a work item by ID',
  {
    id: z.number().describe('Work item ID'),
  },
  async ({ id }) => {
    try {
      const result = await azureDevOpsService.getWorkItem(id);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(`Error executing azure_devops_work_item for ID ${id}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: String(error) }, null, 2),
          },
        ],
      };
    }
  }
);

server.tool(
  'azure_devops_work_items',
  'Get multiple work items by IDs',
  {
    ids: z.array(z.number()).describe('Array of work item IDs'),
  },
  async ({ ids }) => {
    try {
      const result = await azureDevOpsService.getWorkItems(ids);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(`Error executing azure_devops_work_items for IDs ${ids.join(', ')}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: String(error) }, null, 2),
          },
        ],
      };
    }
  }
);

server.tool(
  'azure_devops_repositories',
  'List all repositories',
  {
    project: z.string().optional().describe('Project name'),
  },
  async ({ project }) => {
    try {
      const result = await azureDevOpsService.getRepositories(project || '');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(
        `Error executing azure_devops_repositories for project ${project || 'default'}:`,
        error
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: String(error) }, null, 2),
          },
        ],
      };
    }
  }
);

server.tool(
  'azure_devops_pull_requests',
  'List all pull requests for a repository',
  {
    repositoryId: z.string().describe('Repository ID'),
    project: z.string().optional().describe('Project name'),
  },
  async ({ repositoryId, project }) => {
    try {
      const result = await azureDevOpsService.getPullRequests(repositoryId, project || '');
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(
        `Error executing azure_devops_pull_requests for repository ${repositoryId}:`,
        error
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: String(error) }, null, 2),
          },
        ],
      };
    }
  }
);

server.tool(
  'azure_devops_pull_request_by_id',
  'Get a pull request by ID',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    project: z.string().optional().describe('Project name'),
  },
  async ({ repositoryId, pullRequestId, project }) => {
    try {
      const result = await azureDevOpsService.getPullRequestById(
        repositoryId,
        pullRequestId,
        project || ''
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      console.error(
        `Error executing azure_devops_pull_request_by_id for repository ${repositoryId} PR #${pullRequestId}:`,
        error
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: String(error) }, null, 2),
          },
        ],
      };
    }
  }
);

server.tool(
  'azure_devops_pull_request_threads',
  'Get threads from a pull request',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    project: z.string().describe('Project name'),
  },
  async ({ repositoryId, pullRequestId, project }) => {
    const result = await azureDevOpsService.getPullRequestThreads(
      repositoryId,
      pullRequestId,
      project
    );
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// New tool for work item attachments
server.tool(
  'azure_devops_work_item_attachments',
  'Get attachments for a specific work item',
  {
    id: z.number().describe('Work item ID'),
  },
  async ({ id }) => {
    const result = await azureDevOpsService.getWorkItemAttachments(id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// New tool for pull request changes with file contents
server.tool(
  'azure_devops_pull_request_changes',
  'Get detailed code changes for a pull request',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    project: z.string().describe('Project name'),
  },
  async ({ repositoryId, pullRequestId, project }) => {
    const result = await azureDevOpsService.getPullRequestChanges(
      repositoryId,
      pullRequestId,
      project
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// New tool for getting content of large files in pull requests by chunks
server.tool(
  'azure_devops_pull_request_file_content',
  'Get content of a specific file in a pull request by chunks (for large files)',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    filePath: z.string().describe('File path'),
    objectId: z.string().describe('Object ID of the file version'),
    startPosition: z.number().describe('Starting position in the file (bytes)'),
    length: z.number().describe('Length to read (bytes)'),
    project: z.string().describe('Project name'),
  },
  async ({ repositoryId, pullRequestId, filePath, objectId, startPosition, length, project }) => {
    const result = await azureDevOpsService.getPullRequestFileContent(
      repositoryId,
      pullRequestId,
      filePath,
      objectId,
      startPosition,
      length,
      project
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// New tool for getting file content directly from a branch
server.tool(
  'azure_devops_branch_file_content',
  'Get content of a file directly from a branch (helps with PR file access)',
  {
    repositoryId: z.string().describe('Repository ID'),
    branchName: z.string().describe('Branch name'),
    filePath: z.string().describe('File path'),
    startPosition: z.number().describe('Starting position in the file (bytes)').default(0),
    length: z.number().describe('Length to read (bytes)').default(100000),
    project: z.string().describe('Project name'),
  },
  async ({ repositoryId, branchName, filePath, startPosition, length, project }) => {
    const result = await azureDevOpsService.getFileFromBranch(
      repositoryId,
      filePath,
      branchName,
      startPosition,
      length,
      project
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// New tool for creating pull request comments
server.tool(
  'azure_devops_create_pr_comment',
  'Create a comment on a pull request',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    project: z.string().describe('Project name'),
    content: z.string().describe('Comment text'),
    threadId: z.number().optional().describe('Thread ID (if adding to existing thread)'),
    filePath: z.string().optional().describe('File path (if commenting on a file)'),
    lineNumber: z.number().optional().describe('Line number (if commenting on a specific line)'),
    parentCommentId: z.number().optional().describe('Parent comment ID (if replying to a comment)'),
    status: z.string().optional().describe('Comment status (e.g., "active", "fixed")'),
  },
  async params => {
    const result = await azureDevOpsService.createPullRequestComment(params);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Start server
async function main() {
  // Load configuration from all sources (command line, IDE settings, env vars, defaults)
  const _config = configManager.loadConfig();

  // Display the configuration (sensitive data redacted)
  configManager.printConfig();

  // Check if Azure DevOps configuration is valid
  if (!configManager.isAzureDevOpsConfigValid()) {
    console.error('Azure DevOps configuration is missing or invalid.');
    console.error(
      'Please provide organizationUrl and token via command line, IDE settings, or environment variables.'
    );
    process.exit(1);
  }

  try {
    console.error('Starting Azure DevOps MCP Server with stdio transport...');

    // Initialize Azure DevOps API connection
    try {
      await azureDevOpsService.initialize();
      console.error('Azure DevOps API connection initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure DevOps API connection:', error);
      process.exit(1);
    }

    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);

    console.error('Azure DevOps MCP Server running on stdio');
    console.error('Available tools:');
    console.error('- azure_devops_projects: List all projects');
    console.error('- azure_devops_work_item: Get a work item by ID');
    console.error('- azure_devops_work_items: Get multiple work items by IDs');
    console.error('- azure_devops_repositories: List all repositories');
    console.error('- azure_devops_pull_requests: List all pull requests for a repository');
    console.error('- azure_devops_pull_request_by_id: Get a pull request by ID');
    console.error('- azure_devops_pull_request_threads: Get threads (comments) for a pull request');
    console.error('- azure_devops_work_item_attachments: Get attachments for a work item');
    console.error(
      '- azure_devops_pull_request_changes: Get detailed code changes for a pull request'
    );
    console.error(
      '- azure_devops_pull_request_file_content: Get content of a specific file in chunks (for large files)'
    );
    console.error(
      '- azure_devops_branch_file_content: Get content of a file directly from a branch'
    );
    console.error('- azure_devops_create_pr_comment: Create a comment on a pull request');
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down...');
  process.exit(0);
});

// Run the server
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
