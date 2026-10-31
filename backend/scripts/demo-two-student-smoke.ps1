param(
    [string]$BaseUrl = 'http://localhost:8080/api/v1',
    [string]$StatePath = (Join-Path $env:TEMP 'mesh-demo-accounts.clixml'),
    [switch]$PrepareOnly,
    [switch]$Resume
)
$ErrorActionPreference = 'Stop'

function Api($method, $path, $body, $token) {
    $headers = @{}
    if ($token) { $headers.Authorization = 'Bearer ' + $token }
    $params = @{ Uri = $BaseUrl.TrimEnd('/') + $path; Method = $method; Headers = $headers; ContentType = 'application/json'; SkipHttpErrorCheck = $true }
    if ($null -ne $body) { $params.Body = $body | ConvertTo-Json -Depth 12 -Compress }
    $response = Invoke-WebRequest @params
    $data = $null
    if ($response.Content) { $data = $response.Content | ConvertFrom-Json }
    return @{ status = [int]$response.StatusCode; data = $data }
}
function Check($name, $response, $status) {
    Write-Host "RESULT $name $($response.status)"
    if ($response.status -ne $status) {
        if ($response.data.message) { Write-Host "MESSAGE $($response.data.message)" }
        throw "$name expected HTTP $status"
    }
}
function Plain($secure) { return ([pscredential]::new('demo', $secure)).GetNetworkCredential().Password }
function Register($label, $suffix) {
    $email = "mesh-demo-$label-$suffix@example.test"
    $password = 'MeshDemo' + [guid]::NewGuid().ToString('N') + '!'
    $registered = Api POST '/auth/register' @{ displayName = "Demo Student $label"; username = "meshdemo$label$suffix"; email = $email; password = $password } $null
    Check "register-$label" $registered 201
    return @{ id = $registered.data.user.id; email = $email; password = (ConvertTo-SecureString $password -AsPlainText -Force); token = $registered.data.token }
}
function Login($account, $label) {
    $response = Api POST '/auth/login' @{ email = $account.email; password = (Plain $account.password) } $null
    Check "login-$label" $response 200
    $account.token = $response.data.token
}
function SkillId($catalog, $name) {
    $skill = @($catalog | Where-Object name -eq $name)
    if ($skill.Count -ne 1) { throw "Required catalogue skill missing: $name" }
    return [long]$skill[0].id
}

