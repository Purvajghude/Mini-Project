# Deterministic team matching design

## Chosen algorithm: bounded beam search over greedy expansions

Use a deterministic bounded beam search, width 12, to build up to three alternatives. At each depth it expands the best partial teams by the best marginal candidate additions. It has the explainability and small implementation footprint of weighted greedy set cover, while avoiding greedy’s common failure: returning the same first strong specialist and then only near-duplicate teams.

For P0, cap the eligible candidate pool at the best 80 candidates by a deterministic prefilter and cap additions at `targetTeamSize - currentMemberCount`. With normal college cohorts this completes well within a request; it needs no solver, queue, ML model, or LLM.

## Inputs

```text
Existing members:       user UUIDs and declared skill → proficiency (1..5)
Requirements:           skill UUID, minimum proficiency, REQUIRED/PREFERRED
Team bounds:             target size including existing members
Candidates:              profile UUID, declared skills, availability windows,
                         optional GitHub language support, account/onboarding state
Hard exclusions:         members, blocked pairs, inactive/demo/non-onboarded users,
                         candidates already pending/accepted for this project
```

Availability is a compatibility threshold, not a personality score. For each candidate, calculate overlap minutes against the union of current members’ weekly windows in a common timezone. If no team window exists, report `UNKNOWN` rather than treating it as zero. P0 can require either >= 60 overlap minutes/week or allow unknown availability with a visible `availabilityStatus: UNKNOWN`; the policy needs product-owner confirmation.

## Coverage and objective

For requirement `r` with required proficiency `q_r` and member/candidate `u` declared proficiency `p_ur`:

```text
coverage(u,r) = min(1, p_ur / q_r)
teamCoverage(T,r) = min(1, sum(coverage(u,r) for u in T))
```

Do not let several beginners silently substitute for a required expert unless product policy explicitly permits additive coverage. The conservative P0 policy is `max_u coverage(u,r)` for `REQUIRED` skills and additive coverage only for `PREFERRED` skills. This better matches a one-day project engine and is easier to explain.

Score a partial team by:

```text
1000 * requiredCoverage
 + 150 * preferredCoverage
 + 20  * availabilityCompatibility
 + 5   * evidenceSupportForAlreadyDeclaredMatchingSkills
 - 10  * unfilledRequiredSkills
```

All terms are normalized 0..1 except count penalty. GitHub evidence can increase only the explanation/support indicator for a skill that already contributes through self-declaration; it must never make an unqualified person cover a skill or exceed five points in this objective. No success probability, passion, intelligence, popularity, repository star count, or social ranking is used.

`marginalGain(candidate, team)` is the objective difference after addition. Candidates who only duplicate fully covered skills lose to candidates that reduce an unmet requirement.

## Algorithm

1. Validate the owner is a project member, project is DRAFT/RECRUITING, requirements exist, and target size permits additions.
2. Calculate member coverage and emit a gap analysis: covered, partial, uncovered required skills; remaining seats; availability basis.
3. Build eligible candidates with hard exclusions. For prefiltering, retain candidates with any positive requirement contribution or `wantsToLearn` overlap with an unmet requirement. `wantsToLearn` is taken from existing `profile_desired_skill` and is an explicit disclosure, not competence.
4. Seed beam with existing-member state. At each open seat, add every candidate with positive marginal gain to each beam state, recalculate exact score, and retain the top 12 states.
5. Deduplicate a state by sorted member UUID tuple. Stop early when all REQUIRED requirements are covered, but keep expanding only if needed to meet the requested team size.
6. Select up to three completed states using diversity filtering. Two alternatives must differ by at least one candidate; preferentially require Jaccard team overlap <= 0.67 where candidates allow it.
7. For every returned candidate, record `covers`, `partialCovers`, `availabilityStatus`, `evidenceSupport` (boolean), and a plain-language reason derived only from these inputs.

If no candidate covers a requirement, return it in `uncoveredRequirements`; do not fabricate a weak recommendation. If the owner’s current team already fills the requirements, return a zero-addition alternative and say so.

## Determinism and tie breaking

Sort candidates by: higher marginal required coverage; higher marginal preferred coverage; compatible availability before unknown; more required skills covered; then lexicographic UUID. Use identical input ordering and fixed beam width. This makes results reproducible and unit-testable. The frontend may ask for alternatives with `excludeCandidateIds` or `previousTeamHashes` to deliberately diversify a repeat request; never randomize silently.

## Complexity

Let `N` be prefiltered candidates (<=80), `K` open seats (<=5), `B` beam width (12), and `R` requirements (normally <=15). Exact evaluation is `O(B * K * N * R)` after signal loading; worst configured P0 work is roughly 48,000 requirement operations plus data loading. It is bounded, explainable, and safe to execute synchronously.

## Edge cases

| Situation | Required behavior |
|---|---|
| No requirements | 400 `PROJECT_REQUIREMENTS_EMPTY`; do not recommend generic people. |
| Team already at target | Return gap analysis but no addable alternatives. |
| Target lower than existing members | 409 `TEAM_SIZE_INVALID`; owner must edit bounds. |
| Fewer eligible candidates than seats | Return best partial teams plus shortfall. |
| All candidates blocked/inactive/demo | Return empty alternatives and an eligibility explanation without revealing blocks. |
| Candidate has no availability | Mark `UNKNOWN`; apply product-selected policy, never invent availability. |
| Candidate wants to learn a missing skill | May be included only in a learning-support slot after required coverage is met; label “learning fit”, not “covers requirement”. |
| Stale suggestion then acceptance | Recheck eligibility, state, and capacity transactionally; return 409 with a refresh instruction. |
| Duplicate active application/invitation | 409 idempotent/business conflict; do not create duplicates. |

## Required unit tests

- Existing owner/member skill closes a required gap before candidates are considered.
- A candidate with high proficiency on an uncovered required skill beats a broadly similar duplicate.
- A GitHub language match does not create skill coverage without a self-declared skill.
- Blocked, inactive, demo, existing-member, and non-onboarded profiles never appear.
- Target size caps additions; a partial result reports unsatisfied requirements accurately.
- Availability `COMPATIBLE`, `INCOMPATIBLE`, and `UNKNOWN` thresholds are deterministic.
- Repeated input returns identical team/member order and explanation.
- Diversity selection produces materially different alternatives when candidates exist.
- A learning candidate cannot satisfy a required proficiency constraint.
- Invitation/application acceptance rejects stale full teams and creates exactly one membership on a valid transition.
