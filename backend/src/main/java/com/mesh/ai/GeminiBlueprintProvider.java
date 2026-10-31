package com.mesh.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mesh.projects.ProjectRequirementsService.RequirementResponse;
import com.mesh.projects.ProjectSkillRequirement.Importance;
import com.mesh.skills.Skill;
import com.mesh.skills.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * Turns a project idea into a structured blueprint with Gemini. Only the idea text, optional domain
 * and the public skill catalogue are sent — never profile data. Every model response is validated;
 * skills are mapped to catalogue entries by name and unknown ones are returned as unmapped, never
 * given invented IDs. Any failure throws {@link BlueprintGenerationException} so the caller can fall back.
 */
@Component
public class GeminiBlueprintProvider {
    /** HTTP seam so tests can replace the network call. Returns the raw response body. */
    @FunctionalInterface
    interface Transport { String post(String url, String apiKey, String body, Duration timeout) throws Exception; }

    public static class BlueprintGenerationException extends RuntimeException {
        public BlueprintGenerationException(String message) { super(message); }
    }

    public record Unmapped(String name, Importance importance, String reason, short minimumProficiency, String category) { }
    public record Generated(String title, String summary, short targetTeamSize, List<RequirementResponse> requirements,
                            List<String> objectives, List<String> assumptions, List<Unmapped> unmappedSkills) { }

    private static final ObjectMapper JSON = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String retryModel;
    private final Duration timeout;
    private final SkillRepository skills;
    private final Transport transport;

    @Autowired
    public GeminiBlueprintProvider(@Value("${GEMINI_API_KEY:}") String apiKey,
                                   @Value("${GEMINI_MODEL:gemini-3.5-flash}") String model,
                                   @Value("${GEMINI_RETRY_MODEL:gemini-3.5-flash-lite}") String retryModel,
                                   @Value("${GEMINI_TIMEOUT_SECONDS:30}") long timeoutSeconds,
                                   SkillRepository skills) {
        this(apiKey, model, retryModel, Duration.ofSeconds(timeoutSeconds), skills, GeminiBlueprintProvider::httpPost);
    }

    GeminiBlueprintProvider(String apiKey, String model, Duration timeout, SkillRepository skills, Transport transport) {
        this(apiKey, model, "", timeout, skills, transport);
    }

