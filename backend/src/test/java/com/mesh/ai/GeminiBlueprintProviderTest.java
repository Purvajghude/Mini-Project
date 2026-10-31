package com.mesh.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mesh.projects.BlueprintController;
import com.mesh.projects.ProjectSkillRequirement.Importance;
import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import org.junit.jupiter.api.Test;

import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GeminiBlueprintProviderTest {
    private static Skill skill(long id, String name) throws Exception {
        Skill s = mock(Skill.class);
        when(s.getId()).thenReturn(id);
        when(s.getName()).thenReturn(name);
        when(s.getCategory()).thenReturn("Data");
        return s;
    }

    private static SkillRepository catalogue() throws Exception {
        SkillRepository repo = mock(SkillRepository.class);
        List<Skill> skills = List.of(skill(7, "Python"), skill(9, "Machine Learning"), skill(14, "Git"));
        when(repo.findAllByOrderByNameAsc()).thenReturn(skills);
        when(repo.findAll()).thenReturn(skills);
        return repo;
    }

    /** Wraps a blueprint JSON object the way Gemini returns structured output. */
    private static String envelope(String blueprintJson) throws Exception {
        return "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":" + new ObjectMapper().writeValueAsString(blueprintJson) + "}]}}]}";
    }

    private static final String VALID = """
        {"title":"Campus Navigator Drone","summary":"An autonomous drone that maps campus paths.",
         "objectives":["Hold position outdoors","Detect obstacles"],"assumptions":["Flights stay below 30 m"],
         "targetTeamSize":4,
         "requirements":[
           {"skill":"python (Data)","importance":"REQUIRED","minimumProficiency":3,"reason":"Flight software"},
           {"skill":"Machine  Learning","importance":"PREFERRED","minimumProficiency":3,"reason":"Vision model"},
           {"skill":"Machine Learning","importance":"REQUIRED","minimumProficiency":4,"reason":"Obstacle detection"},
           {"skill":"Embedded Systems","importance":"REQUIRED","minimumProficiency":3,"reason":"Flight controller"},
           {"skill":"Git","importance":"MAYBE","minimumProficiency":2,"reason":"bad importance"},
           {"skill":"Git","importance":"PREFERRED","minimumProficiency":9,"reason":"bad level"}]}
        """;

    @Test void maps_catalogue_skills_keeps_unknown_ones_unmapped_and_drops_malformed_entries() throws Exception {
        AtomicReference<String> sent = new AtomicReference<>();
        var provider = new GeminiBlueprintProvider("test-key", "m", Duration.ofSeconds(1), catalogue(), (url, key, body, t) -> { sent.set(body); return envelope(VALID); });
        var g = provider.generate("A drone that navigates campus", null, null);

        assertEquals("Campus Navigator Drone", g.title());
        assertEquals(4, g.targetTeamSize());
        assertEquals(List.of(7L, 9L), g.requirements().stream().map(r -> r.skillId()).toList());
        var ml = g.requirements().get(1);
        assertEquals(Importance.REQUIRED, ml.importance(), "REQUIRED wins over an earlier PREFERRED duplicate");
        assertEquals(4, ml.minimumProficiency());
        assertEquals(1, g.unmappedSkills().size());
        assertEquals("Embedded Systems", g.unmappedSkills().get(0).name());
        assertEquals(List.of("Hold position outdoors", "Detect obstacles"), g.objectives());
        assertTrue(sent.get().contains("A drone that navigates campus"));
        assertFalse(sent.get().contains("test-key"), "API key must travel in a header, not the body");
    }

    @Test void rejects_missing_key_invalid_json_empty_requirements_and_transport_failures() throws Exception {
        var repo = catalogue();
        assertThrows(GeminiBlueprintProvider.BlueprintGenerationException.class,
            () -> new GeminiBlueprintProvider("", "m", Duration.ofSeconds(1), repo, (u, k, b, t) -> envelope(VALID)).generate("idea", null, null));
        assertThrows(GeminiBlueprintProvider.BlueprintGenerationException.class,
            () -> new GeminiBlueprintProvider("k", "m", Duration.ofSeconds(1), repo, (u, k, b, t) -> "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"not json\"}]}}]}").generate("idea", null, null));
        assertThrows(GeminiBlueprintProvider.BlueprintGenerationException.class,
            () -> new GeminiBlueprintProvider("k", "m", Duration.ofSeconds(1), repo, (u, k, b, t) -> envelope("{\"title\":\"T\",\"summary\":\"S\",\"requirements\":[]}")).generate("idea", null, null));
        var timeout = assertThrows(GeminiBlueprintProvider.BlueprintGenerationException.class,
            () -> new GeminiBlueprintProvider("k", "m", Duration.ofSeconds(1), repo, (u, k, b, t) -> { throw new HttpTimeoutException("slow"); }).generate("idea", null, null));
        assertEquals("Gemini request timed out.", timeout.getMessage());

        // 503 on the primary model is retried once on the retry model.
        var urls = new java.util.ArrayList<String>();
        var retried = new GeminiBlueprintProvider("k", "primary", "lite", Duration.ofSeconds(1), repo, (u, k, b, t) -> {
            urls.add(u);
            if (u.contains("primary")) throw new GeminiBlueprintProvider.BlueprintGenerationException("Gemini returned HTTP 503.");
            return envelope(VALID);
        }).generate("idea", null, null);
        assertEquals("Campus Navigator Drone", retried.title());
        assertEquals(2, urls.size());
        assertTrue(urls.get(1).contains("/models/lite:"));
    }

    @Test void controller_falls_back_to_template_and_labels_it_honestly() throws Exception {
        var repo = catalogue();
        var failing = new GeminiBlueprintProvider("", "m", Duration.ofSeconds(1), repo, (u, k, b, t) -> envelope(VALID));
        var controller = new AiBlueprintController(failing, new BlueprintController(repo), repo);
        var response = controller.suggest(new BlueprintController.Request("Machine learning study planner", null, null, null));
        assertEquals("DETERMINISTIC_TEMPLATE", response.source());
        assertEquals("GEMINI_API_KEY is not configured.", response.fallbackReason());
        assertTrue(response.unmappedSkills().isEmpty());

        Skill created = skill(99, "Embedded Systems");
        when(repo.findOrCreate(anyString(), anyString())).thenReturn(created);
        var working = new GeminiBlueprintProvider("k", "m", Duration.ofSeconds(1), repo, (u, k, b, t) -> envelope(VALID));
        var ai = new AiBlueprintController(working, new BlueprintController(repo), repo).suggest(new BlueprintController.Request("Drone", null, null, (short) 3));
        assertEquals("GEMINI", ai.source());
        assertNull(ai.fallbackReason());
        assertEquals(3, ai.targetTeamSize(), "an explicit team size from the student wins");
        assertTrue(ai.unmappedSkills().isEmpty(), "skills outside the catalogue are added to it, not left unmapped");
        assertTrue(ai.requirements().stream().anyMatch(r -> r.skillId() == 99L));
    }

    /** Opt-in live check against the real Gemini API; runs only when GEMINI_API_KEY is set. */
    @Test
    @org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable(named = "GEMINI_API_KEY", matches = ".+")
    void live_gemini_returns_a_valid_catalogue_mapped_blueprint() throws Exception {
        SkillRepository repo = mock(SkillRepository.class);
        List<Skill> skills = List.of(skill(1, "Java"), skill(4, "JavaScript"), skill(5, "React"),
            skill(7, "Python"), skill(9, "Machine Learning"), skill(10, "Figma"), skill(14, "Git"), skill(15, "Project Management"));
        when(repo.findAllByOrderByNameAsc()).thenReturn(skills);
        var provider = new GeminiBlueprintProvider(System.getenv("GEMINI_API_KEY"), System.getenv().getOrDefault("GEMINI_MODEL", "gemini-3.5-flash"), "gemini-3.5-flash-lite", 30, repo);
        long start = System.nanoTime();
        var g = provider.generate("An offline Bluetooth messaging app where nearby phones relay encrypted messages without internet connectivity.", null, null);
        System.out.printf("LIVE GEMINI (%d ms)%n%s%n", (System.nanoTime() - start) / 1_000_000, new ObjectMapper().writerWithDefaultPrettyPrinter().writeValueAsString(g));
        assertFalse(g.title().isBlank());
        assertFalse(g.requirements().isEmpty() && g.unmappedSkills().isEmpty());
        assertTrue(g.requirements().stream().allMatch(r -> r.minimumProficiency() >= 1 && r.minimumProficiency() <= 5));
    }
}
