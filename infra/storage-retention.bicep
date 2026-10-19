// Applies bounded retention to anonymous AI checkpoints created by the prototype.
param storageAccountName string
@minValue(1)
@maxValue(30)
param deleteAfterDays int = 2
param containerName string = 'intelligence'

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource lifecycle 'Microsoft.Storage/storageAccounts/managementPolicies@2023-05-01' = {
  parent: storage
  name: 'default'
  properties: {
    policy: {
      rules: [
        {
          name: 'delete-expired-btr-agent-checkpoints'
          enabled: true
          type: 'Lifecycle'
          definition: {
            filters: {
              blobTypes: [
                'blockBlob'
              ]
              prefixMatch: [
                '${containerName}/agents/'
              ]
            }
            actions: {
              baseBlob: {
                delete: {
                  daysAfterModificationGreaterThan: deleteAfterDays
                }
              }
            }
          }
        }
      ]
    }
  }
}
