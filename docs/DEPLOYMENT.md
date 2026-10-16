# Reproduce the Azure deployment

The public repository contains the Node application and a parameterized Container App template. No creator-specific subscription IDs or credentials are required.

## Run locally

Use Node 22: `npm ci`, `npm test`, then `npm run studio`. Open http://127.0.0.1:4397/?tour=1#watch. Reviewed explanations, the guided tour, saved receipt replay and synthetic calculations work without Azure credentials. Optional cinematic files are not distributed in GitHub.

## Existing Azure prerequisites

- A resource group, Container Apps environment and Azure Container Registry.
- An Azure OpenAI resource with a compatible chat deployment and a private Blob container.
- A user-assigned managed identity with **AcrPull** on the registry, **Cognitive Services OpenAI User** on the model resource, and **Storage Blob Data Contributor** on the storage scope.
- Azure CLI and Bicep installed; the operator needs deployment and registry-build access.

These resources incur Azure costs. The supplied template creates only the Container App and reuses those prerequisites. It does not grant roles or provision a model, registry, environment or storage account automatically.

## First Container App deployment

1. Copy `infra/parameters.example.json` to ignored `infra/parameters.local.json`; fill in your resource IDs, endpoint and frontend origin. Use a private Blob container URL without a SAS token.
2. Build the image: `az acr build --subscription YOUR_SUBSCRIPTION --registry YOUR_REGISTRY --image before-the-roar:v41 --file Dockerfile .`
3. Inspect: `az deployment group what-if --subscription YOUR_SUBSCRIPTION --resource-group YOUR_GROUP --template-file infra/container-app.bicep --parameters @infra/parameters.local.json`.
4. Apply with `az deployment group create` using the same arguments. Its output is the app URL.
5. Set `dist/api-config.json` to that URL for a separately hosted frontend; allow its origin in `allowedOrigins`. The Container App also serves the frontend itself.

The default allowance is 120 requests per UTC day. A new discussion can use six requests; plain playback and the guided tour generate none. The allowance is not a currency budget. The template uses zero minimum replicas and one maximum replica.

## Subsequent releases

```powershell
./scripts/deploy-azure.ps1 -SubscriptionId YOUR_SUBSCRIPTION -ResourceGroup YOUR_GROUP -RegistryName YOUR_REGISTRY -AppName YOUR_APP -Tag v41 -PlanOnly
```

Review the generated arguments, then omit `-PlanOnly` to build and update. This path updates the image only, preserving environment variables, origin restrictions, identity and allowance settings. Check the ready revision and `/api/health`.

Use the previous image tag with `az containerapp update --image` to roll back. Do not restore an older parameter file over current production settings during an ordinary image release.

The public Site is a separate static publication. Its managed repository identity is excluded from public source. You can host `dist/` on your preferred static host or use the Container App URL.
