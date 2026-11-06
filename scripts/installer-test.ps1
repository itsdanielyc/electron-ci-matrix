# L7 on Windows: install the NSIS bundle silently, launch the installed app,
# confirm it stays alive, uninstall silently, and confirm it is gone.
$ErrorActionPreference = "Stop"
$bundle = Join-Path $PSScriptRoot "..\release"

function Assert($cond, $msg) { if (-not $cond) { Write-Error "FAIL: $msg"; exit 1 } else { Write-Host "ok: $msg" } }

function Find-Installed {
  $roots = @("$env:LOCALAPPDATA\Programs", "$env:LOCALAPPDATA", "$env:ProgramFiles", "${env:ProgramFiles(x86)}")
  foreach ($r in $roots) {
    if (Test-Path $r) {
      $hit = Get-ChildItem -Path $r -Filter "spike.exe" -Recurse -ErrorAction SilentlyContinue -Depth 2 | Select-Object -First 1
      if ($hit) { return $hit.FullName }
    }
  }
  return $null
}

function Stop-Installed($dir) {
  # Electron starts helper processes (GPU, renderer); stop every process that
  # runs from the install folder, and nothing else.
  Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.Path -and $_.Path.StartsWith($dir, [StringComparison]::OrdinalIgnoreCase) } |
    Stop-Process -Force -ErrorAction SilentlyContinue
}

function Smoke-Launch($exe) {
  $p = Start-Process -FilePath $exe -PassThru
  Start-Sleep -Seconds 6
  $alive = -not $p.HasExited
  Stop-Installed (Split-Path $exe)
  Start-Sleep -Seconds 2
  Assert $alive "installed app launched and stayed alive for 6s ($exe)"
}

$setup = Get-ChildItem "$bundle\*-setup.exe" | Select-Object -First 1
Assert ($null -ne $setup) "NSIS installer exists"
$proc = Start-Process -FilePath $setup.FullName -ArgumentList "/S" -Wait -PassThru
Assert ($proc.ExitCode -eq 0) "NSIS silent install exit code 0"
$exe = Find-Installed
Assert ($null -ne $exe) "spike.exe found after NSIS install"
Smoke-Launch $exe
$uninst = Join-Path (Split-Path $exe) "Uninstall spike.exe"
Assert (Test-Path $uninst) "uninstaller present"
$proc = Start-Process -FilePath $uninst -ArgumentList "/S" -Wait -PassThru
Assert ($proc.ExitCode -eq 0) "NSIS silent uninstall exit code 0"
# The NSIS uninstaller re-launches itself from a temp copy and returns at once;
# wait for the files to go rather than for the process.
for ($i = 0; $i -lt 30 -and (Test-Path $exe); $i++) { Start-Sleep -Seconds 1 }
Assert (-not (Test-Path $exe)) "spike.exe removed after NSIS uninstall"
Write-Host "installer tests passed (nsis)"
