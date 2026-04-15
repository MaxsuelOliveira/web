$taskName = "MonitorHubLocalServer"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$batchPath = Join-Path $projectRoot "start-monitor-hub.bat"

if (-not (Test-Path $batchPath)) {
    throw "Arquivo start-monitor-hub.bat nao encontrado em $projectRoot"
}

$action = New-ScheduledTaskAction -Execute $batchPath -Argument "--server-only"
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Inicializa o servidor local do Monitor Hub ao entrar no Windows" -Force

Write-Host "Tarefa $taskName registrada com sucesso."