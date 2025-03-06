#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { azureDevOpsService } from './azure-devops-service.js';
import { config } from './config.js';

// Create MCP server
const server = new McpServer({
  name: 'cursor-azure-devops-mcp',
  version: '1.0.0',
  description: 'MCP Server for Azure DevOps integration with Cursor IDE'
});

// Register Azure DevOps tools
server.tool(
  'azure_devops_projects',
  'Get projects from Azure DevOps',
  {},
  async () => {
    const result = await azureDevOpsService.getProjects();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  'azure_devops_work_item',
  'Get a specific work item by ID',
  {
    id: z.number().describe('Work item ID')
  },
  async ({ id }) => {
    const result = await azureDevOpsService.getWorkItem(id);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  'azure_devops_work_items',
  'Get multiple work items by IDs',
  {
    ids: z.array(z.number()).describe('Array of work item IDs')
  },
  async ({ ids }) => {
    const result = await azureDevOpsService.getWorkItems(ids);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  'azure_devops_repositories',
  'Get repositories for a project',
  {
    project: z.string().describe('Project name')
  },
  async ({ project }) => {
    const result = await azureDevOpsService.getRepositories(project);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  'azure_devops_pull_requests',
  'Get pull requests from a repository',
  {
    repositoryId: z.string().describe('Repository ID'),
    project: z.string().describe('Project name')
  },
  async ({ repositoryId, project }) => {
    const result = await azureDevOpsService.getPullRequests(repositoryId, project);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  'azure_devops_pull_request_by_id',
  'Get a specific pull request by ID',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    project: z.string().describe('Project name')
  },
  async ({ repositoryId, pullRequestId, project }) => {
    const result = await azureDevOpsService.getPullRequestById(repositoryId, pullRequestId, project);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  'azure_devops_pull_request_threads',
  'Get threads from a pull request',
  {
    repositoryId: z.string().describe('Repository ID'),
    pullRequestId: z.number().describe('Pull request ID'),
    project: z.string().describe('Project name')
  },
  async ({ repositoryId, pullRequestId, project }) => {
    const result = await azureDevOpsService.getPullRequestThreads(repositoryId, pullRequestId, project);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

// Start server
async function main() {
  try {
    console.error('Starting Azure DevOps MCP Server with stdio transport...');
    
    // Initialize Azure DevOps connection
    try {
      await azureDevOpsService.testConnection();
      console.error('Azure DevOps API connection initialized successfully');
    } catch (error) {
      console.error('Error connecting to Azure DevOps API:', error);
      console.error('Please check your .env configuration');
      process.exit(1);
    }
    
    // Create transport and connect
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Azure DevOps MCP Server running on stdio');
    console.error('Tools available:');
    console.error('- azure_devops_projects: Get projects from Azure DevOps');
    console.error('- azure_devops_work_item: Get a specific work item by ID');
    console.error('- azure_devops_work_items: Get multiple work items by IDs');
    console.error('- azure_devops_repositories: Get repositories for a project');
    console.error('- azure_devops_pull_requests: Get pull requests from a repository');
    console.error('- azure_devops_pull_request_by_id: Get a specific pull request by ID');
    console.error('- azure_devops_pull_request_threads: Get threads from a pull request');
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
  console.error('Fatal error in main():', error);
  process.exit(1);
}); 