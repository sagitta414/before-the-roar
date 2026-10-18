param(
  [string]$OutputPath = "tmp/btr-demo-narration.wav"
)

$ErrorActionPreference = "Stop"
$resourceGroup = "rg-lsds-demo"
$accountName = "lsds-ai-foundry-jl"
$region = "eastus2"

$key = az cognitiveservices account keys list `
  --resource-group $resourceGroup `
  --name $accountName `
  --query "key1" `
  --output tsv

if (-not $key) {
  throw "Azure AI Services did not return a speech key."
}

$ssml = @'
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="en-US-GuyNeural">
    <mstts:express-as style="newscast-casual" styledegree="0.75">
      <prosody rate="-2%" pitch="-2%">
        Football data can tell you what happened. <break time="350ms"/> Before the Roar asks the harder question: why did it matter, and can that explanation survive a challenge?

        <break time="550ms"/> Here is the moment. At sixty-seven sixteen, a synthetic tracking event enters the studio. A winger moves wide. A defender follows. The ball keeps travelling through the centre.

        <break time="450ms"/> Five specialists investigate the same evidence. Scout spots the movement. Guide explains what a new fan should watch. Vector calculates twenty-three point seven metres of forward passing gain. Check pushes back: movement happened, but the data does not prove why. Host publishes only what the evidence supports.

        <break time="550ms"/> Then we change one record. The defender's measured shift falls from thirteen metres to zero. The completed passes remain. The unsupported claim is withdrawn, and the broadcast line changes with it. One correction. Three visible consequences.

        <break time="550ms"/> The same match becomes a different experience for every viewer. A newcomer gets the football idea. An analyst gets the positional consequence and its limits. A numbers fan gets the equation. A supporter can follow a club, a player, or a preferred language.

        <break time="500ms"/> Behind the broadcast, the Production Desk shows exactly what ran: live model requests, deterministic calculations, saved replay, execution IDs, latency, sources, and recovery state. Microsoft Foundry acts as an evidence court, auditing the public claims and the handoffs between specialists.

        <break time="500ms"/> Azure Container Apps runs the service. Microsoft Entra ID and role-based access protect resources. Blob Storage preserves conflict-safe proof. Pocket Director carries the same trusted explanation to the fan's phone.

        <break time="550ms"/> Before the Roar turns one football moment into match intelligence that can reason, verify, correct, and communicate. Every play. Every perspective. Every claim earned.
      </prosody>
    </mstts:express-as>
  </voice>
</speak>
'@

$headers = @{
  "Ocp-Apim-Subscription-Key" = $key
  "Content-Type" = "application/ssml+xml"
  "X-Microsoft-OutputFormat" = "riff-24khz-16bit-mono-pcm"
  "User-Agent" = "before-the-roar-demo"
}

$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

$uri = "https://$region.tts.speech.microsoft.com/cognitiveservices/v1"
Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($ssml)) -OutFile $OutputPath
Write-Output "Created narration: $OutputPath"
