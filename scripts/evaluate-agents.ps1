$ErrorActionPreference='Stop'
$env:AZURE_OPENAI_ENDPOINT='https://automation-jl107.openai.azure.com/'
$env:AZURE_OPENAI_DEPLOYMENT='gpt-4o-mini'
$env:AZURE_STORAGE_URL='https://btrjeff107live.blob.core.windows.net/intelligence/'
# Same existing daily guard. No counter or cloud configuration changes.
$env:AI_DAILY_LIMIT='120'
$env:AI_DAILY_LIMIT_OVERRIDE_DATE='2026-10-15'
$env:AI_DAILY_LIMIT_OVERRIDE='192'
try {
 $env:AZURE_ACCESS_TOKEN=az account get-access-token --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --resource https://cognitiveservices.azure.com/ --query accessToken --output tsv
 if($LASTEXITCODE -ne 0){throw 'Azure model authentication unavailable'}
 $env:BTR_EVAL_STORAGE_TOKEN=az account get-access-token --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --resource https://storage.azure.com/ --query accessToken --output tsv
 if($LASTEXITCODE -ne 0){throw 'Azure storage authentication unavailable'}
 node scripts/evaluate-agents.mjs --live
 if($LASTEXITCODE -ne 0){throw 'Evaluation incomplete; inspect the saved partial report'}
} finally {
 Remove-Item Env:AZURE_ACCESS_TOKEN -ErrorAction SilentlyContinue
 Remove-Item Env:BTR_EVAL_STORAGE_TOKEN -ErrorAction SilentlyContinue
}
