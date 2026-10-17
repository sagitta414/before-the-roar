$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
$source=Get-Content scripts/commentary-comparison.mjs -Raw
$source=$source.Replace("'../api/azure.mjs'","'file:///app/api/azure.mjs'")
$source=$source.Replace("JSON.parse(await readFile('dist/assets/tracking/validation.json'))",(Get-Content dist/assets/tracking/validation.json -Raw))
$source=$source.Replace("JSON.parse(await readFile('dist/assets/tracking/calibration.json')).roster",('('+(Get-Content dist/assets/tracking/calibration.json -Raw)+').roster'))
$source=$source.Replace('new EvaluationStore()','new ResultStore()').Replace("process.argv.includes('--live')",'true')
$source=$source.Replace('dist/assets/tracking/commentary-comparison.json','/tmp/btr-commentary-comparison-v64.json').Replace('docs/proof/commentary-comparison-plan.json','/tmp/btr-commentary-plan-v64.json').Replace('docs/proof/commentary-comparison.json','/tmp/btr-commentary-copy-v64.json')
$source += "`nconsole.log('BTR_COMMENTARY64='+Buffer.from(JSON.stringify(report)).toString('base64'));"
$bytes=[Text.Encoding]::UTF8.GetBytes($source)
$memory=[IO.MemoryStream]::new()
$gzip=[IO.Compression.GZipStream]::new($memory,[IO.Compression.CompressionLevel]::Optimal,$true)
$gzip.Write($bytes,0,$bytes.Length);$gzip.Dispose()
$encoded=[Convert]::ToBase64String($memory.ToArray());$memory.Dispose()
$command='node -e "import(''data:text/javascript;base64,''+require(''zlib'').gunzipSync(Buffer.from('''+$encoded+''',''base64'')).toString(''base64''))"'
& 'C:/Program Files/Microsoft SDKs/Azure/CLI2/python.exe' -IBm azure.cli containerapp exec --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --name before-the-roar --resource-group rg-before-the-roar --container studio --command $command --only-show-errors | Set-Content -LiteralPath tmp/commentary-comparison-console.txt -Encoding utf8
if($LASTEXITCODE -ne 0){throw 'Comparison incomplete; inspect retained results before retrying'}
$log=Get-Content tmp/commentary-comparison-console.txt -Raw
if($log -match 'BTR_COMMENTARY64=([A-Za-z0-9+/=]+)'){
 $json=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Matches[1]))
 $json | Set-Content dist/assets/tracking/commentary-comparison.json -Encoding utf8
 $json | Set-Content docs/proof/commentary-comparison.json -Encoding utf8
 ($json | ConvertFrom-Json) | Select-Object complete,requests,allowance_after | ConvertTo-Json
}else{throw 'No completed report receipt; do not repeat model calls'}