if ($Resume) {
    if (!(Test-Path -LiteralPath $StatePath)) { throw 'Encrypted demo state file is missing.' }
    $state = Import-Clixml -LiteralPath $StatePath
    foreach ($label in @('A', 'B', 'C')) { Login $state.accounts[$label] $label }
} else {
    if (Test-Path -LiteralPath $StatePath) { throw 'Encrypted state already exists; choose a new -StatePath to preserve those demo accounts.' }
    $suffix = [guid]::NewGuid().ToString('N').Substring(0, 10)
    $state = @{ accounts = @{ A = (Register 'A' $suffix); B = (Register 'B' $suffix); C = (Register 'C' $suffix) } }
    $credentialState = @{ accounts = @{} }
    foreach ($label in @('A', 'B', 'C')) {
        $account = $state.accounts[$label]
        $credentialState.accounts[$label] = @{ id = $account.id; email = $account.email; password = $account.password }
    }
    Export-Clixml -InputObject $credentialState -LiteralPath $StatePath -Force
    Write-Output "ENCRYPTED_DEMO_STATE $StatePath"
    $catalogResponse = Api GET '/skills' $null $state.accounts.A.token
    Check 'skill-catalog' $catalogResponse 200
    $catalog = @($catalogResponse.data)
    $skillNames = @('React', 'Python', 'Java', 'Spring Boot', 'PostgreSQL', 'Figma', 'Data Analysis')
    $ids = @{}
    foreach ($name in $skillNames) { $ids[$name] = SkillId $catalog $name }
    $skillSets = @{
        A = @(@{ skillId = $ids.React; proficiency = 3 }, @{ skillId = $ids.Python; proficiency = 3 })
        B = @(@{ skillId = $ids.Java; proficiency = 4 }, @{ skillId = $ids.'Spring Boot'; proficiency = 4 }, @{ skillId = $ids.PostgreSQL; proficiency = 3 })
        C = @(@{ skillId = $ids.Figma; proficiency = 4 }, @{ skillId = $ids.'Data Analysis'; proficiency = 3 })
    }
    foreach ($label in @('A', 'B', 'C')) {
        $account = $state.accounts[$label]
        Check "profile-$label" (Api PUT '/profile/me' @{ displayName = "Demo Student $label"; department = 'Information Technology'; yearOfStudy = 2; bio = 'MESH presentation demo account'; primaryDomain = 'WEB_DEVELOPMENT'; onboardingComplete = $true } $account.token) 200
        Check "skills-$label" (Api PUT '/profile/me/skills' @{ skills = $skillSets[$label] } $account.token) 200
        Check "reload-profile-$label" (Api GET '/profile/me' $null $account.token) 200
    }
    $aiBlueprint = Api POST '/project-blueprints/ai-suggestions' @{ idea = 'Build a Spring Boot and PostgreSQL campus collaboration API with a React frontend'; domain = 'WEB_DEVELOPMENT'; targetTeamSize = 2 } $state.accounts.A.token
    Check 'ai-blueprint-suggestion' $aiBlueprint 200
    if ($aiBlueprint.data.source -notin @('GEMINI', 'DETERMINISTIC_TEMPLATE')) { throw 'AI blueprint source was not labelled.' }
    Write-Host "AI_BLUEPRINT_SOURCE $($aiBlueprint.data.source)"
    $blueprint = Api POST '/project-blueprints/suggestions' @{ idea = 'Build a Spring Boot and PostgreSQL campus collaboration API with a React frontend'; domain = 'WEB_DEVELOPMENT'; targetTeamSize = 2 } $state.accounts.A.token
    Check 'blueprint-suggestion' $blueprint 200
    $project = Api POST '/projects' @{ name = "MESH demo project $suffix"; summary = 'Two student collaboration demonstration'; domain = 'WEB_DEVELOPMENT' } $state.accounts.A.token
    Check 'create-project' $project 201
    if ($project.data.lifecycle -ne 'DRAFT') { throw 'New project did not start in DRAFT.' }
    $state.projectId = $project.data.id
    $requirements = @(
        @{ skillId = $ids.Java; minimumProficiency = 4; importance = 'REQUIRED'; note = 'Backend implementation' },
        @{ skillId = $ids.'Spring Boot'; minimumProficiency = 3; importance = 'REQUIRED'; note = 'API development' },
        @{ skillId = $ids.PostgreSQL; minimumProficiency = 3; importance = 'REQUIRED'; note = 'Data persistence' },
        @{ skillId = $ids.React; minimumProficiency = 3; importance = 'PREFERRED'; note = 'Frontend collaboration' }
    )
    Check 'save-recruiting-requirements' (Api PUT "/projects/$($state.projectId)/requirements" @{ targetTeamSize = 2; lifecycle = 'RECRUITING'; requirements = $requirements } $state.accounts.A.token) 200
    $persisted = Api GET "/projects/$($state.projectId)/requirements" $null $state.accounts.A.token
    Check 'reload-requirements' $persisted 200
    if (@($persisted.data.requirements).Count -ne 4) { throw 'Requirements were not persisted.' }
    foreach ($label in @('A', 'B', 'C')) { $state.accounts[$label].Remove('token') }
    Export-Clixml -InputObject $state -LiteralPath $StatePath -Force
    Write-Output "ENCRYPTED_DEMO_STATE $StatePath"
    Write-Output "PROJECT_ID $($state.projectId)"
    if ($PrepareOnly) { return }
    foreach ($label in @('A', 'B', 'C')) { Login $state.accounts[$label] $label }
}

