package com.meshconnect.service;

import com.meshconnect.dto.InterestDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Interest;
import com.meshconnect.entity.InterestStatus;
import com.meshconnect.entity.Match;
import com.meshconnect.exception.BadRequestException;
import com.meshconnect.exception.ConflictException;
import com.meshconnect.exception.ForbiddenException;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.AppUserRepository;
import com.meshconnect.repository.InterestRepository;
import com.meshconnect.repository.MatchRepository;
import com.meshconnect.repository.ProfileRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InterestService {
    private final CurrentUserService currentUser;
    private final AppUserRepository users;
    private final InterestRepository interests;
    private final MatchRepository matches;
    private final ProfileRepository profiles;
    private final BlockService blockService;

    public InterestService(CurrentUserService currentUser, AppUserRepository users, InterestRepository interests,
            MatchRepository matches, ProfileRepository profiles, BlockService blockService) {
        this.currentUser = currentUser;
        this.users = users;
        this.interests = interests;
        this.matches = matches;
        this.profiles = profiles;
        this.blockService = blockService;
    }

    @Transactional
    public InterestDto.InterestResponse send(Long targetId) {
        AppUser sender = currentUser.requireUser();
        if (sender.getId().equals(targetId)) throw new BadRequestException("You cannot send interest to yourself");
        AppUser receiver = users.findById(targetId).orElseThrow(() -> new NotFoundException("User not found"));
        if (!receiver.isActive()) throw new NotFoundException("User not found");
        if (blockService.blockedEitherWay(sender.getId(), targetId)) throw new ForbiddenException("You cannot contact this user");
        if (existingMatch(sender.getId(), targetId) != null) throw new ConflictException("You are already matched with this user");

        Interest reciprocal = interests.findBySenderIdAndReceiverId(targetId, sender.getId()).orElse(null);
        if (reciprocal != null && reciprocal.getStatus() == InterestStatus.PENDING) {
            reciprocal.setStatus(InterestStatus.ACCEPTED);
            Match match = createMatch(sender, receiver);
            return toResponse(reciprocal, match.getId());
        }

        Interest existing = interests.findBySenderIdAndReceiverId(sender.getId(), targetId).orElse(null);
        if (existing != null && existing.getStatus() == InterestStatus.PENDING) throw new ConflictException("Interest has already been sent");
        if (existing != null) {
            existing.setStatus(InterestStatus.PENDING);
            return toResponse(existing, null);
        }
        return toResponse(interests.save(new Interest(sender, receiver)), null);
    }

    /** The inbox: pending requests waiting on this user to accept or decline. */
    @Transactional(readOnly = true)
    public List<InterestDto.InterestResponse> incoming() {
        AppUser me = currentUser.requireUser();
        return interests.findByReceiverIdAndStatusOrderByCreatedAtDesc(me.getId(), InterestStatus.PENDING).stream()
                .filter(interest -> !blockService.blockedEitherWay(me.getId(), interest.getSender().getId()))
                .map(interest -> toResponse(interest, null))
                .toList();
    }

    /** Requests this user has sent that have not been answered yet. */
    @Transactional(readOnly = true)
    public List<InterestDto.InterestResponse> sent() {
        AppUser me = currentUser.requireUser();
        return interests.findBySenderIdAndStatusOrderByCreatedAtDesc(me.getId(), InterestStatus.PENDING).stream()
                .map(interest -> toResponse(interest, null))
                .toList();
    }

    @Transactional
    public InterestDto.InterestResponse accept(Long interestId) {
        AppUser receiver = currentUser.requireUser();
        Interest interest = interests.findById(interestId).orElseThrow(() -> new NotFoundException("Interest request not found"));
        if (!interest.getReceiver().getId().equals(receiver.getId())) throw new ForbiddenException("Only the recipient can accept this interest request");
        if (interest.getStatus() != InterestStatus.PENDING) throw new ConflictException("This request has already been handled");
        if (blockService.blockedEitherWay(interest.getSender().getId(), receiver.getId())) throw new ForbiddenException("You cannot contact this user");
        interest.setStatus(InterestStatus.ACCEPTED);
        Match match = createMatch(interest.getSender(), receiver);
        return toResponse(interest, match.getId());
    }

    @Transactional
    public InterestDto.InterestResponse decline(Long interestId) {
        AppUser receiver = currentUser.requireUser();
        Interest interest = interests.findById(interestId).orElseThrow(() -> new NotFoundException("Interest request not found"));
        if (!interest.getReceiver().getId().equals(receiver.getId())) throw new ForbiddenException("Only the recipient can decline this interest request");
        if (interest.getStatus() != InterestStatus.PENDING) throw new ConflictException("This request has already been handled");
        interest.setStatus(InterestStatus.DECLINED);
        return toResponse(interest, null);
    }

    private Match createMatch(AppUser firstCandidate, AppUser secondCandidate) {
        long firstId = Math.min(firstCandidate.getId(), secondCandidate.getId());
        long secondId = Math.max(firstCandidate.getId(), secondCandidate.getId());
        Match existing = matches.findByUserOneIdAndUserTwoId(firstId, secondId).orElse(null);
        if (existing != null) return existing;
        AppUser first = firstCandidate.getId().equals(firstId) ? firstCandidate : secondCandidate;
        AppUser second = firstCandidate.getId().equals(secondId) ? firstCandidate : secondCandidate;
        return matches.save(new Match(first, second));
    }

    private Match existingMatch(Long firstCandidate, Long secondCandidate) {
        return matches.findByUserOneIdAndUserTwoId(Math.min(firstCandidate, secondCandidate), Math.max(firstCandidate, secondCandidate)).orElse(null);
    }

    private InterestDto.InterestResponse toResponse(Interest interest, Long matchId) {
        return new InterestDto.InterestResponse(interest.getId(), interest.getSender().getId(), displayName(interest.getSender().getId()),
                interest.getReceiver().getId(), displayName(interest.getReceiver().getId()), interest.getStatus().name(), interest.getCreatedAt(), matchId);
    }

    private String displayName(Long userId) {
        return profiles.findByUserId(userId).map(profile -> profile.getDisplayName()).orElse("Student");
    }
}
