$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\KELIONAI LIVE.url")
$Shortcut.TargetPath = "https://raddled-joline-overfruitful.ngrok-free.dev"
$Shortcut.Save()

Write-Host "✅ Shortcut creat pe Desktop: KELIONAI LIVE" -ForegroundColor Green
