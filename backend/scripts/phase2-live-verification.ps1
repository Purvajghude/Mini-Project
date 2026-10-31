$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080/api/v1'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$password = 'MeshTest' + [guid]::NewGuid().ToString('N') + '!'

function Invoke-Api($method, $path, $body, $token) {
    $headers = @{}
    if ($token) { $headers.Authorization = 'Bearer ' + $token }
    $params = @{ Uri = $base + $path; Method = $method; Headers = $headers; ContentType = 'application/json'; SkipHttpErrorCheck = $true }
    if ($null -ne $body) { $params.Body = $body | ConvertTo-Json -Depth 12 -Compress }
    $response = Invoke-WebRequest @params
    $data = $null
    if ($response.Content) { $data = $response.Content | ConvertFrom-Json }
    return @{ status = [int]$response.StatusCode; data = $data }
}

function Assert-Status($name, $response, $expected) {
    Write-Output "RESULT $name $($response.status)"
    if ($response.status -ne $expected) {
        if ($response.data.message) { Write-Output "MESSAGE $($response.data.message)" }
        throw "$name expected $expected"
    }
}

function Register($role) {
    $name = 'phase2' + $role + $suffix
    $response = Invoke-Api POST '/auth/register' @{ displayName = "Phase 2 $role"; username = $name; email = "$name@example.test"; password = $password } $null
    if ($response.status -ne 201 -or !$response.data.token) { throw "Registration failed for $role" }
    return $response.data
}

$owner = Register 'owner'
$member = Register 'member'
$outsider = Register 'outsider'
Write-Output 'RESULT register-three-accounts 201'
$project = Invoke-Api POST '/projects' @{ name = "Phase 2 verification $suffix"; summary = 'Live skill gap verification'; domain = 'Software' } $owner.token
Assert-Status 'create-project' $project 201
$projectId = $project.data.id
if ($project.data.lifecycle -ne 'DRAFT') { throw 'New project was not DRAFT.' }

$empty = Invoke-Api GET "/projects/$projectId/skill-gap-analysis" $null $owner.token
Assert-Status 'latest-controller-empty-requirements' $empty 409
if ($empty.data.message -ne 'Project requirements are missing.') { throw 'Unexpected empty-requirements response.' }

$catalog = Invoke-Api GET '/skills' $null $owner.token
Assert-Status 'skill-catalog' $catalog 200
$selected = @($catalog.data | Select-Object -First 3)
if ($selected.Count -ne 3) { throw 'At least three catalog skills are required.' }
$a = $selected[0].id; $b = $selected[1].id; $c = $selected[2].id
$requirements = @(
    @{ skillId = $a; minimumProficiency = 3; importance = 'REQUIRED'; note = $null },
    @{ skillId = $b; minimumProficiency = 4; importance = 'REQUIRED'; note = $null },
    @{ skillId = $c; minimumProficiency = 3; importance = 'PREFERRED'; note = $null }
)
$draftBody = @{ targetTeamSize = 3; lifecycle = 'DRAFT'; requirements = $requirements }
Assert-Status 'save-draft-requirements' (Invoke-Api PUT "/projects/$projectId/requirements" $draftBody $owner.token) 200
Assert-Status 'invalid-draft-to-active' (Invoke-Api PUT "/projects/$projectId/requirements" @{ targetTeamSize = 3; lifecycle = 'ACTIVE'; requirements = $requirements } $owner.token) 409
Assert-Status 'advance-to-recruiting' (Invoke-Api PUT "/projects/$projectId/requirements" @{ targetTeamSize = 3; lifecycle = 'RECRUITING'; requirements = $requirements } $owner.token) 200
Assert-Status 'invalid-recruiting-to-draft' (Invoke-Api PUT "/projects/$projectId/requirements" $draftBody $owner.token) 409

