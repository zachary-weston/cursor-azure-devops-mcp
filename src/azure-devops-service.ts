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
  PullRequestCommentResponse,
  PullRequestFileContent,
} from './types.js';

/**
 * Helper function to safely stringify objects with circular references
 */
function safeStringify(obj: any): string {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Skip _httpMessage, socket and similar properties that cause circular references
    if (key === '_httpMessage' || key === 'socket' || key === 'connection' || key === 'agent') {
      return '[Circular]';
    }
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}

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
      project: projectName,
    });

    return pullRequests;
  }

  /**
   * Get a specific pull request by ID
   */
  async getPullRequestById(
    repositoryId: string,
    pullRequestId: number,
    project?: string
  ): Promise<GitPullRequest> {
    await this.initialize();

    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }

    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;

    if (!projectName) {
      throw new Error('Project name is required');
    }

    const pullRequest = await this.gitClient.getPullRequestById(
      pullRequestId,
      repositoryId,
      projectName
    );
    return pullRequest;
  }

  /**
   * Get threads (comments) for a pull request
   */
  async getPullRequestThreads(
    repositoryId: string,
    pullRequestId: number,
    project?: string
  ): Promise<GitPullRequestCommentThread[]> {
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
      gitClient: this.gitClient,
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
    const attachmentRelations = workItem.relations.filter(
      (relation: any) => relation.rel === 'AttachedFile' || relation.rel === 'Hyperlink'
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
        contentType: attributes.resourceType || '',
      };

      return attachment;
    });

    return attachments;
  }

  /**
   * Get detailed changes for a pull request
   */
  async getPullRequestChanges(
    repositoryId: string,
    pullRequestId: number,
    project?: string
  ): Promise<PullRequestChanges> {
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

    // File size and content handling constants
    const MAX_INLINE_FILE_SIZE = 500000; // Increased to 500KB for inline content
    const MAX_CHUNK_SIZE = 100000; // 100KB chunks for larger files
    const PREVIEW_SIZE = 10000; // 10KB preview for very large files

    // Get detailed content for each change
    const enhancedChanges = await Promise.all(
      (changes.changeEntries || []).map(async (change: any) => {
        const filePath = change.item?.path || '';
        let originalContent = null;
        let modifiedContent = null;
        let originalContentSize = 0;
        let modifiedContentSize = 0;
        let originalContentPreview = null;
        let modifiedContentPreview = null;

        // Skip folders or binary files
        const isBinary = this.isBinaryFile(filePath);
        const isFolder = change.item?.isFolder === true;

        if (!isFolder && !isBinary && change.item) {
          try {
            // Get original content if the file wasn't newly added
            if (change.changeType !== 'add' && change.originalObjectId) {
              try {
                // First get the item metadata to check file size
                const originalItem = await this.gitClient.getItem(
                  repositoryId,
                  filePath,
                  projectName,
                  change.originalObjectId
                );

                originalContentSize = originalItem?.contentMetadata?.contentLength || 0;

                // For files within the inline limit, get full content
                if (originalContentSize <= MAX_INLINE_FILE_SIZE) {
                  const originalItemContent = await this.gitClient.getItemContent(
                    repositoryId,
                    filePath,
                    projectName,
                    change.originalObjectId,
                    undefined,
                    true,
                    true
                  );

                  originalContent = originalItemContent.toString('utf8');
                }
                // For large files, get a preview
                else {
                  // Get just the beginning of the file for preview
                  const previewContent = await this.gitClient.getItemText(
                    repositoryId,
                    filePath,
                    projectName,
                    change.originalObjectId,
                    0, // Start at beginning
                    PREVIEW_SIZE // Get preview bytes
                  );

                  originalContentPreview = previewContent;
                  originalContent = `(File too large to display inline - ${Math.round(originalContentSize / 1024)}KB. Preview shown.)`;
                }
              } catch (error) {
                console.error(`Error getting original content for ${filePath}:`, error);
                originalContent = '(Content unavailable)';
              }
            }

            // Get modified content if the file wasn't deleted
            if (change.changeType !== 'delete' && change.item.objectId) {
              try {
                // First get the item metadata to check file size
                const modifiedItem = await this.gitClient.getItem(
                  repositoryId,
                  filePath,
                  projectName,
                  change.item.objectId
                );

                modifiedContentSize = modifiedItem?.contentMetadata?.contentLength || 0;

                // For files within the inline limit, get full content
                if (modifiedContentSize <= MAX_INLINE_FILE_SIZE) {
                  const modifiedItemContent = await this.gitClient.getItemContent(
                    repositoryId,
                    filePath,
                    projectName,
                    change.item.objectId,
                    undefined,
                    true,
                    true
                  );

                  modifiedContent = modifiedItemContent.toString('utf8');
                }
                // For large files, get a preview
                else {
                  // Get just the beginning of the file for preview
                  const previewContent = await this.gitClient.getItemText(
                    repositoryId,
                    filePath,
                    projectName,
                    change.item.objectId,
                    0, // Start at beginning
                    PREVIEW_SIZE // Get preview bytes
                  );

                  modifiedContentPreview = previewContent;
                  modifiedContent = `(File too large to display inline - ${Math.round(modifiedContentSize / 1024)}KB. Preview shown.)`;
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
          modifiedContent,
          originalContentSize,
          modifiedContentSize,
          originalContentPreview,
          modifiedContentPreview,
          isBinary,
          isFolder,
        } as PullRequestChange;

        return enhancedChange;
      })
    );

    return {
      changeEntries: enhancedChanges,
      totalCount: enhancedChanges.length,
    };
  }

  /**
   * Get content for a specific file in a pull request by chunks
   * This allows retrieving parts of large files that can't be displayed inline
   */
  async getPullRequestFileContent(
    repositoryId: string,
    pullRequestId: number,
    filePath: string,
    objectId: string,
    startPosition: number,
    length: number,
    project?: string
  ): Promise<PullRequestFileContent> {
    await this.initialize();

    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }

    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;

    if (!projectName) {
      throw new Error('Project name is required');
    }

    try {
      // Check if the file is binary first
      if (this.isBinaryFile(filePath)) {
        try {
          // Get metadata about the file to know its full size
          const item = await this.gitClient.getItem(repositoryId, filePath, projectName, objectId);

          const fileSize = item?.contentMetadata?.contentLength || 0;

          return {
            content: `[Binary file not displayed - ${Math.round(fileSize / 1024)}KB]`,
            size: fileSize,
            position: startPosition,
            length: 0,
          };
        } catch (error) {
          console.error(`Error getting binary file info: ${error}`);
          return {
            content: '[Binary file - Unable to retrieve size information]',
            size: 0,
            position: startPosition,
            length: 0,
            error: `Failed to get binary file info: ${(error as Error).message}`,
          };
        }
      }

      // Get metadata about the file to know its full size
      const item = await this.gitClient.getItem(repositoryId, filePath, projectName, objectId);

      const fileSize = item?.contentMetadata?.contentLength || 0;

      // Get the content - handle potential errors and circular references
      let rawContent;
      try {
        rawContent = await this.gitClient.getItemText(
          repositoryId,
          filePath,
          projectName,
          objectId,
          startPosition,
          length
        );
      } catch (textError) {
        console.error(`Error fetching file text: ${textError}`);
        // If direct text access fails, try using the branch approach
        try {
          // Get the PR details to find the source branch
          const pullRequest = await this.getPullRequestById(
            repositoryId,
            pullRequestId,
            projectName
          );

          // Try the source branch first
          if (pullRequest.sourceRefName) {
            const branchResult = await this.getFileFromBranch(
              repositoryId,
              filePath,
              pullRequest.sourceRefName,
              startPosition,
              length,
              projectName
            );

            if (!branchResult.error) {
              return branchResult;
            }
          }

          // If source branch fails, try target branch
          if (pullRequest.targetRefName) {
            const branchResult = await this.getFileFromBranch(
              repositoryId,
              filePath,
              pullRequest.targetRefName,
              startPosition,
              length,
              projectName
            );

            if (!branchResult.error) {
              return branchResult;
            }
          }

          throw new Error('Failed to retrieve content using branch approach');
        } catch (branchError) {
          throw new Error(`Failed to retrieve content: ${(branchError as Error).message}`);
        }
      }

      // Ensure content is a proper string
      let content = '';
      if (typeof rawContent === 'string') {
        content = rawContent;
      } else if (rawContent && typeof rawContent === 'object') {
        // If it's an object but not a string, try to convert it safely
        try {
          content = safeStringify(rawContent);
        } catch (stringifyError) {
          console.error(`Error stringifying content: ${stringifyError}`);
          content = '[Content could not be displayed due to format issues]';
        }
      }

      return {
        content,
        size: fileSize,
        position: startPosition,
        length: content.length,
      };
    } catch (error) {
      console.error(`Error getting file content for ${filePath}:`, error);
      return {
        content: '',
        size: 0,
        position: startPosition,
        length: 0,
        error: `Failed to retrieve content for file: ${filePath}. Error: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Helper function to determine if a file is likely binary based on extension
   */
  private isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.ico',
      '.svg',
      '.pdf',
      '.doc',
      '.docx',
      '.ppt',
      '.pptx',
      '.xls',
      '.xlsx',
      '.zip',
      '.tar',
      '.gz',
      '.rar',
      '.7z',
      '.exe',
      '.dll',
      '.so',
      '.dylib',
      '.bin',
      '.dat',
      '.class',
    ];

    const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(extension);
  }

  /**
   * Helper method to get a file's content from a specific branch
   * This is useful for accessing files in pull requests when direct object ID access fails
   */
  async getFileFromBranch(
    repositoryId: string,
    filePath: string,
    branchName: string,
    startPosition = 0,
    length = 100000,
    project?: string
  ): Promise<PullRequestFileContent> {
    await this.initialize();

    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }

    // Use the provided project or fall back to the default project
    const projectName = project || this.defaultProject;

    if (!projectName) {
      throw new Error('Project name is required');
    }

    try {
      // Clean branch name (remove refs/heads/ if present)
      const cleanBranchName = branchName.replace(/^refs\/heads\//, '');

      // Get the branch reference to find the latest commit
      const refs = await this.gitClient.getRefs(
        repositoryId,
        projectName,
        `heads/${cleanBranchName}`
      );

      if (!refs || refs.length === 0) {
        return {
          content: '',
          size: 0,
          position: startPosition,
          length: 0,
          error: `Branch reference not found for ${cleanBranchName}`,
        };
      }

      const commitId = refs[0].objectId;

      // Get metadata about the file to know its full size
      try {
        const item = await this.gitClient.getItem(repositoryId, filePath, projectName, undefined, {
          versionDescriptor: {
            version: commitId,
            versionOptions: 0, // Use exact version
            versionType: 1, // Commit
          },
        });

        const fileSize = item?.contentMetadata?.contentLength || 0;

        // Handle binary files
        if (this.isBinaryFile(filePath)) {
          return {
            content: `[Binary file not displayed - ${Math.round(fileSize / 1024)}KB]`,
            size: fileSize,
            position: startPosition,
            length: 0,
            error: undefined,
          };
        }

        // Get the content - carefully handle the response to prevent circular references
        let rawContent;
        try {
          rawContent = await this.gitClient.getItemText(
            repositoryId,
            filePath,
            projectName,
            undefined,
            startPosition,
            length,
            {
              versionDescriptor: {
                version: commitId,
                versionOptions: 0, // Use exact version
                versionType: 1, // Commit
              },
            }
          );
        } catch (textError) {
          console.error(`Error fetching file text: ${textError}`);
          // If getItemText fails, try to get content as Buffer and convert it
          const contentBuffer = await this.gitClient.getItemContent(
            repositoryId,
            filePath,
            projectName,
            undefined,
            {
              versionDescriptor: {
                version: commitId,
                versionOptions: 0,
                versionType: 1,
              },
            }
          );

          if (Buffer.isBuffer(contentBuffer)) {
            rawContent = contentBuffer.toString('utf8');
          } else {
            throw new Error('Failed to retrieve file content in any format');
          }
        }

        // Ensure content is a proper string
        let content = '';
        if (typeof rawContent === 'string') {
          content = rawContent;
        } else if (rawContent && typeof rawContent === 'object') {
          // If it's an object but not a string, try to convert it safely
          try {
            content = safeStringify(rawContent);
          } catch (stringifyError) {
            console.error(`Error stringifying content: ${stringifyError}`);
            content = '[Content could not be displayed due to format issues]';
          }
        }

        return {
          content,
          size: fileSize,
          position: startPosition,
          length: content.length,
        };
      } catch (error) {
        console.error(`Error getting file from branch: ${error}`);
        return {
          content: '',
          size: 0,
          position: startPosition,
          length: 0,
          error: `Failed to retrieve file from branch ${cleanBranchName}: ${(error as Error).message}`,
        };
      }
    } catch (error) {
      console.error(`Error accessing branch ${branchName}:`, error);
      return {
        content: '',
        size: 0,
        position: startPosition,
        length: 0,
        error: `Failed to access branch ${branchName}: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Create a comment on a pull request
   */
  async createPullRequestComment(
    params: PullRequestCommentRequest
  ): Promise<PullRequestCommentResponse> {
    await this.initialize();

    if (!this.gitClient) {
      throw new Error('Git client not initialized');
    }

    const {
      repositoryId,
      pullRequestId,
      project,
      content,
      threadId,
      filePath,
      lineNumber,
      parentCommentId,
      status,
    } = params;

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
        const comment = await this.gitClient.createComment(
          {
            content,
            parentCommentId,
          },
          repositoryId,
          pullRequestId,
          threadId,
          projectName
        );

        commentResponse = {
          id: comment.id || 0,
          content: comment.content || '',
          threadId,
          status: comment.status,
          author: comment.author,
          createdDate: comment.publishedDate,
          url: comment.url,
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
              offset: 1,
            };
            threadContext.rightFileEnd = {
              line: lineNumber,
              offset: 1,
            };
          }
        }

        // Create a new thread with our comment
        const newThread = await this.gitClient.createThread(
          {
            comments: [
              {
                content,
                parentCommentId,
              },
            ],
            status,
            threadContext,
          },
          repositoryId,
          pullRequestId,
          projectName
        );

        // Extract the created comment from the thread
        const createdComment =
          newThread.comments && newThread.comments.length > 0 ? newThread.comments[0] : null;

        if (createdComment && newThread.id) {
          commentResponse = {
            id: createdComment.id || 0,
            content: createdComment.content || '',
            threadId: newThread.id,
            status: createdComment.status,
            author: createdComment.author,
            createdDate: createdComment.publishedDate,
            url: createdComment.url,
          };
        } else {
          throw new Error('Failed to create comment on pull request');
        }
      }

      return (
        commentResponse || {
          id: 0,
          content: '',
          threadId: threadId || 0,
          status: 'unknown',
        }
      );
    } catch (error) {
      console.error('Error creating pull request comment:', error);
      throw new Error(
        `Failed to create comment: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Export the class and create a singleton instance
export { AzureDevOpsService };
export const azureDevOpsService = new AzureDevOpsService();
