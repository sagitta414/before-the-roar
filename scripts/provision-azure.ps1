$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
$sub='3226d5fa-52e1-40c0-9c74-67e984356692'
$rg='rg-before-the-roar'
function Run-Az { param([string[]]$Arguments) $value=& az @Arguments --subscription $sub --only-show-errors --output json; if($LASTEXITCODE -ne 0){throw 'Azure operation failed'}; if($value){$value | ConvertFrom-Json} }
$group=Run-Az @('group','create','--name',$rg,'--location','eastus2','--tags','project=before-the-roar','purpose=hackathon')
$identity=Run-Az @('identity','create','--name','btr-runtime-jl107','--resource-group',$rg)
$storage=Run-Az @('storage','account','create','--name','btrjeff107live','--resource-group',$rg,'--location','eastus2','--sku','Standard_LRS','--kind','StorageV2','--allow-blob-public-access','false','--min-tls-version','TLS1_2')
$container=Run-Az @('storage','container','create','--account-name','btrjeff107live','--name','intelligence')
$scopes=@(
 @('AcrPull',"/subscriptions/$sub/resourceGroups/rg-lsds-demo/providers/Microsoft.ContainerRegistry/registries/patchhorizonacr805813"),
 @('Cognitive Services OpenAI User',"/subscriptions/$sub/resourceGroups/rg-automation/providers/Microsoft.CognitiveServices/accounts/automation-jl107"),
 @('Storage Blob Data Contributor',$storage.id)
)
foreach($pair in $scopes){$role=Run-Az @('role','assignment','create','--assignee-object-id',$identity.principalId,'--assignee-principal-type','ServicePrincipal','--role',$pair[0],'--scope',$pair[1])}
@{identityId=$identity.id;clientId=$identity.clientId;storage=$storage.name;resourceGroup=$rg} | ConvertTo-Json | Set-Content 'azure-resources.json'
Write-Output 'App resource group, managed identity, private cache and scoped access ready.'
