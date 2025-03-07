import * as azdev from 'azure-devops-node-api';
import { configManager } from './config-manager.js';
import { 
  TeamProject, 
  WorkItem, 
  GitRepository, 
  GitPullRequest, 
  GitPullRequestCommentThread,
  ApiClients,
  WorkItemAttachment,
  PullRequestChange,
  PullRequestChanges,
  PullRequestCommentRequest,
  PullRequestCommentResponse
} from './types.js';

/**
 * Service for interacting with Azure DevOps API
 */
class AzureDevOpsService {
  private connection: azdev.WebApi | null = null;
  private projectClient: any = null;
  private workItemClient: any = null;
  private gitClient: any = null;
  private defaultProject: string | undefined;

  constructor(connection?: azdev.WebApi, defaultProject?: string) {
    if (connection) {
      this.connection = connection;
    }
    this.defaultProject = defaultProject;
  }

  /**
   * Initialize the Azure DevOps API connection
   */
  async initialize(): Promise<void> {
    if (this.connection) {
      return;
    }

    const config = configManager.loadConfig();
    const { organizationUrl, token } = config.azureDevOps;
    
    if (!organizationUrl || !token) {
      throw new Error('Azure DevOps organization URL and token are required');
    }

    // Create a connection to Azure DevOps
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    this.connection = new azdev.WebApi(organizationUrl, authHandler);

    // Set default project if not provided in constructor
    if (!this.defaultProject && config.azureDevOps.project) {
      this.defaultProject = config.azureDevOps.project;
    }

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
  async getRepositories(project?: string): Promise<GitRepository[]> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;
    
    if (!projectName) {
      throw new Error('Project name is required');
    }
    
    const repositories = await this.gitClient.getRepositories(projectName);
    return repositories;
  }

  /**
   * Get pull requests for a repository
   */
  async getPullRequests(repositoryId: string, project?: string): Promise<GitPullRequest[]> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;
    
    if (!projectName) {
      throw new Error('Project name is required');
    }
    
    const pullRequests = await this.gitClient.getPullRequests(repositoryId, {
      project: projectName
    });
    
