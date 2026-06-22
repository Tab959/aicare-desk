$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$requiredFiles = @(
    'docs/product/product-brief.md',
    'docs/product/glossary.md',
    'docs/product/actors-and-capabilities.md',
    'docs/product/use-cases.md',
    'docs/product/acceptance-criteria.md',
    'docs/security/access-control-matrix.md',
    'docs/security/threat-model.md',
    'docs/domain/state-machines.md',
    'docs/architecture/context-and-containers.md',
    'docs/architecture/module-boundaries.md',
    'docs/data/core-data-model.md',
    'docs/api/api-standards.md',
    'docs/api/event-contracts.md',
    'docs/operations/non-functional-requirements.md',
    'docs/adr/0001-monorepo-and-application-layout.md',
    'docs/adr/0002-modular-monolith-and-agent-boundary.md',
    'docs/adr/0003-local-development-topology.md',
    'docs/stage-0-traceability.md'
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
