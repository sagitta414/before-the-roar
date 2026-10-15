$ErrorActionPreference='Stop'
$env:PYTHONIOENCODING='utf-8'
$recoveryCode=@'
(async()=>{const {ResultStore}=await import('/app/api/azure.mjs');const store=new ResultStore();const res=await store.blob('?restype=container&comp=list&prefix=agents/evaluation-');if(!res.ok)throw Error('Cannot list evaluation checkpoints');const xml=await res.text();const names=[...xml.matchAll(/<Name>(agents\/evaluation-[^<]+)<\/Name>/g)].map(m=>m[1]);const runs=[];for(const name of names){const r=await store.blob(name);if(!r.ok)throw Error('Cannot recover checkpoint');runs.push({name,value:await r.json()});}console.log('BTR_RECOVERY64='+Buffer.from(JSON.stringify({recovered_at:new Date().toISOString(),runs})).toString('base64'));})().catch(e=>{console.error(e.message);process.exitCode=1;});
'@
$encoded=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($recoveryCode))
$command='node -e "eval(Buffer.from('''+$encoded+''',''base64'').toString())"'
& 'C:/Program Files/Microsoft SDKs/Azure/CLI2/python.exe' -IBm azure.cli containerapp exec --subscription 3226d5fa-52e1-40c0-9c74-67e984356692 --name before-the-roar --resource-group rg-before-the-roar --container studio --command $command --only-show-errors | Set-Content -LiteralPath tmp/evaluation-recovery.txt -Encoding utf8
if($LASTEXITCODE -ne 0){throw 'Evaluation recovery failed'}
