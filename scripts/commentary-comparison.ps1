$ErrorActionPreference='Stop'
$env:AZURE_OPENAI_ENDPOINT='https://automation-jl107.openai.azure.com/'
$env:AZURE_OPENAI_DEPLOYMENT='gpt-4o-mini'
$env:AZURE_STORAGE_URL='https://btrjeff107live.blob.core.windows.net/intelligence/'
$env:AI_DAILY_LIMIT='240'
try {
 $env:AZURE_ACCESS_TOKEN=az account get-access-token --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --resource https://cognitiveservices.azure.com/ --query accessToken --output tsv
 if($LASTEXITCODE -ne 0){throw 'Model authentication unavailable'}
 $env:BTR_EVAL_STORAGE_TOKEN=az account get-access-token --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --resource https://storage.azure.com/ --query accessToken --output tsv
 if($LASTEXITCODE -ne 0){throw 'Storage authentication unavailable'}
 node scripts/commentary-comparison.mjs --live
 if($LASTEXITCODE -ne 0){throw 'Comparison incomplete; retain failures'}
} finally {
 Remove-Item Env:AZURE_ACCESS_TOKEN -ErrorAction SilentlyContinue
 Remove-Item Env:BTR_EVAL_STORAGE_TOKEN -ErrorAction SilentlyContinue
}
