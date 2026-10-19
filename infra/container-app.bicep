// Deploys the app into existing Azure resources; model/storage provisioning is separate.
param location string = resourceGroup().location
param appName string
param environmentId string
param identityId string
param identityClientId string
param registryServer string
param image string
param openAIEndpoint string
param modelDeployment string = 'gpt-4o-mini'
param storageContainerUrl string
param foundryProjectEndpoint string = ''
param foundryModel string = 'texasgpt-prod'
param allowedOrigins string
@minValue(1)
@maxValue(10000)
param dailyLimit int = 120

resource app 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${identityId}': {}
    }
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
      registries: [
        {
          server: registryServer
          identity: identityId
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'studio'
          image: image
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'PORT'
              value: '8080'
            }
            {
              name: 'AZURE_CLIENT_ID'
              value: identityClientId
            }
            {
              name: 'AZURE_OPENAI_ENDPOINT'
              value: openAIEndpoint
            }
            {
              name: 'AZURE_OPENAI_DEPLOYMENT'
              value: modelDeployment
            }
            {
              name: 'AZURE_STORAGE_URL'
              value: storageContainerUrl
            }
            {
              name: 'FOUNDRY_PROJECT_ENDPOINT'
              value: foundryProjectEndpoint
            }
            {
              name: 'FOUNDRY_MODEL'
              value: foundryModel
            }
            {
              name: 'ALLOWED_ORIGINS'
              value: allowedOrigins
            }
            {
              name: 'AI_DAILY_LIMIT'
              value: string(dailyLimit)
            }
            {
              name: 'BTR_AGENT_RETENTION_HOURS'
              value: '24'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}
output url string = 'https://${app.properties.configuration.ingress.fqdn}'
