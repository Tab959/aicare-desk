$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$requiredFiles = @(
    'resources/docs/product/product-brief.md',
    'resources/docs/product/glossary.md',
    'resources/docs/product/actors-and-capabilities.md',
    'resources/docs/product/use-cases.md',
    'resources/docs/product/acceptance-criteria.md',
    'resources/docs/security/access-control-matrix.md',
    'resources/docs/security/threat-model.md',
    'resources/docs/domain/state-machines.md',
    'resources/docs/architecture/context-and-containers.md',
    'resources/docs/architecture/module-boundaries.md',
    'resources/docs/data/core-data-model.md',
    'resources/docs/api/api-standards.md',
    'resources/docs/api/event-contracts.md',
    'resources/docs/operations/non-functional-requirements.md',
    'resources/docs/adr/0001-monorepo-and-application-layout.md',
    'resources/docs/adr/0002-modular-monolith-and-agent-boundary.md',
    'resources/docs/adr/0003-local-development-topology.md',
    'resources/docs/stage-0-traceability.md'
)

$errors = [System.Collections.Generic.List[string]]::new()
$forbiddenPattern = '(?im)\bTBD\b|\bTODO\b|待定|待补充|稍后决定'

foreach ($relativePath in $requiredFiles) {
    $absolutePath = Join-Path $repoRoot $relativePath
    if (-not (Test-Path -LiteralPath $absolutePath)) {
        $errors.Add("Missing: $relativePath")
        continue
    }

    $content = Get-Content -Raw -LiteralPath $absolutePath
    if ($content.Length -lt 200) {
        $errors.Add("Too short: $relativePath")
    }
    if ($content -match $forbiddenPattern) {
        $errors.Add("Placeholder text: $relativePath")
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'STAGE0_DOCS_OK'
