package com.mesh.tasks;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}/tasks")
public class ProjectTaskController {
    private final ProjectTaskService tasks;
    public ProjectTaskController(ProjectTaskService tasks) { this.tasks = tasks; }
    @GetMapping public List<ProjectTaskService.TaskResponse> list(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return tasks.list(userId, projectId); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ProjectTaskService.TaskResponse create(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody CreateTaskBody body) { return tasks.create(userId, projectId, new ProjectTaskService.CreateTaskRequest(body.title(), body.description(), body.assigneeUserId(), body.dueDate())); }
    @PutMapping("/{taskId}") public ProjectTaskService.TaskResponse update(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @PathVariable UUID taskId, @Valid @RequestBody UpdateTaskBody body) { return tasks.update(userId, projectId, taskId, new ProjectTaskService.UpdateTaskRequest(body.title(), body.description(), body.status(), body.assigneeUserId(), body.dueDate())); }
    @DeleteMapping("/{taskId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @PathVariable UUID taskId) { tasks.delete(userId, projectId, taskId); }
    public record CreateTaskBody(@NotBlank @Size(max = 160) String title, @Size(max = 2000) String description, UUID assigneeUserId, LocalDate dueDate) { }
    public record UpdateTaskBody(@NotBlank @Size(max = 160) String title, @Size(max = 2000) String description, @NotNull ProjectTask.Status status, UUID assigneeUserId, LocalDate dueDate) { }
}
