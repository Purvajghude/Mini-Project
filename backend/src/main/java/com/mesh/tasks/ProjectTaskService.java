package com.mesh.tasks;

import com.mesh.common.ApiException;
import com.mesh.projects.ProjectAccessService;
import com.mesh.projects.ProjectMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectTaskService {
    private final ProjectTaskRepository tasks;
    private final ProjectMemberRepository members;
    private final ProjectAccessService access;
    public ProjectTaskService(ProjectTaskRepository tasks, ProjectMemberRepository members, ProjectAccessService access) { this.tasks = tasks; this.members = members; this.access = access; }
    @Transactional(readOnly = true)
    public List<TaskResponse> list(UUID userId, UUID projectId) { access.requireMember(projectId, userId); return tasks.findByProjectIdOrderByStatusAscDueDateAscCreatedAtAsc(projectId).stream().map(this::response).toList(); }
    @Transactional
    public TaskResponse create(UUID userId, UUID projectId, CreateTaskRequest request) {
        access.requireMember(projectId, userId);
        validateAssignee(projectId, request.assigneeUserId());
        return response(tasks.save(new ProjectTask(projectId, request.title().trim(), nullable(request.description()), request.assigneeUserId(), request.dueDate(), userId)));
    }
    @Transactional
    public TaskResponse update(UUID userId, UUID projectId, UUID taskId, UpdateTaskRequest request) {
        access.requireMember(projectId, userId);
        ProjectTask task = tasks.findById(taskId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task was not found."));
        if (!task.getProjectId().equals(projectId)) throw new ApiException(HttpStatus.NOT_FOUND, "Task was not found.");
        validateAssignee(projectId, request.assigneeUserId());
        task.update(request.title().trim(), nullable(request.description()), request.status(), request.assigneeUserId(), request.dueDate());
        return response(task);
    }
    @Transactional
    public void delete(UUID userId, UUID projectId, UUID taskId) {
        access.requireMember(projectId, userId);
        ProjectTask task = tasks.findById(taskId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task was not found."));
        if (!task.getProjectId().equals(projectId)) throw new ApiException(HttpStatus.NOT_FOUND, "Task was not found.");
        tasks.delete(task);
    }
    private void validateAssignee(UUID projectId, UUID assigneeId) {
        if (assigneeId != null && !members.existsByProjectIdAndUserId(projectId, assigneeId)) throw new ApiException(HttpStatus.BAD_REQUEST, "Task assignee must be a project member.");
    }
    private String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private TaskResponse response(ProjectTask task) { return new TaskResponse(task.getId(), task.getProjectId(), task.getTitle(), task.getDescription(), task.getStatus().name(), task.getAssigneeUserId(), task.getDueDate(), task.getCreatedByUserId(), task.getCreatedAt(), task.getUpdatedAt()); }
    public record CreateTaskRequest(String title, String description, UUID assigneeUserId, LocalDate dueDate) { }
    public record UpdateTaskRequest(String title, String description, ProjectTask.Status status, UUID assigneeUserId, LocalDate dueDate) { }
    public record TaskResponse(UUID id, UUID projectId, String title, String description, String status, UUID assigneeUserId, LocalDate dueDate, UUID createdByUserId, Instant createdAt, Instant updatedAt) { }
}
