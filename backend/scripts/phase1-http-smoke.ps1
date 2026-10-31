$ErrorActionPreference = 'Stop'
$base = 'http://localhost:8080/api/v1'
$suffix = [guid]::NewGuid().ToString('N').Substring(0, 12)
$password = 'MeshTest' + [guid]::NewGuid().ToString('N') + '!'

function Call-Api($method, $path, $body, $token) {
    $headers = @{}
    if ($token) { $headers.Authorization = 'Bearer ' + $token }
    $params = @{ Uri = $base + $path; Method = $method; Headers = $headers; ContentType = 'application/json'; SkipHttpErrorCheck = $true }
    if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 12 -Compress) }
    $response = Invoke-WebRequest @params
    $data = $null
    if ($response.Content) { $data = $response.Content | ConvertFrom-Json }
    return @{ status = [int]$response.StatusCode; data = $data }
}

function Assert-Status($name, $response, $expected) {
    Write-Output "RESULT $name $($response.status)"
    if ($response.status -ne $expected) {
        Write-Output ('ERROR ' + ($response.data | ConvertTo-Json -Compress -Depth 5))
        throw "$name expected $expected"
    }
}

function Register-TestUser($role) {
    $name = 'phase1' + $role + $suffix
    $response = Call-Api POST '/auth/register' @{ displayName = "Phase1 $role"; username = $name; email = "$name@example.test"; password = $password } $null
    Assert-Status "register-$role" $response 201
    if (!$response.data.token) { throw 'Registration did not return a token.' }
    return $response
}

$owner = Register-TestUser 'owner'
$stranger = Register-TestUser 'stranger'
$ownerToken = $owner.data.token
$strangerToken = $stranger.data.token
$project = Call-Api POST '/projects' @{ name = "Phase 1 workspace $suffix"; summary = 'HTTP verification'; domain = 'Software' } $ownerToken
Assert-Status 'create-project' $project 201
$projectId = $project.data.id
if ($project.data.lifecycle -ne 'DRAFT') { throw 'New project is not DRAFT.' }
Write-Output 'ASSERT new-project DRAFT'

Assert-Status 'owner-requirements' (Call-Api GET "/projects/$projectId/requirements" $null $ownerToken) 200
Assert-Status 'stranger-edit-denied' (Call-Api PUT "/projects/$projectId/requirements" @{ targetTeamSize = 2; lifecycle = 'DRAFT'; requirements = @() } $strangerToken) 403
Assert-Status 'stranger-read-denied' (Call-Api GET "/projects/$projectId/requirements" $null $strangerToken) 403
Assert-Status 'anonymous-read-denied' (Call-Api GET "/projects/$projectId/requirements" $null $null) 401
Assert-Status 'invalid-team-size' (Call-Api PUT "/projects/$projectId/requirements" @{ targetTeamSize = 0; lifecycle = 'DRAFT'; requirements = @() } $ownerToken) 400

$task = Call-Api POST "/projects/$projectId/tasks" @{ title = 'Verify workspace task'; description = 'Persistent task' } $ownerToken
Assert-Status 'create-task' $task 201
$event = Call-Api POST "/projects/$projectId/events" @{ title = 'Verify workspace event'; description = 'Persistent event'; startsAt = '2026-11-01T10:00:00Z'; endsAt = '2026-11-01T11:00:00Z' } $ownerToken
Assert-Status 'create-event' $event 201
$poll = Call-Api POST "/projects/$projectId/availability-polls" @{ title = 'Verify workspace poll'; options = @(@{ startsAt = '2026-11-02T10:00:00Z'; endsAt = '2026-11-02T11:00:00Z' }, @{ startsAt = '2026-11-03T10:00:00Z'; endsAt = '2026-11-03T11:00:00Z' }) } $ownerToken
Assert-Status 'create-poll' $poll 201

$tasks = Call-Api GET "/projects/$projectId/tasks" $null $ownerToken
Assert-Status 'reload-tasks' $tasks 200
$events = Call-Api GET "/projects/$projectId/events" $null $ownerToken
Assert-Status 'reload-events' $events 200
$polls = Call-Api GET "/projects/$projectId/availability-polls" $null $ownerToken
Assert-Status 'reload-polls' $polls 200
if (@($tasks.data | Where-Object id -eq $task.data.id).Count -ne 1) { throw 'Task absent on reload.' }
if (@($events.data | Where-Object id -eq $event.data.id).Count -ne 1) { throw 'Event absent on reload.' }
if (@($polls.data | Where-Object id -eq $poll.data.id).Count -ne 1) { throw 'Poll absent on reload.' }
Write-Output 'ASSERT persisted-workspace-records true'
Write-Output "DTO task=$($task.data.status) event=$([bool]$event.data.startsAt) poll=$($poll.data.status) options=$(@($poll.data.options).Count)"
Write-Output "TEST_PROJECT_ID $projectId"
