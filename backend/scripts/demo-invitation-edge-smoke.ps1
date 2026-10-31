param(
    [string]$BaseUrl = 'http://localhost:8080/api/v1',
    [string]$StatePath = (Join-Path $env:TEMP 'mesh-demo-accounts-2.clixml')
)
$ErrorActionPreference = 'Stop'
if (!(Test-Path -LiteralPath $StatePath)) { throw 'Encrypted demo account state is missing.' }
$state = Import-Clixml -LiteralPath $StatePath
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
function Check($name, $response, $expected) {
    Write-Host "RESULT $name $($response.status)"
    if ($response.status -ne $expected) { if ($response.data.message) { Write-Host "MESSAGE $($response.data.message)" }; throw "$name expected $expected" }
}
foreach ($label in @('A','B','C')) {
    $account = $state.accounts[$label]
    $password = ([pscredential]::new('demo', $account.password)).GetNetworkCredential().Password
    $login = Api POST '/auth/login' @{ email = $account.email; password = $password } $null
    Check "login-$label" $login 200
    $account.token = $login.data.token
}
$a = $state.accounts.A; $b = $state.accounts.B; $c = $state.accounts.C
$inbox = Api GET '/project-invitations/incoming' $null $c.token
Check 'student-C-inbox' $inbox 200
if (@($inbox.data | Where-Object projectId -eq $state.projectId).Count -ne 0) { throw 'Student B invitation leaked to Student C.' }
$skills = Api GET '/skills' $null $a.token
Check 'skill-catalog' $skills 200
$reactId = @($skills.data | Where-Object name -eq 'React')[0].id
$project = Api POST '/projects' @{ name = ('Invitation edge check '+[guid]::NewGuid().ToString('N').Substring(0,8)); summary = 'Permission and cancellation checks'; domain = 'WEB_DEVELOPMENT' } $a.token
Check 'create-edge-project' $project 201
$id = $project.data.id
Check 'recruiting-requirement' (Api PUT "/projects/$id/requirements" @{ targetTeamSize = 2; lifecycle = 'RECRUITING'; requirements = @(@{ skillId = $reactId; minimumProficiency = 3; importance = 'REQUIRED' }) } $a.token) 200
Check 'nonowner-send-denied' (Api POST "/projects/$id/invitations" @{ inviteeUserId = $c.id } $b.token) 403
$first = Api POST "/projects/$id/invitations" @{ inviteeUserId = $c.id } $a.token
Check 'send-C' $first 201
Check 'decline-C' (Api PATCH "/project-invitations/$($first.data.id)/decline" $null $c.token) 200
$second = Api POST "/projects/$id/invitations" @{ inviteeUserId = $c.id } $a.token
Check 'reinvite-C' $second 201
Check 'cancel-C' (Api DELETE "/projects/$id/invitations/$($second.data.id)" $null $a.token) 200
$reserved = Api POST "/projects/$id/invitations" @{ inviteeUserId = $b.id } $a.token
Check 'reserve-last-seat-B' $reserved 201
Check 'pending-capacity-rejected' (Api POST "/projects/$id/invitations" @{ inviteeUserId = $c.id } $a.token) 409
Check 'release-reservation-B' (Api DELETE "/projects/$id/invitations/$($reserved.data.id)" $null $a.token) 200
$listed = Api GET "/projects/$id/invitations" $null $a.token
Check 'owner-invitation-history' $listed 200
if (@($listed.data).Count -ne 3) { throw 'Invitation history did not persist.' }
Write-Host 'ASSERT invitation-permissions-and-capacity true'
