param([switch]$AllowAdditionalRequests)
$ErrorActionPreference='Stop'
if(!$AllowAdditionalRequests){throw 'Raising the daily ceiling requires explicit approval for twelve additional requests; then pass -AllowAdditionalRequests'}
$env:PYTHONIOENCODING='utf-8'
$app='before-the-roar'
$group='rg-before-the-roar'
$origin='https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io'
$before=$null
for($attempt=0;$attempt -lt 30;$attempt++){
 $before=Invoke-RestMethod "$origin/api/health"
 if($null -ne $before.usage){break}
 Start-Sleep -Seconds 2
}
if($null -eq $before.usage){throw 'The current deployment must report its allowance before verification'}
$originalLimit=$before.usage.limit
$verificationLimit=$before.usage.used+12
Write-Output "Counter before verification: $($before.usage.used); temporary ceiling: $verificationLimit"
try {
 az containerapp update --name $app --resource-group $group --set-env-vars "AI_DAILY_LIMIT=$verificationLimit" --only-show-errors --query properties.provisioningState --output tsv
 if($LASTEXITCODE -ne 0){throw 'Could not enable the twelve approved verification requests'}
 $ready=$false
 for($attempt=0;$attempt -lt 30;$attempt++){
  $health=Invoke-RestMethod "$origin/api/health"
  if($health.usage.limit -eq $verificationLimit){$ready=$true;break}
  Start-Sleep -Seconds 2
 }
 if(!$ready){throw 'The new request allowance is not serving traffic yet'}
 node scripts/production-smoke.mjs https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io --full
 if($LASTEXITCODE -ne 0){throw 'Live verification did not pass; inspect its error before retrying'}
} finally {
 az containerapp update --name $app --resource-group $group --set-env-vars "AI_DAILY_LIMIT=$originalLimit" --only-show-errors --query '{state:properties.provisioningState,revision:properties.latestRevisionName}' --output json
 if($LASTEXITCODE -ne 0){throw 'Could not confirm restoration of the 120-request allowance'}
}
