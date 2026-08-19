package com.meshconnect.controller;

import com.meshconnect.dto.FeedDto;
import com.meshconnect.service.FeedService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/posts")
public class FeedController {
    private final FeedService feed;
    public FeedController(FeedService feed) { this.feed = feed; }

    @GetMapping
    public FeedDto.FeedPage list(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return feed.list(page, size); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FeedDto.PostResponse create(@Valid @RequestBody FeedDto.CreatePostRequest request) { return feed.create(request); }

    @GetMapping("/{postId}/comments")
    public List<FeedDto.CommentResponse> comments(@PathVariable Long postId) { return feed.comments(postId); }

    @PostMapping("/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public FeedDto.CommentResponse comment(@PathVariable Long postId, @Valid @RequestBody FeedDto.CreateCommentRequest request) { return feed.comment(postId, request); }

    @PatchMapping("/{postId}/solution/{commentId}")
    public FeedDto.PostResponse markSolution(@PathVariable Long postId, @PathVariable Long commentId) { return feed.markSolution(postId, commentId); }
}
