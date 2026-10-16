<# Builds and updates an existing Container App, preserving configuration and allowances.
For first deployment use infra/container-app.bicep and your existing Azure resources. #>
param(
 [Parameter(Mandatory)][string]$SubscriptionId,
 [Parameter(Mandatory)][string]$ResourceGroup,
 [Parameter(Mandatory)][string]$RegistryName,
 [Parameter(Mandatory)][string]$AppName,
 [ValidatePattern('^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,100}$')][string]$Tag='v41',
 [switch]$PlanOnly
)
$ErrorActionPreference='Stop'
$btrImage="${RegistryName}.azurecr.io/before-the-roar:$Tag"
$btrPlan=@(
 @('acr','build','--subscription',$SubscriptionId,'--registry',$RegistryName,'--image',"before-the-roar:$Tag",'--file','Dockerfile','.','--only-show-errors'),
 @('containerapp','update','--subscription',$SubscriptionId,'--resource-group',$ResourceGroup,'--name',$AppName,'--image',$btrImage,'--only-show-errors'),
 @('containerapp','show','--subscription',$SubscriptionId,'--resource-group',$ResourceGroup,'--name',$AppName,'--query','{state:properties.provisioningState,image:properties.template.containers[0].image,ready:properties.latestReadyRevisionName}','--output','json')
)
if($PlanOnly){ConvertTo-Json -InputObject $btrPlan -Depth 4;return}
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
 foreach($btrArgs in $btrPlan){ & az @btrArgs; if($LASTEXITCODE -ne 0){throw 'Azure deployment step failed. Existing settings were not replaced.'} }
} finally {Pop-Location}
