$ErrorActionPreference = 'Stop'
foreach ($sceneId in @('wide', 'press', 'counter')) {
    ffmpeg -hide_banner -loglevel error -y -i "tmp/films/$sceneId.webm" -t 36 -vf 'fps=30' -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p -movflags +faststart -an "dist/assets/$sceneId-film.mp4"
    if ($LASTEXITCODE -ne 0) { throw "Encoding failed: $sceneId" }
    ffmpeg -hide_banner -loglevel error -y -ss 18 -i "dist/assets/$sceneId-film.mp4" -frames:v 1 -q:v 3 "dist/assets/$sceneId-poster.jpg"
    if ($LASTEXITCODE -ne 0) { throw "Poster failed: $sceneId" }
}
