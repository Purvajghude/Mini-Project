package com.mesh.connections;

import com.mesh.common.ApiException;
import com.mesh.profiles.StudentProfileRepository;
import com.mesh.profiles.StudentProfile;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ConnectionServiceTest {
    private final StudentProfileRepository profiles = mock(StudentProfileRepository.class);
    private final DiscoveryDecisionRepository decisions = mock(DiscoveryDecisionRepository.class);
    private final UserBlockRepository blocks = mock(UserBlockRepository.class);
    private final ConnectionRequestRepository requests = mock(ConnectionRequestRepository.class);
    private final CollaborationConnectionRepository connections = mock(CollaborationConnectionRepository.class);
    private final ConnectionService service = new ConnectionService(profiles, decisions, blocks, requests, connections);
    private final UUID sender = UUID.randomUUID();
    private final UUID recipient = UUID.randomUUID();

    @Test void fresh_request_is_saved_instead_of_mistaken_for_a_duplicate() {
        when(profiles.existsById(sender)).thenReturn(true);
        when(profiles.existsById(recipient)).thenReturn(true);
        StudentProfile senderProfile = mock(StudentProfile.class);
        when(senderProfile.getUserId()).thenReturn(sender);
        when(profiles.findById(sender)).thenReturn(Optional.of(senderProfile));
        when(requests.findBySenderUserIdAndRecipientUserId(recipient, sender)).thenReturn(Optional.empty());
        when(requests.findBySenderUserIdAndRecipientUserId(sender, recipient)).thenReturn(Optional.empty());
        when(requests.save(any(ConnectionRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.requestConnection(sender, recipient);

        assertEquals(ConnectionRequest.Status.PENDING.name(), result.status());
        verify(requests).save(argThat(request -> request.getSenderUserId().equals(sender) && request.getRecipientUserId().equals(recipient)));
    }

    @Test void existing_pending_request_still_conflicts() {
        when(profiles.existsById(sender)).thenReturn(true);
        when(profiles.existsById(recipient)).thenReturn(true);
        when(requests.findBySenderUserIdAndRecipientUserId(sender, recipient)).thenReturn(Optional.of(new ConnectionRequest(sender, recipient)));

        ApiException error = assertThrows(ApiException.class, () -> service.requestConnection(sender, recipient));

        assertEquals(HttpStatus.CONFLICT, error.status());
        assertEquals("A connection request is already pending.", error.getMessage());
        verify(requests, never()).save(any());
    }

    @Test void blocked_recipient_still_returns_forbidden() {
        when(profiles.existsById(recipient)).thenReturn(true);
        when(blocks.existsByBlockerUserIdAndBlockedUserId(sender, recipient)).thenReturn(true);
        ApiException error = assertThrows(ApiException.class, () -> service.requestConnection(sender, recipient));
        assertEquals(HttpStatus.FORBIDDEN, error.status());
        verify(requests, never()).save(any());
    }

    @Test void existing_connection_still_conflicts() {
        when(profiles.existsById(recipient)).thenReturn(true);
        UUID first = sender.compareTo(recipient) < 0 ? sender : recipient;
        UUID second = sender.compareTo(recipient) < 0 ? recipient : sender;
        when(connections.existsByUserOneIdAndUserTwoId(first, second)).thenReturn(true);
        ApiException error = assertThrows(ApiException.class, () -> service.requestConnection(sender, recipient));
        assertEquals(HttpStatus.CONFLICT, error.status());
        assertEquals("You are already connected.", error.getMessage());
        verify(requests, never()).save(any());
    }
}