    GeminiBlueprintProvider(String apiKey, String model, String retryModel, Duration timeout, SkillRepository skills, Transport transport) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.retryModel = retryModel == null ? "" : retryModel.trim();
        this.timeout = timeout;
        this.skills = skills;
        this.transport = transport;
    }

    public boolean configured() { return !apiKey.isEmpty(); }

    public Generated generate(String idea, String domain, Short teamSizeHint) {
        if (!configured()) throw new BlueprintGenerationException("GEMINI_API_KEY is not configured.");
        List<Skill> catalogue = skills.findAllByOrderByNameAsc();
        String body = requestBody(idea, domain, teamSizeHint, catalogue);
        try {
            return parse(call(model, body), catalogue);
        } catch (BlueprintGenerationException e) {
            // Overload/rate limits are transient: one retry on the lighter model before the caller falls back.
            if (retryModel.isEmpty() || retryModel.equals(model) || !e.getMessage().matches(".*(503|429).*")) throw e;
            return parse(call(retryModel, body), catalogue);
        }
    }

    private String call(String modelName, String body) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";
        try {
            return transport.post(url, apiKey, body, timeout);
        } catch (java.net.http.HttpTimeoutException e) {
            throw new BlueprintGenerationException("Gemini request timed out.");
        } catch (BlueprintGenerationException e) {
            throw e;
        } catch (Exception e) {
            throw new BlueprintGenerationException("Gemini request failed: " + e.getClass().getSimpleName());
        }
    }

    // ---------- request ----------

    private String requestBody(String idea, String domain, Short teamSizeHint, List<Skill> catalogue) {
        // Bare names grouped by category, so the model echoes exact names (not "Name (Category)").
        Map<String, List<String>> byCategory = new TreeMap<>();
        for (Skill s : catalogue) byCategory.computeIfAbsent(s.getCategory(), k -> new ArrayList<>()).add(s.getName());
        StringBuilder skillList = new StringBuilder();
        byCategory.forEach((category, names) -> skillList.append("\n  ").append(category).append(": ").append(String.join(", ", names)));
        String prompt = """
            A university student described a project idea. It can be from any field: engineering, cooking,
            art, music, chemistry lab work, medicine, business, sport, social work. List the skills a team
            needs to build it, so the student can find teammates who have them.

            Idea: %s
            Area hint: %s
            Team size hint (including the student): %s

            Existing MESH skills: %s

            Rules:
            - Be blunt and concrete. No intros, no filler, no marketing words, no "This project aims to".
            - title: a short project name (max 6 words).
            - summary: ONE sentence, max 20 words: what gets built.
            - objectives: 3-5 deliverables, each max 8 words, starting with a verb ("Wire motors to the ESCs").
            - assumptions: 0-2 items, each max 10 words. Empty if nothing important.
            - requirements: every distinct skill the work needs (4-10). A skill is something a person can
              learn and claim, named in 1-3 words ("Soldering", "Embedded C", "Knife Skills", "Titration").
              Use the exact existing name when one fits; otherwise name the skill plainly.
              category: one word or two for the field, e.g. Electronics, Software, Cooking, Art, Lab, Medical.
              importance REQUIRED only when the project fails without it.
              minimumProficiency 1-5 (1 aware, 3 has done it for real, 5 expert); usually 2-3 for students.
              reason: max 12 words on what this skill does in the project.
            - targetTeamSize: 2-6 people including the student.
            """.formatted(idea, domain == null ? "none" : domain, teamSizeHint == null ? "none" : teamSizeHint, skillList);

        ObjectNode root = JSON.createObjectNode();
        root.putArray("contents").addObject().put("role", "user").putArray("parts").addObject().put("text", prompt);
        ObjectNode config = root.putObject("generationConfig");
        config.put("temperature", 0.4);
        config.put("responseMimeType", "application/json");
        config.set("responseSchema", responseSchema());
        return root.toString();
    }

    private static JsonNode responseSchema() {
        try {
            return JSON.readTree("""
                {"type":"OBJECT","required":["title","summary","objectives","assumptions","targetTeamSize","requirements"],
                 "properties":{
                  "title":{"type":"STRING"},"summary":{"type":"STRING"},
                  "objectives":{"type":"ARRAY","items":{"type":"STRING"}},
                  "assumptions":{"type":"ARRAY","items":{"type":"STRING"}},
                  "targetTeamSize":{"type":"INTEGER"},
                  "requirements":{"type":"ARRAY","items":{"type":"OBJECT",
                    "required":["skill","importance","minimumProficiency","reason"],
                    "properties":{"skill":{"type":"STRING"},"category":{"type":"STRING"},"importance":{"type":"STRING","enum":["REQUIRED","PREFERRED"]},
                      "minimumProficiency":{"type":"INTEGER"},"reason":{"type":"STRING"}}}}}}
                """);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    // ---------- response validation ----------

    Generated parse(String raw, List<Skill> catalogue) {
        JsonNode blueprint;
        try {
            JsonNode envelope = JSON.readTree(raw);
            JsonNode text = envelope.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (!text.isTextual()) throw new BlueprintGenerationException("Gemini returned no candidate text.");
            blueprint = JSON.readTree(text.asText());
        } catch (BlueprintGenerationException e) {
            throw e;
        } catch (Exception e) {
            throw new BlueprintGenerationException("Gemini returned invalid JSON.");
        }

        String title = text(blueprint, "title", 120);
        String summary = text(blueprint, "summary", 1000);
        if (title.isEmpty() || summary.isEmpty()) throw new BlueprintGenerationException("Gemini response is missing a title or summary.");
        int size = blueprint.path("targetTeamSize").asInt(4);
        short teamSize = (short) (size >= 1 && size <= 8 ? size : 4);

        Map<String, Skill> byName = new HashMap<>();
        for (Skill s : catalogue) byName.put(normalize(s.getName()), s);
        Map<Long, RequirementResponse> mapped = new LinkedHashMap<>();
        Map<String, Unmapped> unmapped = new LinkedHashMap<>();
        for (JsonNode r : blueprint.path("requirements")) {
            String name = text(r, "skill", 80);
            Importance importance = "REQUIRED".equals(r.path("importance").asText()) ? Importance.REQUIRED
                : "PREFERRED".equals(r.path("importance").asText()) ? Importance.PREFERRED : null;
            int level = r.path("minimumProficiency").asInt(0);
            String reason = text(r, "reason", 300);
            if (name.isEmpty() || importance == null || level < 1 || level > 5) continue; // drop malformed entries, keep the rest
            Skill skill = byName.get(normalize(name));
            if (skill == null) {
                unmapped.putIfAbsent(normalize(name), new Unmapped(name, importance, reason.isEmpty() ? null : reason, (short) level, text(r, "category", 40)));
                continue;
            }
            RequirementResponse existing = mapped.get(skill.getId());
            if (existing == null || (existing.importance() == Importance.PREFERRED && importance == Importance.REQUIRED)) {
                mapped.put(skill.getId(), new RequirementResponse(skill.getId(), skill.getName(), (short) level, importance, reason.isEmpty() ? null : reason));
            }
        }
        if (mapped.isEmpty() && unmapped.isEmpty()) throw new BlueprintGenerationException("Gemini response contained no usable requirements.");

        return new Generated(title, summary, teamSize,
            mapped.values().stream().limit(30).toList(),
            strings(blueprint.path("objectives"), 6, 200),
            strings(blueprint.path("assumptions"), 6, 200),
            unmapped.values().stream().limit(10).toList());
    }

    /** Case/spacing-insensitive name match; ignores a trailing "(…)" qualifier such as "Figma (Design)". */
    static String normalize(String s) {
        return s.trim().replaceAll("\\s*\\([^)]*\\)\\s*$", "").toLowerCase(Locale.ROOT).replaceAll("[\\s_-]+", " ");
    }

    private static String text(JsonNode node, String field, int max) {
        String v = node.path(field).asText("").trim();
        return v.length() > max ? v.substring(0, max).trim() : v;
    }

    private static List<String> strings(JsonNode array, int maxItems, int maxLength) {
        List<String> out = new ArrayList<>();
        for (JsonNode n : array) {
            String v = n.asText("").trim();
            if (!v.isEmpty() && out.size() < maxItems) out.add(v.length() > maxLength ? v.substring(0, maxLength).trim() : v);
        }
        return out;
    }

    // ---------- transport ----------

    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    private static String httpPost(String url, String apiKey, String body, Duration timeout) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(timeout)
            .header("Content-Type", "application/json").header("x-goog-api-key", apiKey)
            .POST(HttpRequest.BodyPublishers.ofString(body)).build();
        HttpResponse<String> response = HTTP.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 429) throw new BlueprintGenerationException("Gemini rate limit reached (429).");
        if (response.statusCode() >= 400) throw new BlueprintGenerationException("Gemini returned HTTP " + response.statusCode() + ".");
        return response.body();
    }
}
