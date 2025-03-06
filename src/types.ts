/**
 * Type definitions for the Azure DevOps MCP Server
 */

// Azure DevOps Team Project
export interface TeamProject {
  id: string;
  name: string;
  description?: string;
  url?: string;
  state?: string;
  revision?: number;
  visibility?: string;
  lastUpdateTime?: string;
}

// Azure DevOps Work Item
export interface WorkItem {
  id: number;
  rev?: number;
  fields?: Record<string, any>;
  relations?: WorkItemRelation[];
  url?: string;
}

// Azure DevOps Work Item Relation
export interface WorkItemRelation {
  rel: string;
  url: string;
  attributes?: Record<string, any>;
}

// Azure DevOps Git Repository
export interface GitRepository {
  id: string;
  name: string;
  url?: string;
  project?: {
    id: string;
    name: string;
  };
  defaultBranch?: string;
  size?: number;
  remoteUrl?: string;
  webUrl?: string;
}

// Azure DevOps Pull Request
export interface GitPullRequest {
  pullRequestId: number;
  repoId: string;
  repository?: GitRepository;
  creationDate?: string;
  title?: string;
  description?: string;
  sourceRefName?: string;
  targetRefName?: string;
  status?: string;
  createdBy?: {
    displayName?: string;
    id?: string;
    uniqueName?: string;
  };
  lastMergeSourceCommit?: {
    commitId?: string;
  };
  lastMergeTargetCommit?: {
    commitId?: string;
  };
  url?: string;
}

// Azure DevOps Pull Request Comment Thread
export interface GitPullRequestCommentThread {
  id: number;
  pullRequestThreadContext?: {
    changeTrackingId?: number;
    iterationContext?: {
      firstComparingIteration?: number;
      secondComparingIteration?: number;
    };
  };
  status?: string;
  threadContext?: {
    filePath?: string;
    rightFileStart?: {
      line?: number;
      offset?: number;
    };
    rightFileEnd?: {
      line?: number;
      offset?: number;
    };
  };
  comments?: {
    id?: number;
    parentCommentId?: number;
    content?: string;
    publishedDate?: string;
    lastUpdatedDate?: string;
    author?: {
      displayName?: string;
      id?: string;
      uniqueName?: string;
    };
  }[];
}

// Azure DevOps API Clients
export interface ApiClients {
  projectClient: any;
  workItemClient: any;
  gitClient: any;
} 