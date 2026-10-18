"""Controlled synthetic football video. Ground truth stays outside the web assets.
The browser detector receives only compressed pixels, marker enrollment and pitch calibration.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, math, subprocess, shutil, random, argparse
parser=argparse.ArgumentParser();parser.add_argument("--seed",type=int,default=0);parser.add_argument("--output",default="dist/assets/tracking");parser.add_argument("--truth",default="docs/proof/tracking-ground-truth.json");args=parser.parse_args();rng=random.Random(args.seed)
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/args.output;OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS=1536,1024,30
roster=[(6,'Amir Cole','Holding midfielder','harbor',[255,200,40],(27,38)),(8,'Mateo Silva','Central midfielder','harbor',[40,230,235],(49,29)),(10,'Rafael Costa','Attacking midfielder','harbor',[180,95,245],(67,39)),(7,'Luca Moreau','Left winger','harbor',[255,125,35],(73,15)),(9,'Theo Brooks','Striker','harbor',[125,245,55],(84,32)),(102,'Jules Laurent','Right back','north',[70,110,255],(77,22)),(104,'Alex Ross','Centre back','north',[245,60,75],(85,40)),(101,'Max Berg','Goalkeeper','north',[35,245,135],(100,34))]
actions=[(4,5.6,6,8,'pass'),(12,13.4,8,10,'pass'),(20,21.7,10,7,'pass'),(28,29.0,7,9,'pass'),(36,36.65,9,None,'shot'),(44,45.6,6,8,'pass'),(52,53.2,8,10,'pass'),(57,58.5,10,None,'shot')]
if args.seed:
 roster=[(*r[:5],(r[5][0]+rng.uniform(-2,2),r[5][1]+rng.uniform(-3,3))) for r in roster]
 actions=[(a+rng.uniform(-.5,.5),b+rng.uniform(-.3,.3),c,e,f) for a,b,c,e,f in actions]
 actions=[(a,max(a+.5,b),c,e,f) for a,b,c,e,f in actions]
def pos(pid,t):
 r=next(r for r in roster if r[0]==pid);x,y=r[5]
 # Small continuous off-ball motion; attack develops before the second phase.
 return (x+min(t,36)*(.08 if pid<100 else .025),y+math.sin(t*.18+pid)*.7)
def ball(t):
 owner=6
 for start,end,a,b,kind in actions:
  if t>=40 and start<40:continue
  if t<start:return pos(owner,t)
  if t<=end:
   p=pos(a,start);q=pos(b,end) if b else (104.4,34)
   f=(t-start)/(end-start);return (p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f)
  if kind=='shot':
   if t<40 or start>40:return (104.4,34)
  owner=b or 6
 return (104.4,34)
camera={'center':768,'top':432,'height':374,'farWidth':1536,'nearWidth':1536}
def px(p):
 x,y=p;return (camera['center']+(x/105-.5)*(camera['farWidth']+(camera['nearWidth']-camera['farWidth'])*y/68),camera['top']+camera['height']*y/68)
plate=ROOT/'artwork/broadcast-stadium-plate-v141.png'
if not plate.exists():raise RuntimeError('Missing photorealistic broadcast stadium plate')
base=Image.open(plate).convert('RGB').resize((W,H),Image.Resampling.LANCZOS);d=ImageDraw.Draw(base)
try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20);small=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',15);bold=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',27)
except:font=small=bold=ImageFont.load_default()
# Network-style score bug and source plate. These are presentation only; detection
# still reads the enrolled markers and yellow ball from the compressed pixels.
d.rounded_rectangle((34,34,405,112),radius=7,fill=(7,13,20),outline=(105,126,146),width=1)
d.rectangle((34,34,42,112),fill=(240,47,80))
d.text((60,51),'HARBOR',font=small,fill=(191,207,220));d.text((167,46),'0',font=bold,fill=(255,255,255))
d.text((218,51),'NORTHBRIDGE',font=small,fill=(191,207,220));d.text((365,46),'0',font=bold,fill=(255,255,255))
d.rounded_rectangle((1280,35,1495,104),radius=7,fill=(7,13,20),outline=(105,126,146),width=1)
d.text((1304,51),'BTR / TACTICAL',font=small,fill=(231,235,239));d.text((1304,76),'MEASURED LIVE',font=small,fill=(205,235,92))
d.rectangle((0,842,W,H),fill=(6,12,18))
d.text((38,878),'PIXEL-MEASURED TRAINING MATCH',font=bold,fill=(244,247,249))
d.text((38,922),'SYNTHETIC PLAYERS  /  CALIBRATED CAMERA  /  ENROLLED KIT PATCHES',font=small,fill=(161,183,198))
atlas=Image.open(ROOT/'artwork/football-strides-v67.png').convert('RGBA');sprites=[]
for row in range(2):
 group=[]
 for col in range(4):
  cell=atlas.crop((round(col*atlas.width/4),round(row*atlas.height/2),round((col+1)*atlas.width/4),round((row+1)*atlas.height/2)))
  bounds=cell.getchannel('A').getbbox()
  if not bounds:raise RuntimeError('Missing player artwork')
  group.append(cell.crop(bounds))
 sprites.append(group)
sprite_cache={}
truth=[]
ffmpeg=shutil.which('ffmpeg')
if not ffmpeg:raise RuntimeError('ffmpeg required')
proc=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'training-minute.mp4')],stdin=subprocess.PIPE)
for frame in range(60*FPS):
 t=frame/FPS;im=base.copy();d=ImageDraw.Draw(im)
 for pid,name,role,team,color,xy in sorted(roster,key=lambda r:pos(r[0],t)[1]):
  world=pos(pid,t);x,y=px(world);stride=math.sin(t*7+pid)*2
  height=58+round(14*world[1]/68)
  d.ellipse((x-height*.24,y-3,x+height*.28,y+6),fill=(8,26,20))
  row=0 if team=='harbor' else 1;phase=int(t*3+pid)%4;key=(row,phase,height)
  if key not in sprite_cache:
   source=sprites[row][phase];sprite_cache[key]=source.resize((round(source.width*height/source.height),height),Image.Resampling.LANCZOS)
  sprite=sprite_cache[key];im.paste(sprite,(round(x-sprite.width/2),round(y-height+2)),sprite);d=ImageDraw.Draw(im)
  # Enrolled training patch remains large enough to survive video compression.
  d.rounded_rectangle((x-6,y-35,x+6,y-23),radius=2,fill=tuple(color),outline=(245,248,250),width=1)
 bx,by=px(ball(t));d.ellipse((bx-13,by-13,bx+13,by+13),fill=(242,244,239),outline=(24,32,34),width=2);d.ellipse((bx-9,by-9,bx+9,by+9),fill=(250,55,195))
 d.rounded_rectangle((1280,118,1495,157),radius=5,fill=(7,13,20));d.text((1310,128),f'{t:05.1f} / 60.0',font=font,fill=(235,239,243))
 proc.stdin.write(im.tobytes())
 if frame==480:im.save(OUT/'poster.jpg',quality=92)
 if frame%3==0:truth.append({'t':t,'ball':ball(t),'players':{str(r[0]):pos(r[0],t) for r in roster}})
proc.stdin.close()
if proc.wait():raise RuntimeError('encoding failed')
(ROOT/args.truth).write_text(json.dumps({'actions':[{'start':a,'end':b,'from':c,'to':e,'type':f,'speed':math.dist(pos(c,a),pos(e,b) if e else (104.4,34))/(b-a)*3.6} for a,b,c,e,f in actions],'frames':truth}),encoding='utf-8')
(OUT/'calibration.json').write_text(json.dumps({'camera':camera,'width':W,'height':H,'fps':FPS,'duration':60,'pitch':{'width':105,'height':68,'x':0,'y':432,'scaleX':14.63,'scaleY':5.5},'markerFootOffset':29,'ballColor':[250,55,195],'roster':[{'id':r[0],'name':r[1],'role':r[2],'team':r[3],'color':r[4]} for r in roster],'source':'Controlled synthetic fixed-camera video using a generated fictional stadium plate and photographic player sprites; enrolled colour patches and ball patch, not facial recognition.'}),encoding='utf-8')
print('Created 60-second video and separate evaluation truth.')
