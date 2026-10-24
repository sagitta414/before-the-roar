param([string]$Voice = 'en-US-Andrew2:DragonHDLatestNeural', [string]$SceneFile='scripts/demo-v4-scenes.json', [string]$OutputFolder='tmp/submission-demo-v4')
$ErrorActionPreference = 'Stop'
$key = az cognitiveservices account keys list --resource-group rg-lsds-demo --name lsds-ai-foundry-jl --query key1 --output tsv
if (-not $key) { throw 'Speech credentials unavailable.' }
$folder = $OutputFolder
New-Item -ItemType Directory -Path $folder -Force | Out-Null
$scenes = Get-Content $SceneFile -Raw | ConvertFrom-Json
$headers = @{'Ocp-Apim-Subscription-Key'=$key; 'Content-Type'='application/ssml+xml'; 'X-Microsoft-OutputFormat'='riff-48khz-16bit-mono-pcm'}
for ($i=0; $i -lt $scenes.Count; $i++) {
  $text = [Security.SecurityElement]::Escape($scenes[$i].text)
  $sceneVoice = if ($scenes[$i].voice) { $scenes[$i].voice } else { $Voice }
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='$sceneVoice'>$text</voice></speak>"
  Invoke-WebRequest -Uri 'https://eastus2.tts.speech.microsoft.com/cognitiveservices/v1' -Method Post -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($ssml)) -OutFile "$folder/voice-$i.wav"
  Write-Output "Narration scene $i ready"
}
@{voice=$Voice;provider='Azure AI Speech';generated_at=[DateTime]::UtcNow.ToString('o')} | ConvertTo-Json | Set-Content "$folder/voice.json"
