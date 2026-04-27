$dl = "$env:USERPROFILE\Downloads"
$msg = if ($args[0]) { $args[0] } else { "Sprint update" }

if (Test-Path "$dl\App-final.js")    { Copy-Item "$dl\App-final.js" "components\App.js" -Force; Write-Host "App.js copied" }
if (Test-Path "$dl\share.js")        { Copy-Item "$dl\share.js" "pages\share.js" -Force; Write-Host "share.js copied" }
if (Test-Path "$dl\confirm.js")      { Copy-Item "$dl\confirm.js" "pages\confirm.js" -Force; Write-Host "confirm.js copied" }
if (Test-Path "$dl\handleEvent.js")  { Copy-Item "$dl\handleEvent.js" "pages\api\handleEvent.js" -Force; Write-Host "handleEvent.js copied" }
if (Test-Path "$dl\sendEmail.js")    { Copy-Item "$dl\sendEmail.js" "pages\api\sendEmail.js" -Force; Write-Host "sendEmail.js copied" }
if (Test-Path "$dl\sendSMS.js")      { Copy-Item "$dl\sendSMS.js" "pages\api\sendSMS.js" -Force; Write-Host "sendSMS.js copied" }

git add -A
git commit -m $msg
git push
Write-Host "Done"