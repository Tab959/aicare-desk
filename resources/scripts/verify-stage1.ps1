$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$requiredFiles = @(
    'frontend/package.json',
    'frontend/pnpm-workspace.yaml',
    'frontend/tsconfig.base.json',
    'resources/config/.editorconfig',
    'resources/config/.env.example',
    'frontend/customer-web/package.json',
    'frontend/customer-web/src/main.tsx',
    'frontend/staff-web/package.json',
    'frontend/staff-web/src/main.tsx',
    'frontend/packages/shared/src/index.ts',
    'frontend/packages/ui/src/index.ts',
    'frontend/packages/api-client/src/index.ts',
    'backend/platform-api/pom.xml',
    'backend/platform-api/src/main/java/com/aicare/platform/PlatformApiApplication.java',
    'backend/platform-api/src/main/java/com/aicare/platform/system/SystemHealthController.java',
    'backend/platform-api/src/main/resources/db/migration/V1__create_stage1_baseline.sql',
    'backend/agent-service/pyproject.toml',
    'backend/agent-service/src/aicare_agent_service/main.py',
    'resources/deploy/compose/compose.yaml',
    'resources/scripts/start-core.ps1',
    'resources/scripts/stop-core.ps1',
    'resources/scripts/verify-vm-core.ps1',
    'resources/docs/superpowers/plans/2026-06-24-stage-1-engineering-environment-baseline.md'
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
    if ($content -match $forbiddenPattern) {
        $errors.Add("Placeholder text: $relativePath")
    }
}

if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Error $_ }
    exit 1
}

Write-Output 'STAGE1_STRUCTURE_OK'

if (Get-Command pnpm -ErrorAction SilentlyContinue) {
    Push-Location (Join-Path $repoRoot 'frontend')
    try {
        pnpm -r --if-present check
        if ($LASTEXITCODE -ne 0) {
            throw "pnpm check failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Output 'SKIP_PNPM_CHECK: pnpm not found'
}

if (Get-Command mvn -ErrorAction SilentlyContinue) {
    $jdk17Candidates = @(
        (Join-Path $repoRoot '.jdk\jdk-17'),
        'D:\develop\Java\jdk-17',
        'C:\Program Files\Eclipse Adoptium\jdk-17',
        'C:\Program Files\Java\jdk-17'
    )
    $jdk17 = $jdk17Candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if ($jdk17) {
        $env:JAVA_HOME = $jdk17
        $env:Path = "$(Join-Path $env:JAVA_HOME 'bin');$env:Path"
        Write-Output "USING_JAVA_HOME: $env:JAVA_HOME"
    }

    Push-Location (Join-Path $repoRoot 'backend/platform-api')
    try {
        mvn -q clean test
        if ($LASTEXITCODE -ne 0) {
            throw "mvn test failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Output 'SKIP_MAVEN_TEST: mvn not found'
}

$agentRoot = Join-Path $repoRoot 'backend/agent-service'
$agentVenvPython = Join-Path $agentRoot '.venv/Scripts/python.exe'
if (Test-Path -LiteralPath $agentVenvPython) {
    Push-Location $agentRoot
    try {
        & $agentVenvPython -m pytest
        if ($LASTEXITCODE -ne 0) {
            throw "pytest failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Output 'SKIP_AGENT_TEST: backend/agent-service/.venv not found'
}

if (Get-Command docker -ErrorAction SilentlyContinue) {
    $composeFile = Join-Path $repoRoot 'resources/deploy/compose/compose.yaml'
    $composeEnvFile = Join-Path $repoRoot 'resources/deploy/compose/.env.example'
    docker compose --env-file $composeEnvFile -f $composeFile --profile core config | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose config failed with exit code $LASTEXITCODE"
    }
    Write-Output 'COMPOSE_CORE_CONFIG_OK'
}
else {
    Write-Output 'SKIP_COMPOSE_CONFIG: docker not found'
}

Write-Output 'STAGE1_BASELINE_OK'
