$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
Invoke-RestMethod 'https://before-the-roar.icypebble-9d6c9f05.eastus2.azurecontainerapps.io/api/health' | Out-Null
$btrRevision=az containerapp show --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --name before-the-roar --resource-group rg-before-the-roar --query properties.latestReadyRevisionName -o tsv
$btrReplica=az containerapp replica list --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --name before-the-roar --resource-group rg-before-the-roar --revision $btrRevision --query '[0].name' -o tsv
if(!$btrReplica){throw 'No active replica; no comparison started'}
& 'C:/Program Files/Microsoft SDKs/Azure/CLI2/python.exe' -IBm azure.cli containerapp exec --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --name before-the-roar --resource-group rg-before-the-roar --revision $btrRevision --replica $btrReplica --container studio --command 'node scripts/heldout-commentary.mjs --live' --only-show-errors | Set-Content -LiteralPath tmp/heldout-commentary-console.txt -Encoding utf8
if($LASTEXITCODE -ne 0){throw 'Comparison incomplete; inspect retained results before retrying'}
$log=Get-Content tmp/heldout-commentary-console.txt -Raw
if($log -match 'BTR_COMMENTARY64=([A-Za-z0-9+/=]+)'){
 $json=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Matches[1]))
 $json | Set-Content docs/proof/heldout-commentary.json -Encoding utf8
 $json | Set-Content docs/proof/heldout-commentary.json -Encoding utf8
 ($json | ConvertFrom-Json) | Select-Object complete,requests,allowance_after | ConvertTo-Json
}else{throw 'No completed report receipt; do not repeat model calls'}