$projectId = $state.projectId
$a = $state.accounts.A; $b = $state.accounts.B; $c = $state.accounts.C
Check 'owner-gap' (Api GET "/projects/$projectId/skill-gap-analysis" $null $a.token) 200
$suggestions = Api POST "/projects/$projectId/team-suggestions" @{ alternativeCount = 3; availabilityPolicy = 'ALLOW_UNKNOWN' } $a.token
Check 'owner-team-suggestions' $suggestions 200
$repeat = Api POST "/projects/$projectId/team-suggestions" @{ alternativeCount = 3; availabilityPolicy = 'ALLOW_UNKNOWN' } $a.token
Check 'deterministic-repeat' $repeat 200
if (($suggestions.data | ConvertTo-Json -Depth 20 -Compress) -ne ($repeat.data | ConvertTo-Json -Depth 20 -Compress)) { throw 'Team suggestions changed across identical requests.' }
$suggestedIds = @($suggestions.data.alternatives | ForEach-Object { $_.candidates } | ForEach-Object { $_.userId })
if ($b.id -notin $suggestedIds) { throw 'Eligible Student B was not suggested.' }
Check 'nonowner-suggestions-denied' (Api POST "/projects/$projectId/team-suggestions" @{} $b.token) 403
$empty = Api POST "/projects/$projectId/team-suggestions" @{ availabilityPolicy = 'REQUIRE_OVERLAP' } $a.token
Check 'no-candidates-valid-response' $empty 200
if (@($empty.data.alternatives).Count -ne 0) { throw 'Strict availability should return no candidate when windows are unknown.' }

$invitation = Api POST "/projects/$projectId/invitations" @{ inviteeUserId = $b.id } $a.token
Check 'send-invitation' $invitation 201
Check 'duplicate-invitation-rejected' (Api POST "/projects/$projectId/invitations" @{ inviteeUserId = $b.id } $a.token) 409
$incoming = Api GET '/project-invitations/incoming' $null $b.token
Check 'incoming-invitations' $incoming 200
if (@($incoming.data | Where-Object id -eq $invitation.data.id).Count -ne 1) { throw 'Invitation not persisted in Student B inbox.' }
$unrelatedInbox = Api GET '/project-invitations/incoming' $null $c.token
Check 'unrelated-inbox-private' $unrelatedInbox 200
if (@($unrelatedInbox.data | Where-Object id -eq $invitation.data.id).Count -ne 0) { throw 'Invitation leaked into another student inbox.' }
Check 'accept-invitation' (Api PATCH "/project-invitations/$($invitation.data.id)/accept" $null $b.token) 200
$members = Api GET "/projects/$projectId/members" $null $b.token
Check 'member-list-reload' $members 200
if (@($members.data).Count -ne 2 -or $b.id -notin @($members.data.userId)) { throw 'Accepted member not persisted.' }
$task = Api POST "/projects/$projectId/tasks" @{ title = 'Demo integration task'; description = 'Shared project workspace' } $a.token
Check 'create-task' $task 201
$start = (Get-Date).ToUniversalTime().AddDays(7)
$end = $start.AddHours(1)
$event = Api POST "/projects/$projectId/events" @{ title = 'Demo project sync'; startsAt = $start.ToString('o'); endsAt = $end.ToString('o') } $a.token
Check 'create-event' $event 201
$poll = Api POST "/projects/$projectId/availability-polls" @{ title = 'Demo availability'; options = @(
    @{ startsAt = $start.AddDays(1).ToString('o'); endsAt = $end.AddDays(1).ToString('o') },
    @{ startsAt = $start.AddDays(2).ToString('o'); endsAt = $end.AddDays(2).ToString('o') }) } $a.token
Check 'create-poll' $poll 201
Check 'owner-workspace' (Api GET "/projects/$projectId/tasks" $null $a.token) 200
$memberTasks = Api GET "/projects/$projectId/tasks" $null $b.token
Check 'member-workspace' $memberTasks 200
$memberEvents = Api GET "/projects/$projectId/events" $null $b.token
Check 'member-events' $memberEvents 200
$memberPolls = Api GET "/projects/$projectId/availability-polls" $null $b.token
Check 'member-polls' $memberPolls 200
if (@($memberTasks.data | Where-Object id -eq $task.data.id).Count -ne 1 -or
    @($memberEvents.data | Where-Object id -eq $event.data.id).Count -ne 1 -or
    @($memberPolls.data | Where-Object id -eq $poll.data.id).Count -ne 1) { throw 'Shared workspace records did not survive reload.' }
Check 'unrelated-workspace-denied' (Api GET "/projects/$projectId/tasks" $null $c.token) 403
Check 'member-project-reload' (Api GET "/projects/$projectId" $null $b.token) 200
Write-Output 'ASSERT two-student-project-workspace true'
