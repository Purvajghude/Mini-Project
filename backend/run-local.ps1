[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

# These values identify MESH's Supabase Session Pooler. They contain no secret.
$env:MESH_DATABASE_URL = 'jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require'
$env:MESH_DATABASE_USERNAME = 'postgres.wplmxhspbozvnzioewbd'

if ([string]::IsNullOrWhiteSpace($env:MESH_DATABASE_PASSWORD)) {
    $securePassword = Read-Host 'Enter your Supabase database password' -AsSecureString
    $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    try {
        $env:MESH_DATABASE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
    }
}

if ([string]::IsNullOrWhiteSpace($env:MESH_JWT_SECRET)) {
    $randomBytes = New-Object byte[] 32
    $randomGenerator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $randomGenerator.GetBytes($randomBytes)
        $env:MESH_JWT_SECRET = [Convert]::ToBase64String($randomBytes)
    }
    finally {
        $randomGenerator.Dispose()
    }
    Write-Host 'Generated a temporary development JWT secret for this run.' -ForegroundColor Yellow
}

$applicationJar = Join-Path $PSScriptRoot 'target\mesh-api-0.1.0-SNAPSHOT.jar'
if (-not (Test-Path -LiteralPath $applicationJar)) {
    throw "Build the API once first: mvn -f .\pom.xml package -DskipTests"
}

& java -jar $applicationJar
