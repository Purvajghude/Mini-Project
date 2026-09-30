export type ResourceType = 'Roadmap' | 'How to build X';

export type ResourceProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  category: string;
  description: string;
  url: string;
  source: 'roadmap.sh' | 'build-your-own-x' | 'GitHub';
  technologies: string[];
  skills: string[];
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime?: string;
  featured?: boolean;
}

export interface SavedResource {
  resourceId: string;
  savedAt: string;
  status: ResourceProgressStatus;
  notes?: string;
}
