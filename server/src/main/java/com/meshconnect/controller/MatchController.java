package com.meshconnect.controller;

import com.meshconnect.dto.MatchDto;
import com.meshconnect.service.MatchService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/matches")
public class MatchController {
    private final MatchService matches;
    public MatchController(MatchService matches) { this.matches = matches; }

    @GetMapping
    public List<MatchDto.MatchResponse> list() { return matches.listMine(); }

    @GetMapping("/{matchId}/messages")
    public MatchDto.MessageListResponse messages(@PathVariable Long matchId) { return new MatchDto.MessageListResponse(matches.messages(matchId)); }

    @PostMapping("/{matchId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MatchDto.MessageResponse send(@PathVariable Long matchId, @Valid @RequestBody MatchDto.SendMessageRequest request) { return matches.send(matchId, request); }
}
