package com.mesh.projects;

import com.mesh.common.ApiException;
import com.mesh.common.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ProjectInvitationHttpTest {
    @Test void send_incoming_and_accept_use_documented_routes() throws Exception {
        ProjectInvitationService service = mock(ProjectInvitationService.class);
        UUID ownerId = UUID.randomUUID(), inviteeId = UUID.randomUUID(), projectId = UUID.randomUUID(), invitationId = UUID.randomUUID();
        var pending = new ProjectInvitationService.InvitationResponse(invitationId, projectId, "Demo", ownerId, "Student A", inviteeId, "PENDING", null, null);
        var accepted = new ProjectInvitationService.InvitationResponse(invitationId, projectId, "Demo", ownerId, "Student A", inviteeId, "ACCEPTED", null, null);
        when(service.send(ownerId, projectId, inviteeId)).thenReturn(pending);
        when(service.incoming(ownerId)).thenReturn(List.of(pending));
        when(service.accept(ownerId, invitationId)).thenReturn(accepted);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(ownerId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(new ProjectInvitationController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(post("/projects/{projectId}/invitations", projectId).contentType("application/json")
                    .content("{\"inviteeUserId\":\"" + inviteeId + "\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING"));
            mvc.perform(get("/project-invitations/incoming"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].projectName").value("Demo"));
            mvc.perform(patch("/project-invitations/{invitationId}/accept", invitationId))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACCEPTED"));
            mvc.perform(post("/projects/{projectId}/invitations", projectId).contentType("application/json").content("{}"))
                .andExpect(status().isBadRequest());
        } finally { SecurityContextHolder.clearContext(); }
    }

    @Test void owner_rejection_is_403() throws Exception {
        ProjectInvitationService service = mock(ProjectInvitationService.class);
        UUID userId = UUID.randomUUID(), projectId = UUID.randomUUID(), inviteeId = UUID.randomUUID();
        when(service.send(userId, projectId, inviteeId)).thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Only the project owner can perform this action."));
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, "n/a"));
        try {
            var mvc = MockMvcBuilders.standaloneSetup(new ProjectInvitationController(service))
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new ApiExceptionHandler()).build();
            mvc.perform(post("/projects/{projectId}/invitations", projectId).contentType("application/json")
                    .content("{\"inviteeUserId\":\"" + inviteeId + "\"}"))
                .andExpect(status().isForbidden());
        } finally { SecurityContextHolder.clearContext(); }
    }
}
