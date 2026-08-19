package com.meshconnect;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * End-to-end tests over the real HTTP layer, real security filter chain, real Flyway
 * migrations and a real (in-memory) database. Nothing here is mocked, so a passing run
 * means the wiring actually holds together.
 *
 * <p>Runs on the {@code test} profile, which uses an isolated database and leaves the demo
 * dataset switched off so each test controls its own data.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    @Test
    @DisplayName("a protected endpoint rejects an anonymous caller with 401")
    void protectedEndpointRequiresToken() throws Exception {
        mvc.perform(get("/api/v1/profile/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("a garbled token is rejected rather than treated as anonymous")
    void invalidTokenIsRejected() throws Exception {
        mvc.perform(get("/api/v1/profile/me").header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("register then login returns a working token")
    void registerAndLogin() throws Exception {
        register("alice", "alice@college.edu", "Alice Fernandes");

        MvcResult result = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"alice@college.edu","password":"StrongPass123"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();

        String token = node(result).get("token").asText();
        mvc.perform(get("/api/v1/profile/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                // The password hash must never appear in a response body.
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("registering a taken email is refused with 409 rather than creating a second account")
    void duplicateEmailIsRejected() throws Exception {
        register("bob", "bob@college.edu", "Bob Menon");

        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"bobby","email":"bob@college.edu","password":"StrongPass123","displayName":"Bob Again"}"""))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("login with a wrong password does not reveal whether the account exists")
    void wrongPasswordIsRefused() throws Exception {
        register("carol", "carol@college.edu", "Carol Dsouza");

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"carol@college.edu","password":"WrongPassword1"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("invalid registration input is reported field by field")
    void validationErrorsAreStructured() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"x","email":"not-an-email","password":"short","displayName":""}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields").isMap());
    }

    @Test
    @DisplayName("mutual interest creates exactly one match and opens the conversation")
    void mutualInterestCreatesMatch() throws Exception {
        String daveToken = register("dave", "dave@college.edu", "Dave Kurien");
        String erinToken = register("erin", "erin@college.edu", "Erin Baptista");
        long daveId = userId(daveToken);
        long erinId = userId(erinToken);

        // Dave sends first: no match yet, because Erin has not answered.
        mvc.perform(post("/api/v1/interests/" + erinId).header(HttpHeaders.AUTHORIZATION, "Bearer " + daveToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.matchId").doesNotExist());

        // Erin sees it in her inbox.
        mvc.perform(get("/api/v1/interests/incoming").header(HttpHeaders.AUTHORIZATION, "Bearer " + erinToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].senderId").value(daveId));

        // Erin sends back, which completes the handshake and produces the match.
        MvcResult reciprocal = mvc.perform(post("/api/v1/interests/" + daveId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + erinToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.matchId").isNumber())
                .andReturn();
        long matchId = node(reciprocal).get("matchId").asLong();

        // Both sides see the same single match.
        mvc.perform(get("/api/v1/matches").header(HttpHeaders.AUTHORIZATION, "Bearer " + daveToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(matchId));
        mvc.perform(get("/api/v1/matches").header(HttpHeaders.AUTHORIZATION, "Bearer " + erinToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(matchId));

        // And they can talk.
        mvc.perform(post("/api/v1/matches/" + matchId + "/messages")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + daveToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Want to pair on the API this weekend?"}"""))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/v1/matches/" + matchId + "/messages")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + erinToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.messages.length()").value(1));
    }

    @Test
    @DisplayName("sending interest twice is refused instead of creating a duplicate row")
    void duplicateInterestIsRejected() throws Exception {
        String token = register("frank", "frank@college.edu", "Frank Pereira");
        String otherToken = register("grace", "grace@college.edu", "Grace Lobo");
        long otherId = userId(otherToken);

        mvc.perform(post("/api/v1/interests/" + otherId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/interests/" + otherId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("sending interest to yourself is refused")
    void selfInterestIsRejected() throws Exception {
        String token = register("henry", "henry@college.edu", "Henry Dias");
        mvc.perform(post("/api/v1/interests/" + userId(token)).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("a student outside a match cannot read or post to its conversation")
    void outsiderCannotAccessConversation() throws Exception {
        String oneToken = register("ivan", "ivan@college.edu", "Ivan Rebello");
        String twoToken = register("julia", "julia@college.edu", "Julia Coutinho");
        String outsiderToken = register("mallory", "mallory@college.edu", "Mallory Pinto");

        mvc.perform(post("/api/v1/interests/" + userId(twoToken)).header(HttpHeaders.AUTHORIZATION, "Bearer " + oneToken))
                .andExpect(status().isCreated());
        MvcResult reciprocal = mvc.perform(post("/api/v1/interests/" + userId(oneToken))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + twoToken))
                .andExpect(status().isCreated())
                .andReturn();
        long matchId = node(reciprocal).get("matchId").asLong();

        mvc.perform(get("/api/v1/matches/" + matchId + "/messages")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + outsiderToken))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/matches/" + matchId + "/messages")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + outsiderToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content":"Let me in"}"""))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("recommendations explain themselves and never include the caller")
    void recommendationsAreExplainedAndExcludeSelf() throws Exception {
        String backendToken = register("nikhil", "nikhil@college.edu", "Nikhil Shetty");
        String designToken = register("olivia", "olivia@college.edu", "Olivia Braganza");

        setSkills(backendToken, skillIdsFor(backendToken, "Java", "Spring Boot"), 5);
        setSkills(designToken, skillIdsFor(designToken, "Figma", "UI/UX Design"), 5);

        MvcResult result = mvc.perform(get("/api/v1/recommendations?limit=10")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + backendToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = node(result);
        long me = userId(backendToken);
        for (JsonNode entry : body) {
            assertThat(entry.get("userId").asLong()).isNotEqualTo(me);
            assertThat(entry.get("reason").asText()).isNotBlank();
            assertThat(entry.get("score").asDouble()).isBetween(0.0, 100.0);
            assertThat(entry.get("breakdown")).isNotNull();
        }
        assertThat(body.size()).isGreaterThan(0);
    }

    @Test
    @DisplayName("a student who has already been sent interest drops out of recommendations")
    void interestedStudentsLeaveTheDeck() throws Exception {
        String token = register("pooja", "pooja@college.edu", "Pooja Naik");
        String targetToken = register("quentin", "quentin@college.edu", "Quentin Fonseca");
        setSkills(token, skillIdsFor(token, "Java"), 5);
        setSkills(targetToken, skillIdsFor(targetToken, "Figma"), 5);
        long targetId = userId(targetToken);

        assertThat(recommendationIds(token)).contains(targetId);
        mvc.perform(post("/api/v1/interests/" + targetId).header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isCreated());
        assertThat(recommendationIds(token)).doesNotContain(targetId);
    }

    @Test
    @DisplayName("only the post author can mark an answer as the solution")
    void onlyAuthorMarksSolution() throws Exception {
        String authorToken = register("rahul", "rahul@college.edu", "Rahul Kamat");
        String helperToken = register("sneha", "sneha@college.edu", "Sneha Prabhu");

        MvcResult created = mvc.perform(post("/api/v1/posts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind":"HELP","title":"Cannot get Flyway to run","body":"It fails on a clean database.","category":"Backend","tags":"Java"}"""))
                .andExpect(status().isCreated())
                .andReturn();
        long postId = node(created).get("id").asLong();

        MvcResult answered = mvc.perform(post("/api/v1/posts/" + postId + "/comments")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + helperToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"body":"Check that your migration versions are padded."}"""))
                .andExpect(status().isCreated())
                .andReturn();
        long commentId = node(answered).get("id").asLong();

        // The helper cannot mark their own answer as the accepted one.
        mvc.perform(patch("/api/v1/posts/" + postId + "/solution/" + commentId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + helperToken))
                .andExpect(status().isForbidden());

        mvc.perform(patch("/api/v1/posts/" + postId + "/solution/" + commentId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SOLVED"));
    }

    @Test
    @DisplayName("the feed shows display names rather than login usernames")
    void feedShowsDisplayNames() throws Exception {
        String token = register("tanvi", "tanvi@college.edu", "Tanvi Salgaonkar");
        mvc.perform(post("/api/v1/posts")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"kind":"SHOWCASE","title":"Built a seat finder","body":"Cleaned the logs and shipped a dashboard.","category":"Data","tags":"Python"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.author.displayName").value("Tanvi Salgaonkar"));
    }

    @Test
    @DisplayName("team suggestion covers the requirement with the fewest people")
    void teamSuggestionCoversTheRequirement() throws Exception {
        String meToken = register("lead", "lead@college.edu", "Team Lead");
        String designToken = register("des", "des@college.edu", "Designer Person");
        String dataToken = register("dat", "dat@college.edu", "Data Person");
        // A generalist who covers BOTH needed skills should be preferred over two specialists.
        String generalistToken = register("gen", "gen@college.edu", "Generalist Person");

        setSkills(meToken, skillIdsFor(meToken, "Java"), 5);
        setSkills(designToken, skillIdsFor(designToken, "Figma"), 5);
        setSkills(dataToken, skillIdsFor(dataToken, "Data Analysis"), 5);
        setSkills(generalistToken, skillIdsFor(generalistToken, "Figma", "Data Analysis"), 4);

        java.util.List<Long> needed = skillIdsFor(meToken, "Java", "Figma", "Data Analysis");
        MvcResult result = mvc.perform(post("/api/v1/teams/suggest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + meToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamRequest(needed, 3)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = node(result);
        // Java is already covered by the requester, so it is not a hiring requirement.
        assertThat(body.get("youAlreadyCover").toString()).contains("Java");
        assertThat(body.get("stillMissing")).isEmpty();
        assertThat(body.get("coveragePercent").asDouble()).isEqualTo(100.0);
        // One person covers both outstanding skills, so greedy should stop at one.
        assertThat(body.get("members")).hasSize(1);
        assertThat(body.get("members").get(0).get("displayName").asText()).isEqualTo("Generalist Person");
    }

    @Test
    @DisplayName("team suggestion reports what nobody in the cohort can cover")
    void teamSuggestionReportsUncoverableSkills() throws Exception {
        String meToken = register("solo", "solo@college.edu", "Solo Builder");
        setSkills(meToken, skillIdsFor(meToken, "Java"), 5);

        java.util.List<Long> needed = skillIdsFor(meToken, "Java", "Machine Learning");
        MvcResult result = mvc.perform(post("/api/v1/teams/suggest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + meToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamRequest(needed, 3)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = node(result);
        assertThat(body.get("stillMissing").toString()).contains("Machine Learning");
        assertThat(body.get("coveragePercent").asDouble()).isLessThan(100.0);
    }

    @Test
    @DisplayName("someone who is merely a beginner does not count as covering a skill")
    void beginnersDoNotCount() throws Exception {
        String meToken = register("needy", "needy@college.edu", "Needs Design");
        String beginnerToken = register("beg", "beg@college.edu", "Beginner Designer");
        setSkills(meToken, skillIdsFor(meToken, "Java"), 5);
        setSkills(beginnerToken, skillIdsFor(beginnerToken, "Figma"), 2); // below the threshold

        MvcResult result = mvc.perform(post("/api/v1/teams/suggest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + meToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamRequest(skillIdsFor(meToken, "Figma"), 3)))
                .andExpect(status().isOk())
                .andReturn();

        assertThat(node(result).get("members")).isEmpty();
        assertThat(node(result).get("stillMissing").toString()).contains("Figma");
    }

    @Test
    @DisplayName("team suggestion rejects an empty skill list")
    void teamSuggestionRequiresSkills() throws Exception {
        String token = register("empty", "empty@college.edu", "Empty Request");
        mvc.perform(post("/api/v1/teams/suggest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"skillIds":[],"size":3}"""))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("team suggestion never includes the requester")
    void teamSuggestionExcludesSelf() throws Exception {
        String meToken = register("selfteam", "selfteam@college.edu", "Self Team");
        setSkills(meToken, skillIdsFor(meToken, "Figma"), 5);
        long me = userId(meToken);

        MvcResult result = mvc.perform(post("/api/v1/teams/suggest")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + meToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(teamRequest(skillIdsFor(meToken, "Figma"), 3)))
                .andExpect(status().isOk())
                .andReturn();

        for (JsonNode member : node(result).get("members")) {
            assertThat(member.get("userId").asLong()).isNotEqualTo(me);
        }
    }

    @Test
    @DisplayName("a student cannot reach the admin report queue")
    void adminQueueIsRoleProtected() throws Exception {
        String token = register("umesh", "umesh@college.edu", "Umesh Gaonkar");
        mvc.perform(get("/api/v1/admin/reports").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // --- helpers -----------------------------------------------------------

    private String register(String username, String email, String displayName) throws Exception {
        MvcResult result = mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","email":"%s","password":"StrongPass123","displayName":"%s"}"""
                                .formatted(username, email, displayName)))
                .andExpect(status().isCreated())
                .andReturn();
        return node(result).get("token").asText();
    }

    private long userId(String token) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/profile/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        return node(result).get("id").asLong();
    }

    private java.util.List<Long> skillIdsFor(String token, String... names) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/skills").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode catalog = node(result);
        java.util.List<Long> ids = new java.util.ArrayList<>();
        for (String name : names) {
            for (JsonNode entry : catalog) {
                if (entry.get("name").asText().equals(name)) ids.add(entry.get("id").asLong());
            }
        }
        assertThat(ids).as("skill catalog should contain %s", java.util.Arrays.toString(names)).hasSize(names.length);
        return ids;
    }

    private void setSkills(String token, java.util.List<Long> skillIds, int proficiency) throws Exception {
        String body = skillIds.stream()
                .map(id -> "{\"skillId\":%d,\"proficiency\":%d}".formatted(id, proficiency))
                .reduce((a, b) -> a + "," + b)
                .orElse("");
        mvc.perform(put("/api/v1/profile/me/skills")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"skills\":[" + body + "]}"))
                .andExpect(status().isOk());
    }

    private java.util.List<Long> recommendationIds(String token) throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/recommendations?limit=50")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        java.util.List<Long> ids = new java.util.ArrayList<>();
        for (JsonNode entry : node(result)) ids.add(entry.get("userId").asLong());
        return ids;
    }

    private String teamRequest(java.util.List<Long> skillIds, int size) {
        String ids = skillIds.stream().map(String::valueOf).reduce((a, b) -> a + "," + b).orElse("");
        return "{\"skillIds\":[" + ids + "],\"size\":" + size + "}";
    }

    private JsonNode node(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString());
    }
}
