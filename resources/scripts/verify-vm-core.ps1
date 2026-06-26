param(
    [string]$VmHost = 'aicare-vm',
    [string]$RemoteComposeDir = '~/aicare-desk/resources/deploy/compose'
)

$ErrorActionPreference = 'Stop'

$remoteCommand = @"
set -eu
cd $RemoteComposeDir
set -a
. ./.env
set +a
docker compose --env-file .env -f compose.yaml --profile core ps
docker exec aicare-redis redis-cli -a "`$REDIS_PASSWORD" ping
docker exec aicare-mysql mysqladmin ping -h 127.0.0.1 -u"`$MYSQL_USER" -p"`$MYSQL_PASSWORD" --silent
"@

ssh -o BatchMode=yes $VmHost $remoteCommand
if ($LASTEXITCODE -ne 0) {
    throw "VM core verification failed with exit code $LASTEXITCODE"
}

Write-Output 'VM_CORE_OK'
