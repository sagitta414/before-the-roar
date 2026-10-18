param(
  [string]$OutputPath = "tmp/btr-demo-narration-v2.wav"
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
    <mstts:express-as style="newscast-casual" styledegree="0.45">
      <prosody rate="0%" pitch="-1%">
        Watch the run. The defender moves, and the ball travels through the centre. It looks like an easy story: the run created the space. But did it?

        <break time="420ms"/> This is a fresh BTR investigation. Scout finds the angle. Guide makes it understandable. Vector calculates twenty-three point seven metres of forward passing gain. Check challenges the causal claim. Host publishes only what survives.

        <break time="420ms"/> Four specialists make separate Azure model requests. Vector stays deterministic. The live desk exposes response IDs, sources, handoffs, latency, and delivery time. This run finished in three point two seconds.

        <break time="460ms"/> Now comes the defining test. Truth Lab changes one synthetic tracking observation. The defender's measured shift falls from thirteen metres to zero. The pass calculation remains. The movement claim is withdrawn. And the audience story is revised.

        <break time="420ms"/> The corrected explanation reaches the match screen and Pocket Director together. A newcomer gets the football concept. An analyst gets the positional limit. A numbers fan gets the equation. Every answer cites the same evidence revision.

        <break time="420ms"/> Microsoft Foundry provides a recorded evidence court for the crew-versus-baseline comparison. The current model-scored result is narrow: forty-six to forty-five, with its limits shown. Human blind review remains open; BTR does not turn a test into a marketing claim.

        <break time="420ms"/> Azure Container Apps runs the service. Entra ID and role-based access protect resources. Blob Storage preserves the proof. Before the Roar turns live football data into a story that can be questioned, corrected, and trusted.
      </prosody>
    </mstts:express-as>
  </voice>
</speak>
'@

$headers = @{
  "Ocp-Apim-Subscription-Key" = $key
  "Content-Type" = "application/ssml+xml"
  "X-Microsoft-OutputFormat" = "riff-24khz-16bit-mono-pcm"
  "User-Agent" = "before-the-roar-demo-v2"
}

$outputDirectory = Split-Path -Parent $OutputPath
if ($outputDirectory) { New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null }

$uri = "https://$region.tts.speech.microsoft.com/cognitiveservices/v1"
Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -Body ([Text.Encoding]::UTF8.GetBytes($ssml)) -OutFile $OutputPath
Write-Output "Created narration: $OutputPath"
