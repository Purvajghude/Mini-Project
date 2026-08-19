package com.meshconnect.service;

import com.meshconnect.dto.MatchDto;
import com.meshconnect.dto.ProfileDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Match;
import com.meshconnect.entity.Message;
import com.meshconnect.exception.ForbiddenException;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.MatchRepository;
import com.meshconnect.repository.MessageRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MatchService {
    private final CurrentUserService currentUser;
    private final MatchRepository matches;
    private final MessageRepository messages;
    private final ProfileService profiles;

    public MatchService(CurrentUserService currentUser, MatchRepository matches, MessageRepository messages, ProfileService profiles) {
        this.currentUser = currentUser;
        this.matches = matches;
        this.messages = messages;
        this.profiles = profiles;
    }

    @Transactional(readOnly = true)
    public List<MatchDto.MatchResponse> listMine() {
        AppUser me = currentUser.requireUser();
        return matches.findByUserOneIdOrUserTwoIdOrderByCreatedAtDesc(me.getId(), me.getId()).stream().map(match -> {
            AppUser other = match.otherMember(me.getId());
            Message latest = messages.findFirstByMatchIdOrderBySentAtDesc(match.getId()).orElse(null);
            ProfileDto.PublicProfileResponse collaborator = profiles.publicProfile(other.getId());
            return new MatchDto.MatchResponse(match.getId(), match.getCreatedAt(), collaborator,
                    latest == null ? null : latest.getContent(), latest == null ? null : latest.getSentAt());
        }).toList();
    }

    /**
     * Reading a conversation also marks the other member's messages as read, so this
     * must be a writable transaction - a read-only one puts Hibernate in manual flush
     * mode and the read receipts would be dropped silently at commit.
     */
    @Transactional
    public List<MatchDto.MessageResponse> messages(Long matchId) {
        AppUser me = currentUser.requireUser();
        Match match = requireParticipant(matchId, me.getId());
        List<Message> conversation = messages.findByMatchIdOrderBySentAtAsc(match.getId());
        Instant now = Instant.now();
        conversation.stream()
                .filter(message -> !message.getSender().getId().equals(me.getId()) && message.getReadAt() == null)
                .forEach(message -> message.setReadAt(now));
        return conversation.stream().map(this::toMessageResponse).toList();
    }

    @Transactional
    public MatchDto.MessageResponse send(Long matchId, MatchDto.SendMessageRequest request) {
        AppUser me = currentUser.requireUser();
        Match match = requireParticipant(matchId, me.getId());
        Message message = messages.save(new Message(match, me, request.content().trim()));
        return toMessageResponse(message);
    }

    @Transactional(readOnly = true)
    public Match requireParticipant(Long matchId, Long userId) {
        Match match = matches.findById(matchId).orElseThrow(() -> new NotFoundException("Match not found"));
        if (!match.includes(userId)) throw new ForbiddenException("You are not a participant in this match");
        return match;
    }

    private MatchDto.MessageResponse toMessageResponse(Message message) {
        return new MatchDto.MessageResponse(message.getId(), message.getSender().getId(), message.getContent(), message.getSentAt(), message.getReadAt());
    }
}
