param(
  [string]$OutputDirectory = "dist/story"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$frames = Join-Path $root "tmp/story-frames"
$output = Join-Path $root $OutputDirectory
New-Item -ItemType Directory -Force -Path $frames, $output | Out-Null

$sources = @(
  @{ id = "01"; file = "dist/assets/pitchside-minute-clean.mp4"; second = 3 },
  @{ id = "02"; file = "dist/assets/pitchside-minute-clean.mp4"; second = 12 },
  @{ id = "03"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 11 },
  @{ id = "04"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 38 },
  @{ id = "05"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 21 },
  @{ id = "06"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 31 },
  @{ id = "07"; file = "dist/assets/tracking/training-minute.mp4"; second = 20 },
  @{ id = "08"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 47 },
  @{ id = "09"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 55 },
  @{ id = "10"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 61 },
  @{ id = "11"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 68 },
  @{ id = "12"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 83 },
  @{ id = "13"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 92 },
  @{ id = "14"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 76 },
  @{ id = "15"; file = "dist/assets/before-the-roar-judge-v206.mp4"; second = 101 }
)
foreach ($source in $sources) {
  $destination = Join-Path $frames "$($source.id).jpg"
  & ffmpeg -hide_banner -loglevel error -y -ss $source.second -i $source.file -frames:v 1 -q:v 2 $destination
  if ($LASTEXITCODE -ne 0) { throw "Could not extract $($source.id)" }
}

$slides = @(
  @{ id = "01"; slug = "the-problem"; kicker = "THE PROBLEM"; title = "THE SCORELINE\nISN'T THE STORY."; body = "Football's decisive movements often happen before a shot. Many viewers never see why a moment matters."; source = "AI-GENERATED FICTIONAL FILM"; kind = "hero" },
  @{ id = "02"; slug = "the-question"; kicker = "ONE MOMENT"; title = "DID THE RUN\nCAUSE IT?"; body = "A defender shifts. A pass arrives. Did the runner cause it—or are we seeing two movements at once?"; source = "AI-GENERATED FICTIONAL FILM"; kind = "hero" },
  @{ id = "03"; slug = "watch-the-play"; kicker = "01 / WATCH"; title = "START WITH\nTHE PLAY."; body = "A cinematic minute draws fans in. The Watch Party keeps the film separate from measured evidence."; source = "REAL BTR INTERFACE / REVIEWED FILM"; kind = "screen" },
  @{ id = "04"; slug = "meet-the-crew"; kicker = "THE AI CREW"; title = "FIVE ROLES.\nONE STANDARD."; body = "Scout observes. Guide teaches. Vector calculates. Check challenges. Host brings the answer together."; source = "AI-GENERATED FICTIONAL PRESENTER PORTRAITS"; kind = "portraits" },
  @{ id = "05"; slug = "understand"; kicker = "02 / UNDERSTAND"; title = "MAKE FOOTBALL\nMAKE SENSE."; body = "A new fan learns what an off-ball run is and what to watch on the very next touch."; source = "REAL BTR INTERFACE / BEGINNER VIEW"; kind = "screen" },
  @{ id = "06"; slug = "measure"; kicker = "03 / MEASURE"; title = "MEASURE\nTHE EVIDENCE."; body = "A calibrated synthetic replay reports identity, passes, distance, difficulty and speeds where the pixels support them."; source = "REAL BTR INTERFACE / CONTROLLED MEASUREMENT"; kind = "screen" },
  @{ id = "07"; slug = "automatic-events"; kicker = "VIDEO TO EVENTS"; title = "FROM VIDEO\nTO EVENTS."; body = "The fixed-camera training clip tracks marked fictional players and a visible ball. Broadcast footage remains unvalidated."; source = "CONTROLLED SYNTHETIC TRAINING VIDEO"; kind = "screen" },
  @{ id = "08"; slug = "viewer-challenge"; kicker = "THE VIEWER ASKS"; title = "WHAT CAN\nWE PROVE?"; body = "A fan challenges the claim: did the run cause the defender to move? The crew must separate observation from inference."; source = "REAL BTR INTERFACE / RECORDED CHALLENGE"; kind = "screen"; crop = @(850, 0, 1070, 1080) },
  @{ id = "09"; slug = "change-the-record"; kicker = "04 / CHALLENGE"; title = "CHANGE ONE\nRECORD."; body = "Truth Lab changes the defender's recorded displacement from 13.0 m to 0.0 m."; source = "REAL BTR INTERFACE / SYNTHETIC WHAT-IF"; kind = "screen" },
  @{ id = "10"; slug = "withdraw-the-claim"; kicker = "THE CORRECTION"; title = "WITHDRAW\nTHE CLAIM."; body = "The movement explanation comes off air. Two completed passes remain supported by their own records."; source = "REAL BTR INTERFACE / CORRECTED ROUND"; kind = "screen" },
  @{ id = "11"; slug = "both-screens-update"; kicker = "ONE SOURCE REVISION"; title = "BOTH SCREENS\nUPDATE."; body = "The same correction reaches the studio and Pocket Director. Fans receive a revised story, not a silent rewrite."; source = "REAL BTR INTERFACE / PAIRED PHONE CAPTURE"; kind = "screen" },
  @{ id = "12"; slug = "accessibility"; kicker = "EVERY FAN"; title = "FEEL EVERY\nMOMENT."; body = "Captions, spoken descriptions, simpler language and color-safe markers offer different ways into the same play."; source = "REAL BTR INTERFACE / ACCESSIBILITY DIRECTOR"; kind = "screen" },
  @{ id = "13"; slug = "publish"; kicker = "05 / PUBLISH"; title = "ONE STORY.\nTHREE OUTPUTS."; body = "Prepare studio, streaming and phone views from one checked source revision, with delivery state shown separately."; source = "REAL BTR INTERFACE / OUTPUT DIRECTOR"; kind = "screen" },
  @{ id = "14"; slug = "tool-receipts"; kicker = "INSIDE THE AI DESK"; title = "SHOW THE\nRECEIPTS."; body = "Execution IDs distinguish Azure model requests, deterministic calculation, saved replay and recovery."; source = "REAL BTR INTERFACE / LIVE RECEIPTS"; kind = "screen"; crop = @(1030, 0, 890, 1080) },
  @{ id = "15"; slug = "azure-architecture"; kicker = "BUILT ON MICROSOFT"; title = "FROM PLAY\nTO PROOF."; body = "Container Apps, Azure OpenAI, Foundry and Blob Storage connect the event, specialist review, ledger and outputs."; source = "REAL BTR INTERFACE / AZURE ARCHITECTURE"; kind = "screen" }
)

function Color([string]$value) { return [System.Drawing.ColorTranslator]::FromHtml($value) }
function Brush([string]$value) { return [System.Drawing.SolidBrush]::new((Color $value)) }
function Text($graphics, $value, $x, $y, $width, $height, $size, $color, $family = "Arial", $style = [System.Drawing.FontStyle]::Regular) {
  $font = [System.Drawing.Font]::new($family, [single]$size, $style, [System.Drawing.GraphicsUnit]::Pixel)
  $brush = Brush $color
  $format = [System.Drawing.StringFormat]::new()
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord
  $graphics.DrawString($value.Replace("\n", [Environment]::NewLine), $font, $brush, [System.Drawing.RectangleF]::new($x, $y, $width, $height), $format)
  $format.Dispose(); $brush.Dispose(); $font.Dispose()
}
function Fill($graphics, $x, $y, $w, $h, $color) {
  $brush = Brush $color
  $graphics.FillRectangle($brush, [single]$x, [single]$y, [single]$w, [single]$h)
  $brush.Dispose()
}
function Draw-Cover($graphics, $path, $destination, $crop = $null) {
  $image = [System.Drawing.Image]::FromFile($path)
  try {
    if ($crop) { $sx, $sy, $sw, $sh = $crop }
    else { $sx = 0; $sy = 0; $sw = $image.Width; $sh = $image.Height }
    $targetRatio = $destination.Width / $destination.Height
    $sourceRatio = $sw / $sh
    if ($sourceRatio -gt $targetRatio) { $newWidth = [int]($sh * $targetRatio); $sx += [int](($sw - $newWidth) / 2); $sw = $newWidth }
    else { $newHeight = [int]($sw / $targetRatio); $sy += [int](($sh - $newHeight) / 2); $sh = $newHeight }
    $graphics.DrawImage($image, $destination, [System.Drawing.Rectangle]::new($sx, $sy, $sw, $sh), [System.Drawing.GraphicsUnit]::Pixel)
  } finally { $image.Dispose() }
}

$portraitNames = @("Scout", "Guide", "Vector", "Check", "Host")
foreach ($name in $portraitNames) {
  & ffmpeg -hide_banner -loglevel error -y -i "dist/assets/$($name.ToLower())-portrait.webp" -frames:v 1 (Join-Path $frames "$name.png")
  if ($LASTEXITCODE -ne 0) { throw "Could not convert $name portrait" }
}

foreach ($slide in $slides) {
  $bitmap = [System.Drawing.Bitmap]::new(1920, 1080)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear((Color "#080d16"))
    if ($slide.kind -eq "hero") {
      Draw-Cover $graphics (Join-Path $frames "$($slide.id).jpg") ([System.Drawing.Rectangle]::new(0, 0, 1920, 1080))
      $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new([System.Drawing.Rectangle]::new(0, 0, 1380, 1080), [System.Drawing.Color]::FromArgb(247, 5, 11, 20), [System.Drawing.Color]::FromArgb(0, 5, 11, 20), 0)
      $graphics.FillRectangle($gradient, 0, 0, 1380, 1080); $gradient.Dispose()
      Fill $graphics 0 0 1920 8 "#fd305d"
      Text $graphics $slide.kicker 80 105 700 40 28 "#e7ff3f" "Arial" ([System.Drawing.FontStyle]::Bold)
      Text $graphics $slide.title 80 220 850 300 108 "#ffffff" "Impact"
      Text $graphics $slide.body 86 595 750 230 42 "#e9eff6" "Arial"
      Fill $graphics 80 885 118 8 "#fd305d"
    } else {
      Fill $graphics 0 0 1920 8 "#fd305d"
      Fill $graphics 0 0 560 1080 "#0c1523"
      Fill $graphics 558 108 3 800 "#fd305d"
      Fill $graphics 590 110 1270 730 "#17273a"
      if ($slide.kind -eq "portraits") {
        $x = 610
        foreach ($name in $portraitNames) {
          Fill $graphics $x 166 235 538 "#101b2a"
          Draw-Cover $graphics (Join-Path $frames "$name.png") ([System.Drawing.Rectangle]::new($x + 8, 174, 219, 390))
          Text $graphics $name.ToUpper() ($x + 12) 585 211 80 36 "#ffffff" "Impact"
          $x += 248
        }
      } else {
        Draw-Cover $graphics (Join-Path $frames "$($slide.id).jpg") ([System.Drawing.Rectangle]::new(600, 120, 1250, 704)) $slide.crop
      }
      Fill $graphics 590 842 1270 50 "#142235"
      Text $graphics $slide.source 614 853 1220 36 22 "#bcd0dd" "Arial" ([System.Drawing.FontStyle]::Bold)
      Text $graphics $slide.kicker 78 130 430 48 29 "#e7ff3f" "Arial" ([System.Drawing.FontStyle]::Bold)
      Text $graphics $slide.title 75 236 440 278 79 "#ffffff" "Impact"
      Text $graphics $slide.body 82 572 430 285 33 "#e5edf6" "Arial"
    }
    Fill $graphics 0 930 1920 150 "#080d16"
    Fill $graphics 80 958 74 6 "#fd305d"
    Text $graphics "BTR›" 80 978 180 65 60 "#ffffff" "Impact"
    Text $graphics "BEFORE THE ROAR  /  THE GAME, EXPLAINED." 285 986 1060 55 27 "#cddae5" "Arial" ([System.Drawing.FontStyle]::Bold)
    Text $graphics "$($slide.id) / 15" 1680 984 180 54 30 "#e7ff3f" "Arial" ([System.Drawing.FontStyle]::Bold)
    $destination = Join-Path $output "$($slide.id)-$($slide.slug).png"
    $bitmap.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally { $graphics.Dispose(); $bitmap.Dispose() }
}

$manifest = $slides | ForEach-Object {
  [ordered]@{
    number = [int]$_.id
    title = $_.title.Replace("\n", " ")
    description = $_.body
    image = "story/$($_.id)-$($_.slug).png"
    source = $_.source
  }
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $output "manifest.json") -Encoding utf8
$zip = Join-Path $root "dist/assets/btr-visual-story-15.zip"
if (Test-Path $zip) { Remove-Item -LiteralPath $zip }
Compress-Archive -Path (Join-Path $output "*.png") -DestinationPath $zip -CompressionLevel Optimal
Write-Output "Created $($slides.Count) story images and $zip"
