package com.mesh.calendar;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/projects/{projectId}")
public class CalendarController {
    private final CalendarService calendar;
    public CalendarController(CalendarService calendar) { this.calendar = calendar; }
    @GetMapping("/events") public List<CalendarService.EventResponse> events(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return calendar.events(userId, projectId); }
    @PostMapping("/events") @ResponseStatus(HttpStatus.CREATED) public CalendarService.EventResponse createEvent(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody EventBody body) { return calendar.createEvent(userId, projectId, new CalendarService.CreateEventRequest(body.title(), body.description(), body.startsAt(), body.endsAt())); }
    @PutMapping("/events/{eventId}") public CalendarService.EventResponse updateEvent(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @PathVariable UUID eventId, @Valid @RequestBody EventBody body) { return calendar.updateEvent(userId, projectId, eventId, new CalendarService.UpdateEventRequest(body.title(), body.description(), body.startsAt(), body.endsAt())); }
    @DeleteMapping("/events/{eventId}") @ResponseStatus(HttpStatus.NO_CONTENT) public void deleteEvent(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @PathVariable UUID eventId) { calendar.deleteEvent(userId, projectId, eventId); }
    @GetMapping("/availability-polls") public List<CalendarService.PollResponse> polls(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId) { return calendar.polls(userId, projectId); }
    @PostMapping("/availability-polls") @ResponseStatus(HttpStatus.CREATED) public CalendarService.PollResponse createPoll(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @Valid @RequestBody PollBody body) { return calendar.createPoll(userId, projectId, new CalendarService.CreatePollRequest(body.title(), body.options().stream().map(option -> new CalendarService.PollOptionRequest(option.startsAt(), option.endsAt())).toList())); }
    @PutMapping("/availability-polls/{pollId}/options/{optionId}/vote") @ResponseStatus(HttpStatus.NO_CONTENT) public void vote(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @PathVariable UUID pollId, @PathVariable UUID optionId) { calendar.vote(userId, projectId, pollId, optionId); }
    @DeleteMapping("/availability-polls/{pollId}/options/{optionId}/vote") @ResponseStatus(HttpStatus.NO_CONTENT) public void removeVote(@AuthenticationPrincipal UUID userId, @PathVariable UUID projectId, @PathVariable UUID pollId, @PathVariable UUID optionId) { calendar.removeVote(userId, projectId, pollId, optionId); }
    @PatchMapping("/availability-polls/{pollId}/close") public CalendarService.PollResponse close(@AuthenticationPrincipal UUID ownerId, @PathVariable UUID projectId, @PathVariable UUID pollId, @Valid @RequestBody ClosePollBody body) { return calendar.close(ownerId, projectId, pollId, body.selectedOptionId()); }
    @PostMapping("/availability-polls/{pollId}/schedule") public CalendarService.EventResponse schedule(@AuthenticationPrincipal UUID ownerId, @PathVariable UUID projectId, @PathVariable UUID pollId) { return calendar.schedule(ownerId, projectId, pollId); }
    public record EventBody(@NotBlank @Size(max = 160) String title, @Size(max = 2000) String description, @NotNull Instant startsAt, @NotNull Instant endsAt) { }
    public record PollBody(@NotBlank @Size(max = 160) String title, @NotNull @Size(min = 2, max = 8) List<@Valid PollOptionBody> options) { }
    public record PollOptionBody(@NotNull Instant startsAt, @NotNull Instant endsAt) { }
    public record ClosePollBody(@NotNull UUID selectedOptionId) { }
}
