import * as azdev from 'azure-devops-node-api';
import { loadConfig } from './config.js';
import { 
  TeamProject, 
  WorkItem, 
  GitRepository, 
  GitPullRequest, 
  GitPullRequestCommentThread,
  ApiClients
} from './types.js';

/**
 * Service for interacting with Azure DevOps API
 */
class AzureDevOpsService {
  private connection: azdev.WebApi | null = null;
  private projectClient: any = null;
  private workItemClient: any = null;
  private gitClient: any = null;
  private config = loadConfig();

  /**
   * Initialize the Azure DevOps API connection
   */
  async initialize(): Promise<void> {
    if (this.connection) {
      return;
    }

    const { organizationUrl, token } = this.config.azureDevOps;
    
    if (!organizationUrl || !token) {
      throw new Error('Azure DevOps organization URL and token are required');
    }

    // Create a connection to Azure DevOps
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    this.connection = new azdev.WebApi(organizationUrl, authHandler);

    // Get API clients
    this.projectClient = await this.connection.getCoreApi();
    this.workItemClient = await this.connection.getWorkItemTrackingApi();
    this.gitClient = await this.connection.getGitApi();
  }

  /**
   * Get all projects from Azure DevOps
   */
  async getProjects(): Promise<TeamProject[]> {
    await this.initialize();
    
    if (!this.projectClient) {
      throw new Error('Project client not initialized');
    }
    
    // CoreApi provides the getProjects method to list all projects
    const projects = await this.projectClient.getProjects();
    return projects;
  }

  /**
   * Get a specific work item by ID
   */
  async getWorkItem(id: number): Promise<WorkItem> {
    await this.initialize();
    
    if (!this.workItemClient) {
      throw new Error('Work item client not initialized');
    }
    
    const workItem = await this.workItemClient.getWorkItem(id);
    return workItem;
  }

  /**
   * Get multiple work items by IDs
   */
  async getWorkItems(ids: number[]): Promise<WorkItem[]> {
    await this.initialize();
    
    if (!this.workItemClient) {
      throw new Error('Work item client not initialized');
    }
    
    const workItems = await this.workItemClient.getWorkItems(ids);
    return workItems;
  }

  /**
   * Get repositories for a project
   */
  async getRepositories(project: string): Promise<GitRepository[]> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    const repositories = await this.gitClient.getRepositories(project);
    return repositories;
  }

  /**
   * Get pull requests from a repository
   */
  async getPullRequests(repositoryId: string, project: string): Promise<GitPullRequest[]> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    const pullRequests = await this.gitClient.getPullRequests(repositoryId, {
      project: project
    });
    
    return pullRequests;
  }

  /**
   * Get a specific pull request by ID
   */
  async getPullRequestById(repositoryId: string, pullRequestId: number, project: string): Promise<GitPullRequest> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    const pullRequest = await this.gitClient.getPullRequest(repositoryId, pullRequestId, project);
    return pullRequest;
  }

  /**
   * Get threads from a pull request
   */
  async getPullRequestThreads(repositoryId: string, pullRequestId: number, project: string): Promise<GitPullRequestCommentThread[]> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    const threads = await this.gitClient.getThreads(repositoryId, pullRequestId, project);
    return threads;
  }

  /**
   * Test the connection to Azure DevOps API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.initialize();
      // Try to get a list of projects to verify the connection works
      await this.projectClient?.getProjects();
      return true;
    } catch (error) {
      console.error('Error testing Azure DevOps connection:', error);
      throw new Error(`Failed to connect to Azure DevOps: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the API clients
   * @returns Object containing all initialized clients
   */
  getClients(): ApiClients {
    if (!this.projectClient || !this.workItemClient || !this.gitClient) {
      throw new Error('API clients not initialized. Call initialize() first.');
    }

    return {
      projectClient: this.projectClient,
      workItemClient: this.workItemClient,
      gitClient: this.gitClient
    };
  }
}

// Export a singleton instance
export const azureDevOpsService = new AzureDevOpsService(); 