package com.mesh.recommendations;

import com.mesh.profiles.CollaborationDomain;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;

class DiscoverFeedAllocatorTest {
    private final DiscoverFeedAllocator allocator = new DiscoverFeedAllocator();

    @Test void reserves_one_of_five_slots_for_adjacent_domain_exploration() {
        var candidates = List.of(candidate("a", CollaborationDomain.WEB_DEVELOPMENT, 90), candidate("b", CollaborationDomain.WEB_DEVELOPMENT, 80), candidate("c", CollaborationDomain.WEB_DEVELOPMENT, 70), candidate("d", CollaborationDomain.WEB_DEVELOPMENT, 60), candidate("e", CollaborationDomain.BACKEND, 99));
        var result = allocator.allocate(CollaborationDomain.WEB_DEVELOPMENT, candidates, 5);
        assertEquals(4, result.stream().filter(item -> item.source() == DiscoverFeedAllocator.FeedSource.PRIMARY_DOMAIN).count());
        assertEquals(1, result.stream().filter(item -> item.source() == DiscoverFeedAllocator.FeedSource.ADJACENT_DOMAIN).count());
    }

    @Test void fills_the_feed_from_adjacent_domains_when_the_primary_pool_is_small() {
        var candidates = List.of(candidate("a", CollaborationDomain.WEB_DEVELOPMENT, 90), candidate("b", CollaborationDomain.BACKEND, 80), candidate("c", CollaborationDomain.UI_UX, 70));
        var result = allocator.allocate(CollaborationDomain.WEB_DEVELOPMENT, candidates, 5);
        assertEquals(3, result.size());
        assertEquals(2, result.stream().filter(item -> item.source() == DiscoverFeedAllocator.FeedSource.ADJACENT_DOMAIN).count());
    }

    private Candidate candidate(String id, CollaborationDomain domain, double score) { return new Candidate(id, domain, score); }
    private record Candidate(String id, CollaborationDomain domain, double score) implements DiscoverFeedAllocator.Candidate {
        @Override public String stableTieBreak() { return id; }
    }
}
