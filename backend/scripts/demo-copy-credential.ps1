param(
    [Parameter(Mandatory = $true)][ValidateSet('A','B','C')][string]$Student,
    [string]$StatePath = (Join-Path $env:TEMP 'mesh-demo-accounts-2.clixml')
)
$ErrorActionPreference = 'Stop'
$state = Import-Clixml -LiteralPath $StatePath
$account = $state.accounts[$Student]
if (!$account) { throw 'Demo account not found in encrypted state.' }
$password = ([pscredential]::new('demo', $account.password)).GetNetworkCredential().Password
Set-Clipboard -Value $password
Write-Output "EMAIL $($account.email)"
Write-Output 'PASSWORD_COPIED_TO_CLIPBOARD'