Assert-Status 'owner-profile-skills' (Invoke-Api PUT '/profile/me/skills' @{ skills = @(@{ skillId = $a; proficiency = 4 }, @{ skillId = $b; proficiency = 2 }) } $owner.token) 200
Assert-Status 'member-profile-skills' (Invoke-Api PUT '/profile/me/skills' @{ skills = @(@{ skillId = $b; proficiency = 3 }) } $member.token) 200

$request = Invoke-Api POST '/connection-requests' @{ recipientUserId = $member.user.id } $owner.token
Assert-Status 'fresh-connection-request' $request 201
Assert-Status 'duplicate-connection-request' (Invoke-Api POST '/connection-requests' @{ recipientUserId = $member.user.id } $owner.token) 409
$incoming = Invoke-Api GET '/connection-requests/incoming' $null $member.token
Assert-Status 'incoming-connection-request' $incoming 200
if (@($incoming.data | Where-Object id -eq $request.data.id).Count -ne 1) { throw 'Request not persisted in incoming list.' }
Assert-Status 'accept-connection-request' (Invoke-Api PATCH "/connection-requests/$($request.data.id)/accept" $null $member.token) 200
Assert-Status 'connected-request-rejected' (Invoke-Api POST '/connection-requests' @{ recipientUserId = $member.user.id } $owner.token) 409

Assert-Status 'block-outsider' (Invoke-Api PUT "/blocks/$($outsider.user.id)" $null $owner.token) 204
$blocked = Invoke-Api POST '/connection-requests' @{ recipientUserId = $owner.user.id } $outsider.token
Assert-Status 'blocked-request-rejected' $blocked 403
if ($blocked.data.message -ne 'This student is unavailable for connection requests.') { throw 'Unexpected blocked-request error.' }

Assert-Status 'add-project-member' (Invoke-Api POST "/projects/$projectId/members" @{ userId = $member.user.id } $owner.token) 200
$ownerGap = Invoke-Api GET "/projects/$projectId/skill-gap-analysis" $null $owner.token
Assert-Status 'owner-skill-gap' $ownerGap 200
$memberGap = Invoke-Api GET "/projects/$projectId/skill-gap-analysis" $null $member.token
Assert-Status 'member-skill-gap' $memberGap 200
Assert-Status 'outsider-skill-gap-denied' (Invoke-Api GET "/projects/$projectId/skill-gap-analysis" $null $outsider.token) 403

if ($ownerGap.data.currentMemberCount -ne 2 -or $ownerGap.data.targetTeamSize -ne 3 -or $ownerGap.data.remainingCapacity -ne 1) { throw 'Team capacity did not include owner and member.' }
$covered = @($ownerGap.data.required | Where-Object skillId -eq $a)[0]
$partial = @($ownerGap.data.required | Where-Object skillId -eq $b)[0]
$uncovered = @($ownerGap.data.preferred | Where-Object skillId -eq $c)[0]
if ($covered.coverageStatus -ne 'COVERED' -or @($covered.satisfyingMemberIds).Count -ne 1 -or $covered.satisfyingMemberIds[0] -ne $owner.user.id) { throw 'COVERED result mismatch.' }
if ($partial.coverageStatus -ne 'PARTIAL' -or @($partial.satisfyingMemberIds).Count -ne 0) { throw 'PARTIAL result mismatch.' }
if ($uncovered.coverageStatus -ne 'UNCOVERED' -or @($uncovered.satisfyingMemberIds).Count -ne 0) { throw 'UNCOVERED result mismatch.' }
if (($memberGap.data | ConvertTo-Json -Depth 12 -Compress) -ne ($ownerGap.data | ConvertTo-Json -Depth 12 -Compress)) { throw 'Owner and member received different analysis.' }
Write-Output 'ASSERT coverage COVERED PARTIAL UNCOVERED'
Write-Output 'ASSERT member-count 2 target-size 3 remaining-capacity 1'
Write-Output "TEST_PROJECT_ID $projectId"
