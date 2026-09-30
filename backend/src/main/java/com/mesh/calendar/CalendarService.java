package com.mesh.calendar;

import com.mesh.common.ApiException;
import com.mesh.projects.ProjectAccessService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CalendarService {
    private final CalendarEventRepository events;
    private final AvailabilityPollRepository polls;
    private final AvailabilityPollOptionRepository options;
    private final AvailabilityPollVoteRepository votes;
    private final ProjectAccessService access;
    public CalendarService(CalendarEventRepository events, AvailabilityPollRepository polls, AvailabilityPollOptionRepository options, AvailabilityPollVoteRepository votes, ProjectAccessService access) { this.events = events; this.polls = polls; this.options = options; this.votes = votes; this.access = access; }

    @Transactional(readOnly = true)
    public List<EventResponse> events(UUID userId, UUID projectId) { access.requireMember(projectId, userId); return events.findByProjectIdOrderByStartsAtAsc(projectId).stream().map(this::eventResponse).toList(); }
    @Transactional
    public EventResponse createEvent(UUID userId, UUID projectId, CreateEventRequest request) {
        access.requireMember(projectId, userId); validateRange(request.startsAt(), request.endsAt());
        return eventResponse(events.save(new CalendarEvent(projectId, request.title().trim(), nullable(request.description()), request.startsAt(), request.endsAt(), userId)));
    }
    @Transactional
    public EventResponse updateEvent(UUID userId, UUID projectId, UUID eventId, UpdateEventRequest request) {
        access.requireMember(projectId, userId); validateRange(request.startsAt(), request.endsAt());
        CalendarEvent event = requireEvent(projectId, eventId);
        event.update(request.title().trim(), nullable(request.description()), request.startsAt(), request.endsAt());
        return eventResponse(event);
    }
    @Transactional
    public void deleteEvent(UUID userId, UUID projectId, UUID eventId) {
        access.requireMember(projectId, userId);
        events.delete(requireEvent(projectId, eventId));
    }
    @Transactional(readOnly = true)
    public List<PollResponse> polls(UUID userId, UUID projectId) { access.requireMember(projectId, userId); return polls.findByProjectIdOrderByCreatedAtDesc(projectId).stream().map(poll -> pollResponse(poll, userId)).toList(); }
    @Transactional
    public PollResponse createPoll(UUID userId, UUID projectId, CreatePollRequest request) {
        access.requireMember(projectId, userId); validateOptions(request.options());
        AvailabilityPoll poll = polls.save(new AvailabilityPoll(projectId, request.title().trim(), userId));
        request.options().forEach(option -> options.save(new AvailabilityPollOption(poll.getId(), option.startsAt(), option.endsAt())));
        return pollResponse(poll, userId);
    }
    @Transactional
    public void vote(UUID userId, UUID projectId, UUID pollId, UUID optionId) {
        access.requireMember(projectId, userId); AvailabilityPoll poll = requirePoll(projectId, pollId); requireOpen(poll);
        options.findByIdAndPollId(optionId, pollId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Availability option was not found."));
        votes.findById(new AvailabilityPollVoteKey(optionId, userId)).orElseGet(() -> votes.save(new AvailabilityPollVote(optionId, userId)));
    }
    @Transactional
    public void removeVote(UUID userId, UUID projectId, UUID pollId, UUID optionId) {
        access.requireMember(projectId, userId); AvailabilityPoll poll = requirePoll(projectId, pollId); requireOpen(poll);
        options.findByIdAndPollId(optionId, pollId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Availability option was not found."));
        votes.deleteById(new AvailabilityPollVoteKey(optionId, userId));
    }
    @Transactional
    public PollResponse close(UUID ownerId, UUID projectId, UUID pollId, UUID selectedOptionId) {
        access.requireOwner(projectId, ownerId); AvailabilityPoll poll = requirePoll(projectId, pollId); requireOpen(poll);
        options.findByIdAndPollId(selectedOptionId, pollId).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Selected option must belong to this availability poll."));
        poll.close(selectedOptionId); return pollResponse(poll, ownerId);
    }
    @Transactional
    public EventResponse schedule(UUID ownerId, UUID projectId, UUID pollId) {
        access.requireOwner(projectId, ownerId); AvailabilityPoll poll = requirePoll(projectId, pollId);
        if (poll.getStatus() != AvailabilityPoll.Status.CLOSED || poll.getSelectedOptionId() == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Close the poll with a selected option before scheduling it.");
        AvailabilityPollOption option = options.findByIdAndPollId(poll.getSelectedOptionId(), pollId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Selected availability option was not found."));
        CalendarEvent event = events.save(new CalendarEvent(projectId, poll.getTitle(), null, option.getStartsAt(), option.getEndsAt(), ownerId));
        poll.markScheduled(); return eventResponse(event);
    }
    private AvailabilityPoll requirePoll(UUID projectId, UUID pollId) {
        AvailabilityPoll poll = polls.findById(pollId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Availability poll was not found."));
        if (!poll.getProjectId().equals(projectId)) throw new ApiException(HttpStatus.NOT_FOUND, "Availability poll was not found.");
        return poll;
    }
    private CalendarEvent requireEvent(UUID projectId, UUID eventId) {
        CalendarEvent event = events.findById(eventId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Calendar event was not found."));
        if (!event.getProjectId().equals(projectId)) throw new ApiException(HttpStatus.NOT_FOUND, "Calendar event was not found.");
        return event;
    }
    private void requireOpen(AvailabilityPoll poll) { if (poll.getStatus() != AvailabilityPoll.Status.OPEN) throw new ApiException(HttpStatus.BAD_REQUEST, "This availability poll is closed."); }
    private void validateOptions(List<PollOptionRequest> pollOptions) {
        Set<String> unique = new HashSet<>();
        for (PollOptionRequest option : pollOptions) { validateRange(option.startsAt(), option.endsAt()); if (!unique.add(option.startsAt() + "/" + option.endsAt())) throw new ApiException(HttpStatus.BAD_REQUEST, "Availability poll options must be distinct."); }
    }
    private void validateRange(Instant startsAt, Instant endsAt) { if (!endsAt.isAfter(startsAt)) throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time."); }
    private String nullable(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private EventResponse eventResponse(CalendarEvent event) { return new EventResponse(event.getId(), event.getProjectId(), event.getTitle(), event.getDescription(), event.getStartsAt(), event.getEndsAt(), event.getCreatedByUserId(), event.getCreatedAt()); }
    private PollResponse pollResponse(AvailabilityPoll poll, UUID viewerId) {
        List<AvailabilityPollOption> pollOptions = options.findByPollIdOrderByStartsAtAsc(poll.getId());
        Map<UUID, List<AvailabilityPollVote>> votesByOption = votes.findByPollOptionIdIn(pollOptions.stream().map(AvailabilityPollOption::getId).toList()).stream().collect(Collectors.groupingBy(AvailabilityPollVote::getPollOptionId));
        List<PollOptionResponse> optionResponses = pollOptions.stream().map(option -> { List<AvailabilityPollVote> optionVotes = votesByOption.getOrDefault(option.getId(), List.of()); return new PollOptionResponse(option.getId(), option.getStartsAt(), option.getEndsAt(), optionVotes.size(), optionVotes.stream().anyMatch(vote -> vote.getUserId().equals(viewerId))); }).toList();
        return new PollResponse(poll.getId(), poll.getProjectId(), poll.getTitle(), poll.getStatus().name(), poll.getSelectedOptionId(), poll.getCreatedByUserId(), poll.getCreatedAt(), optionResponses);
    }
    public record CreateEventRequest(String title, String description, Instant startsAt, Instant endsAt) { }
    public record UpdateEventRequest(String title, String description, Instant startsAt, Instant endsAt) { }
    public record CreatePollRequest(String title, List<PollOptionRequest> options) { }
    public record PollOptionRequest(Instant startsAt, Instant endsAt) { }
    public record EventResponse(UUID id, UUID projectId, String title, String description, Instant startsAt, Instant endsAt, UUID createdByUserId, Instant createdAt) { }
    public record PollResponse(UUID id, UUID projectId, String title, String status, UUID selectedOptionId, UUID createdByUserId, Instant createdAt, List<PollOptionResponse> options) { }
    public record PollOptionResponse(UUID id, Instant startsAt, Instant endsAt, int voteCount, boolean votedByMe) { }
}
