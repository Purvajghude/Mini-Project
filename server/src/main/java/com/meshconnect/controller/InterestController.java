package com.meshconnect.controller;

import com.meshconnect.dto.InterestDto;
import com.meshconnect.service.InterestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/interests")
@Tag(name = "Interests", description = "Collaboration requests and the mutual-interest handshake")
public class InterestController {
    private final InterestService interests;
    public InterestController(InterestService interests) { this.interests = interests; }

    @PostMapping("/{userId}")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Send interest to a student",
            description = "If that student has already sent you interest, this completes the handshake and returns the new match id.")
    public InterestDto.InterestResponse send(@PathVariable Long userId) { return interests.send(userId); }

    @GetMapping("/incoming")
    @Operation(summary = "Pending requests waiting on you")
    public List<InterestDto.InterestResponse> incoming() { return interests.incoming(); }

    @GetMapping("/sent")
    @Operation(summary = "Requests you have sent that are still unanswered")
    public List<InterestDto.InterestResponse> sent() { return interests.sent(); }

    @PatchMapping("/{interestId}/accept")
    @Operation(summary = "Accept a request", description = "Creates the match and returns its id.")
    public InterestDto.InterestResponse accept(@PathVariable Long interestId) { return interests.accept(interestId); }

    @PatchMapping("/{interestId}/decline")
    @Operation(summary = "Decline a request")
    public InterestDto.InterestResponse decline(@PathVariable Long interestId) { return interests.decline(interestId); }
}
