$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$composeFile = Join-Path $repoRoot 'resources/deploy/compose/compose.yaml'
$envFile = Join-Path $repoRoot 'resources/deploy/compose/.env'

docker compose --env-file $envFile -f $composeFile --profile core down
