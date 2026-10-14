param([string]$Tag='v1')
$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
$sub='3226d5fa-52e1-40c0-9c74-67e984356692'
$info=Get-Content azure-resources.json | ConvertFrom-Json
az acr build --subscription $sub --registry patchhorizonacr805813 --image "before-the-roar:$Tag" --file Dockerfile . --only-show-errors
if($LASTEXITCODE -ne 0){throw 'Image build failed'}
$config=@"
location: eastus2
identity:
  type: UserAssigned
  userAssignedIdentities:
    $($info.identityId): {}
properties:
  managedEnvironmentId: /subscriptions/$sub/resourceGroups/rg-lsds-demo/providers/Microsoft.App/managedEnvironments/patchhorizon-env
  workloadProfileName: Consumption
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: true
      targetPort: 8080
      transport: auto
      allowInsecure: false
    registries:
      - server: patchhorizonacr805813.azurecr.io
        identity: $($info.identityId)
  template:
    containers:
      - name: studio
        image: patchhorizonacr805813.azurecr.io/before-the-roar:$Tag
        resources:
          cpu: 0.25
          memory: 0.5Gi
        env:
          - name: PORT
            value: '8080'
          - name: AZURE_CLIENT_ID
            value: '$($info.clientId)'
          - name: AZURE_OPENAI_ENDPOINT
            value: 'https://automation-jl107.openai.azure.com/'
          - name: AZURE_OPENAI_DEPLOYMENT
            value: 'gpt-4o-mini'
          - name: AZURE_STORAGE_URL
            value: 'https://btrjeff107live.blob.core.windows.net/intelligence/'
          - name: AI_DAILY_LIMIT
            value: '120'
          - name: ALLOWED_ORIGINS
            value: 'https://before-the-roar.sagitta107.chatgpt.site,http://127.0.0.1:4397'
    scale:
      minReplicas: 0
      maxReplicas: 1
      rules:
        - name: http
          http:
            metadata:
              concurrentRequests: '10'
"@
$config | Set-Content azure-containerapp.yaml
az containerapp create --subscription $sub --name before-the-roar --resource-group rg-before-the-roar --yaml azure-containerapp.yaml --query '{url:properties.configuration.ingress.fqdn,state:properties.provisioningState}' --output json --only-show-errors
if($LASTEXITCODE -ne 0){throw 'Container deployment failed'}
