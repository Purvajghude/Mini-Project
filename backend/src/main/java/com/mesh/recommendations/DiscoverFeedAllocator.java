package com.mesh.recommendations;

import com.mesh.profiles.CollaborationDomain;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Keeps Discover focused while reserving a small, useful amount of adjacent-domain exploration. */
public final class DiscoverFeedAllocator {
    public <T extends Candidate> List<Allocation<T>> allocate(CollaborationDomain viewerDomain, List<T> candidates, int limit) {
        if (limit < 1) return List.of();
        List<T> ranked = candidates.stream().sorted(Comparator.comparingDouble(Candidate::score).reversed().thenComparing(Candidate::stableTieBreak)).toList();
        if (viewerDomain == null) return ranked.stream().limit(limit).map(candidate -> new Allocation<>(candidate, FeedSource.GENERAL)).toList();

        List<T> primary = ranked.stream().filter(candidate -> viewerDomain == candidate.domain()).toList();
        List<T> adjacent = ranked.stream().filter(candidate -> candidate.domain() != null && viewerDomain.adjacentDomains().contains(candidate.domain())).toList();
        int primaryTarget = Math.round(limit * 0.8f);
        List<Allocation<T>> result = new ArrayList<>();
        append(result, primary, primaryTarget, FeedSource.PRIMARY_DOMAIN);
        append(result, adjacent, limit - result.size(), FeedSource.ADJACENT_DOMAIN);
        append(result, primary, limit - result.size(), FeedSource.PRIMARY_DOMAIN);
        append(result, adjacent, limit - result.size(), FeedSource.ADJACENT_DOMAIN);
        return result;
    }

    private <T> void append(List<Allocation<T>> destination, List<T> source, int count, FeedSource feedSource) {
        int added = 0;
        for (T candidate : source) {
            if (added >= count || destination.stream().anyMatch(item -> item.candidate().equals(candidate))) continue;
            destination.add(new Allocation<>(candidate, feedSource)); added++;
        }
    }

    public interface Candidate {
        CollaborationDomain domain();
        double score();
        String stableTieBreak();
    }
    public record Allocation<T>(T candidate, FeedSource source) { }
    public enum FeedSource { PRIMARY_DOMAIN, ADJACENT_DOMAIN, GENERAL }
}
