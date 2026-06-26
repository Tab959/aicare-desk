$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$composeFile = Join-Path $repoRoot 'resources/deploy/compose/compose.yaml'
$envFile = Join-Path $repoRoot 'resources/deploy/compose/.env'
$exampleEnvFile = Join-Path $repoRoot 'resources/deploy/compose/.env.example'

if (-not (Test-Path -LiteralPath $envFile)) {
    Copy-Item -LiteralPath $exampleEnvFile -Destination $envFile
}

docker compose --env-file $envFile -f $composeFile --profile core up -d
