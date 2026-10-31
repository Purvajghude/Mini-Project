import React, { useState } from 'react';
import {
  BlueprintSuggestion,
  BlueprintSuggestionRequest,
  Project,
  ProjectRequirement,
  ReplaceProjectRequirements,
  Skill,
} from '../../types/api';
import { api } from '../../api';
import { ProjectIdeaInput } from './ProjectIdeaInput';
import { BlueprintEditor } from './BlueprintEditor';

export interface ProjectCreationWizardProps {
  availableSkills: Skill[];
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
  onToast: (msg: string) => void;
}

export const ProjectCreationWizard: React.FC<ProjectCreationWizardProps> = ({
  availableSkills,
  onProjectCreated,
  onCancel,
  onToast,
}) => {
  const [step, setStep] = useState<'IDEA' | 'BLUEPRINT'>('IDEA');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintSuggestion | null>(null);

  // Stage 1: Generate Blueprint from natural language idea
  const handleGenerateBlueprint = async (request: BlueprintSuggestionRequest) => {
    setIsGenerating(true);
    try {
      const suggestion = await api.suggestProjectBlueprint(request);
      setBlueprint(suggestion);
      setStep('BLUEPRINT');
      onToast('Project blueprint generated! Review and customize the requirements.');
    } catch (err: any) {
      onToast(err.message || 'Could not generate blueprint. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Stage 2: Save Project and persist requirements
  const handleSaveBlueprint = async (payload: {
    title: string;
    summary: string;
    domain: string | null;
    requirementsData: ReplaceProjectRequirements;
  }) => {
    setIsSaving(true);
    try {
      // 1. Create the project container via POST /projects
      const createdProject = await api.createProject({
        title: payload.title,
        description: payload.summary,
        category: payload.domain || 'Student collaboration',
        slug: payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: payload.requirementsData.lifecycle === 'DRAFT' ? 'PLANNING' : 'ACTIVE',
        lead: { id: '', displayName: '', username: '' }, // Handled by backend
        members: [],
        openRoles: [],
        tags: payload.domain ? [payload.domain] : [],
        tasks: [],
        events: [],
        availabilityPolls: [],
      });

      // 2. Persist project requirements via PUT /projects/{id}/requirements
      try {
        await api.replaceProjectRequirements(createdProject.id, {
          targetTeamSize: payload.requirementsData.targetTeamSize,
          lifecycle: payload.requirementsData.lifecycle,
          requirements: payload.requirementsData.requirements,
        });
      } catch (reqErr: any) {
        console.warn('Could not save detailed requirements:', reqErr);
        onToast('Project created, but requirements sync encountered a warning.');
      }

      onToast(`Project "${createdProject.title}" created successfully!`);
      onProjectCreated(createdProject);
    } catch (err: any) {
      onToast(err.message || 'Failed to create project.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '8px 0 24px 0' }}>
      {step === 'IDEA' && (
        <ProjectIdeaInput
          onSubmit={handleGenerateBlueprint}
          isLoading={isGenerating}
        />
      )}

      {step === 'BLUEPRINT' && blueprint && (
        <BlueprintEditor
          initialBlueprint={blueprint}
          availableSkills={availableSkills}
          onSave={handleSaveBlueprint}
          onBackToIdea={() => setStep('IDEA')}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};

