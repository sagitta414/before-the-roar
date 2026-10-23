param(
  [string]$OutputPath = "tmp/btr-demo-narration-v3.wav"
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

if (-not $key) { throw "Azure AI Services did not return a speech key." }

$ssml = @'
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="en-US">
  <voice name="en-US-GuyNeural">
    <mstts:express-as style="newscast-casual" styledegree="0.55">
      <prosody rate="-2%" pitch="-1%">
        Watch the runner. The defender shifts, and the ball goes through the middle. It feels obvious: the run created the space. But the picture alone cannot prove that.

        <break time="360ms"/> Before the Roar starts a fresh investigation. Scout identifies the movement. Guide makes it clear. Vector measures twenty-three point seven metres of forward passing gain. Check challenges the causal claim. Then Host publishes only what survives.

        <break time="380ms"/> These are real handoffs. Four specialists make separate Azure model requests, while Vector calculates in code. The AI desk keeps the response IDs, evidence, latency, and delivery state visible.

        <break time="420ms"/> Now the defining test. Truth Lab changes one synthetic tracking observation. The defender's measured shift falls from thirteen metres to zero. The passing calculation remains. The movement claim is withdrawn. And the broadcast line corrects itself.

        <break time="380ms"/> That same revision reaches the match screen and Pocket Director. A new fan gets the concept. An analyst gets the positional limit. A numbers fan gets the equation. Nobody gets a different version of the facts.

        <break time="380ms"/> Accessibility Director changes how the moment is delivered, not what happened. Descriptive narration, captions, visual signals, reduced motion, clear language, voice control, and a time-linked transcript all follow the same evidence.

        <break time="400ms"/> Microsoft Foundry audits the public trace. The current crew-versus-baseline result is narrow, and BTR says so. The stronger proven advantage is operational: inspectable reasoning roles, deterministic math, correction, and recovery.

        <break time="400ms"/> Azure Container Apps runs the experience. Entra ID protects access. Blob Storage preserves the proof. Before the Roar turns one football moment into a story every fan can understand, question, and trust.
      </prosody>
    </mstts:express-as>
  </voice>
</speak>
'@

$headers = @{
  "Ocp-Apim-Subscription-Key" = $key
  "Content-Type" = "application/ssml+xml"
  "X-Microsoft-OutputFormat" = "riff-24khz-16bit-mono-pcm"
  "User-Agent" = "before-the-roar-demo-v3"
}

$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory) { New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null }

$uri = "https://$region.tts.speech.microsoft.com/cognitiveservices/v1"
Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($ssml)) -OutFile $OutputPath
Write-Output "Created narration: $OutputPath"
