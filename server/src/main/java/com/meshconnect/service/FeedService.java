package com.meshconnect.service;

import com.meshconnect.dto.FeedDto;
import com.meshconnect.entity.AppUser;
import com.meshconnect.entity.Comment;
import com.meshconnect.entity.Post;
import com.meshconnect.entity.PostStatus;
import com.meshconnect.exception.ForbiddenException;
import com.meshconnect.exception.NotFoundException;
import com.meshconnect.repository.CommentRepository;
import com.meshconnect.repository.PostRepository;
import com.meshconnect.repository.ProfileRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedService {
    private final CurrentUserService currentUser;
    private final PostRepository posts;
    private final CommentRepository comments;
    private final ProfileRepository profiles;

    public FeedService(CurrentUserService currentUser, PostRepository posts, CommentRepository comments, ProfileRepository profiles) {
        this.currentUser = currentUser;
        this.posts = posts;
        this.comments = comments;
        this.profiles = profiles;
    }

    @Transactional(readOnly = true)
    public FeedDto.FeedPage list(int requestedPage, int requestedSize) {
        int page = Math.max(requestedPage, 0);
        int size = Math.min(Math.max(requestedSize, 1), 50);
        Page<Post> result = posts.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new FeedDto.FeedPage(result.getContent().stream().map(this::toPostResponse).toList(), result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public FeedDto.PostResponse create(FeedDto.CreatePostRequest request) {
        AppUser author = currentUser.requireUser();
        Post post = posts.save(new Post(author, request.kind(), request.title().trim(), request.body().trim(), blankToNull(request.category()), normalizeTags(request.tags())));
        return toPostResponse(post);
    }

    @Transactional(readOnly = true)
    public List<FeedDto.CommentResponse> comments(Long postId) {
        Post post = requirePost(postId);
        return comments.findByPostIdOrderByCreatedAtAsc(post.getId()).stream().map(comment -> toCommentResponse(comment, post)).toList();
    }

    @Transactional
    public FeedDto.CommentResponse comment(Long postId, FeedDto.CreateCommentRequest request) {
        AppUser author = currentUser.requireUser();
        Post post = requirePost(postId);
        return toCommentResponse(comments.save(new Comment(post, author, request.body().trim())), post);
    }

    @Transactional
    public FeedDto.PostResponse markSolution(Long postId, Long commentId) {
        AppUser me = currentUser.requireUser();
        Post post = requirePost(postId);
        if (!post.getAuthor().getId().equals(me.getId())) throw new ForbiddenException("Only the post author can mark a solution");
        Comment comment = comments.findById(commentId).orElseThrow(() -> new NotFoundException("Comment not found"));
        if (!comment.getPost().getId().equals(post.getId())) throw new NotFoundException("Comment does not belong to this post");
        post.setSolvedComment(comment);
        post.setStatus(PostStatus.SOLVED);
        return toPostResponse(post);
    }

    @Transactional(readOnly = true)
    public Post requirePost(Long postId) {
        return posts.findById(postId).orElseThrow(() -> new NotFoundException("Post not found"));
    }

    private FeedDto.PostResponse toPostResponse(Post post) {
        return new FeedDto.PostResponse(post.getId(), author(post.getAuthor()), post.getKind().name(), post.getTitle(), post.getBody(),
                post.getCategory(), splitTags(post.getTags()), post.getStatus().name(),
                post.getSolvedComment() == null ? null : post.getSolvedComment().getId(), comments.countByPostId(post.getId()), post.getCreatedAt());
    }

    private FeedDto.CommentResponse toCommentResponse(Comment comment, Post post) {
        boolean solution = post.getSolvedComment() != null && post.getSolvedComment().getId().equals(comment.getId());
        return new FeedDto.CommentResponse(comment.getId(), author(comment.getAuthor()), comment.getBody(), comment.getCreatedAt(), solution);
    }

    /**
     * The feed shows people, so it needs the profile's display name and avatar rather
     * than the login username. Falls back to the username if a profile row is missing.
     */
    private FeedDto.AuthorSummary author(AppUser user) {
        return profiles.findByUserId(user.getId())
                .map(profile -> new FeedDto.AuthorSummary(
                        user.getId(), user.getUsername(), profile.getDisplayName(), profile.getAvatarKey()))
                .orElseGet(() -> new FeedDto.AuthorSummary(
                        user.getId(), user.getUsername(), user.getUsername(), null));
    }

    private String normalizeTags(String tags) {
        if (tags == null || tags.isBlank()) return null;
        return Arrays.stream(tags.split(",")).map(String::trim).filter(tag -> !tag.isBlank()).distinct().limit(6).reduce((first, second) -> first + "," + second).orElse(null);
    }

    private List<String> splitTags(String tags) { return tags == null || tags.isBlank() ? List.of() : Arrays.stream(tags.split(",")).toList(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