    return pullRequests;
  }

  /**
   * Get a specific pull request by ID
   */
  async getPullRequestById(repositoryId: string, pullRequestId: number, project?: string): Promise<GitPullRequest> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;
    
    if (!projectName) {
      throw new Error('Project name is required');
    }
    
    const pullRequest = await this.gitClient.getPullRequestById(pullRequestId, repositoryId, projectName);
    return pullRequest;
  }

  /**
   * Get threads (comments) for a pull request
   */
  async getPullRequestThreads(repositoryId: string, pullRequestId: number, project?: string): Promise<GitPullRequestCommentThread[]> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;
    
    if (!projectName) {
      throw new Error('Project name is required');
    }
    
    const threads = await this.gitClient.getThreads(repositoryId, pullRequestId, projectName);
    return threads;
  }

  /**
   * Test the connection to Azure DevOps
   */
  async testConnection(): Promise<boolean> {
    await this.initialize();
    // If we get here, the connection was successful
    return true;
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

  /**
   * Get attachments for a specific work item
   * @param workItemId The ID of the work item
   * @returns Array of attachments with metadata
   */
  async getWorkItemAttachments(workItemId: number): Promise<WorkItemAttachment[]> {
    await this.initialize();
    
    if (!this.workItemClient) {
      throw new Error('Work item client not initialized');
    }
    
    // Get work item with relations (includes attachments)
    const workItem = await this.workItemClient.getWorkItem(
      workItemId, 
      undefined, 
      undefined, 
      4 // 4 = WorkItemExpand.Relations in the SDK
    );
    
    if (!workItem || !workItem.relations) {
      return [];
    }
    
    // Filter for attachment relations
    const attachmentRelations = workItem.relations.filter((relation: any) => 
      relation.rel === 'AttachedFile' || relation.rel === 'Hyperlink'
    );
    
    // Map relations to attachment objects
    const attachments = attachmentRelations.map((relation: any) => {
      const url = relation.url;
      const attributes = relation.attributes || {};
      
      const attachment: WorkItemAttachment = {
        url,
        name: attributes.name || url.split('/').pop() || 'unnamed',
        comment: attributes.comment || '',
        resourceSize: attributes.resourceSize || 0,
        contentType: attributes.resourceType || ''
      };
      
      return attachment;
    });
    
    return attachments;
  }

  /**
   * Get detailed changes for a pull request
   */
  async getPullRequestChanges(repositoryId: string, pullRequestId: number, project?: string): Promise<PullRequestChanges> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;
    
    if (!projectName) {
      throw new Error('Project name is required');
    }
    
    // Get the changes for the pull request
    const changes = await this.gitClient.getPullRequestIterationChanges(
      repositoryId,
      pullRequestId,
      1, // Iteration (usually 1 for the latest)
      projectName
    );
    
    // Get detailed content for each change (with size limits for safety)
    const MAX_FILE_SIZE = 100000; // Limit file size to 100KB for performance
    const enhancedChanges = await Promise.all((changes.changeEntries || []).map(async (change: any) => {
      const filePath = change.item?.path || '';
      let originalContent = null;
      let modifiedContent = null;
      
      // Skip folders or binary files
      const isBinary = this.isBinaryFile(filePath);
      const isFolder = change.item?.isFolder === true;
      
      if (!isFolder && !isBinary && change.item) {
        try {
          // Get original content if the file wasn't newly added
          if (change.changeType !== 'add' && change.originalObjectId) {
            try {
              const originalItemContent = await this.gitClient.getItemContent(
                repositoryId,
                filePath,
                projectName,
                change.originalObjectId,
                undefined,
                true,
                true
              );
              
              // Check if the content is too large
              if (originalItemContent && originalItemContent.length < MAX_FILE_SIZE) {
                originalContent = originalItemContent.toString('utf8');
              } else {
                originalContent = '(File too large to display)';
              }
            } catch (error) {
              console.error(`Error getting original content for ${filePath}:`, error);
              originalContent = '(Content unavailable)';
            }
          }
          
          // Get modified content if the file wasn't deleted
          if (change.changeType !== 'delete' && change.item.objectId) {
            try {
              const modifiedItemContent = await this.gitClient.getItemContent(
                repositoryId,
                filePath,
                projectName,
                change.item.objectId,
                undefined,
                true,
                true
              );
              
              // Check if the content is too large
              if (modifiedItemContent && modifiedItemContent.length < MAX_FILE_SIZE) {
                modifiedContent = modifiedItemContent.toString('utf8');
              } else {
                modifiedContent = '(File too large to display)';
              }
            } catch (error) {
              console.error(`Error getting modified content for ${filePath}:`, error);
              modifiedContent = '(Content unavailable)';
            }
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
      
      // Create enhanced change object
      const enhancedChange: PullRequestChange = {
        ...change,
        originalContent,
        modifiedContent
      } as PullRequestChange;
      
      return enhancedChange;
    }));
    
    return {
      changeEntries: enhancedChanges,
      totalCount: enhancedChanges.length
    };
  }
  
  /**
   * Helper function to determine if a file is likely binary based on extension
   */
  private isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
      '.zip', '.tar', '.gz', '.rar', '.7z',
      '.exe', '.dll', '.so', '.dylib',
      '.bin', '.dat', '.class'
    ];
    
    const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(extension);
  }

  /**
   * Create a comment on a pull request
   */
  async createPullRequestComment(params: PullRequestCommentRequest): Promise<PullRequestCommentResponse> {
    await this.initialize();
    
    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }
    
    const { repositoryId, pullRequestId, project, content, threadId, filePath, lineNumber, parentCommentId, status } = params;
    
    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;
    
    if (!projectName) {
      throw new Error('Project name is required');
    }
    
    let commentResponse: PullRequestCommentResponse | null = null;
    
    try {
      // Case 1: Adding a comment to an existing thread
      if (threadId) {
        // Create comment on existing thread
        const comment = await this.gitClient.createComment({
          content,
          parentCommentId
        }, repositoryId, pullRequestId, threadId, projectName);
        
        commentResponse = {
          id: comment.id || 0,
          content: comment.content || '',
          threadId,
          status: comment.status,
          author: comment.author,
          createdDate: comment.publishedDate,
          url: comment.url
        };
      } 
      // Case 2: Creating a new thread with a comment
      else {
        // Set up the new thread
        const threadContext: any = {};
        
        if (filePath) {
          // Comment on a file
          threadContext.filePath = filePath;
          
          // If line number is provided, set up position
          if (lineNumber) {
            threadContext.rightFileStart = {
              line: lineNumber,
              offset: 1
            };
            threadContext.rightFileEnd = {
              line: lineNumber,
              offset: 1
            };
          }
        }
        
        // Create a new thread with our comment
        const newThread = await this.gitClient.createThread({
          comments: [{
            content,
            parentCommentId
          }],
          status,
          threadContext
        }, repositoryId, pullRequestId, projectName);
        
        // Extract the created comment from the thread
        const createdComment = newThread.comments && newThread.comments.length > 0 ? 
          newThread.comments[0] : null;
        
        if (createdComment && newThread.id) {
          commentResponse = {
            id: createdComment.id || 0,
            content: createdComment.content || '',
            threadId: newThread.id,
            status: createdComment.status,
            author: createdComment.author,
            createdDate: createdComment.publishedDate,
            url: createdComment.url
          };
        } else {
          throw new Error('Failed to create comment on pull request');
        }
      }
      
      return commentResponse || {
        id: 0,
        content: '',
        threadId: threadId || 0,
        status: 'unknown'
      };
    } catch (error) {
      console.error('Error creating pull request comment:', error);
      throw new Error(`Failed to create comment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export the class and create a singleton instance
export { AzureDevOpsService };
export const azureDevOpsService = new AzureDevOpsService(); 