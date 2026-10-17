"""Controlled synthetic football video. Ground truth stays outside the web assets.
The browser detector receives only compressed pixels, marker enrollment and pitch calibration.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, math, subprocess, shutil, random, argparse
parser=argparse.ArgumentParser();parser.add_argument("--seed",type=int,default=0);parser.add_argument("--output",default="dist/assets/tracking");parser.add_argument("--truth",default="docs/proof/tracking-ground-truth.json");args=parser.parse_args();rng=random.Random(args.seed)
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/args.output;OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS=960,640,30
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
camera={'center':480,'top':160,'height':410,'farWidth':700,'nearWidth':930}
def px(p):
 x,y=p;return (480+(x/105-.5)*(700+230*y/68),160+410*y/68)
base=Image.new('RGB',(W,H),(13,22,32));d=ImageDraw.Draw(base)
# Stadium bowl, roof ribs and spectators. Decorative pixels stay outside the pitch.
for y in range(25,135):
 shade=int(28+(y-25)*.19);d.line((0,y,W,y),fill=(shade,shade+7,shade+14))
crowd=random.Random(91)
for i in range(5500):
 x=crowd.randrange(W);y=crowd.randrange(45,126);g=crowd.randrange(45,120)
 d.ellipse((x,y,x+2,y+2),fill=(g,g+5,min(255,g+12)))
for x in range(-100,1100,100):d.line((480,-50,x,44),fill=(110,123,136),width=2)
d.rectangle((0,130,960,149),fill=(22,34,49))
try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13);small=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',10);bold=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',17)
except:font=small=bold=ImageFont.load_default()
for x in range(30,960,155):d.text((x,133),'BTR / EVERY ANGLE',font=small,fill=(203,212,226))
for i in range(14):
 x=i*105/14;n=(i+1)*105/14;d.polygon([px((x,0)),px((n,0)),px((n,68)),px((x,68))],fill=(29,103+9*(i%2),63))
line=(181,207,185)
def path(points):d.line([px(p) for p in points],fill=line,width=2)
path([(0,0),(105,0),(105,68),(0,68),(0,0)]);path([(52.5,0),(52.5,68)])
path([(52.5+9.15*math.cos(i*.05),34+9.15*math.sin(i*.05)) for i in range(127)])
for x,sign in [(0,1),(105,-1)]:
 path([(x,13.84),(x+sign*16.5,13.84),(x+sign*16.5,54.16),(x,54.16)])
 path([(x,24.84),(x+sign*5.5,24.84),(x+sign*5.5,43.16),(x,43.16)])
 gx,gy=px((x,34));d.rectangle((gx-7,gy-22,gx+7,gy+22),outline=(216,225,230),width=2)
 for yy in range(int(gy)-20,int(gy)+22,5):d.line((gx-7,yy,gx+7,yy),fill=(133,157,162))
d.rounded_rectangle((24,20,385,62),radius=4,fill=(10,18,29));d.rectangle((24,20,30,62),fill=(236,42,74))
d.text((43,32),'HARBOR  /  NORTHBRIDGE',font=bold,fill=(240,243,248))
d.text((725,30),'BTR  /  TRAINING LIVE',font=font,fill=(227,233,241))
d.text((30,608),'CONTINUOUS SYNTHETIC PLAY  /  FIXED CAMERA  /  ENROLLED KIT MARKERS',font=font,fill=(164,187,197))
truth=[]
ffmpeg=shutil.which('ffmpeg')
if not ffmpeg:raise RuntimeError('ffmpeg required')
proc=subprocess.Popen([ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(OUT/'training-minute.mp4')],stdin=subprocess.PIPE)
for frame in range(60*FPS):
 t=frame/FPS;im=base.copy();d=ImageDraw.Draw(im)
 for pid,name,role,team,color,xy in sorted(roster,key=lambda r:pos(r[0],t)[1]):
  x,y=px(pos(pid,t));stride=math.sin(t*7+pid)*2
  d.ellipse((x-7,y-2,x+11,y+3),fill=(20,63,43))
  # Human silhouettes: boots, shorts, arms, shirt, head and enrolled bib marker.
  d.line((x-3,y-6,x-4-stride,y+1),fill=(219,191,161),width=3);d.line((x+3,y-6,x+4+stride,y+1),fill=(219,191,161),width=3)
  d.ellipse((x-7-stride,y,x-2-stride,y+3),fill=(19,22,28));d.ellipse((x+2+stride,y,x+7+stride,y+3),fill=(19,22,28))
  d.rectangle((x-5,y-11,x+5,y-5),fill=(22,31,43))
  kit=(215,221,231) if team=='harbor' else (38,60,93)
  d.line((x-6,y-17,x-10,y-8+stride),fill=(190,153,123),width=3);d.line((x+6,y-17,x+10,y-8-stride),fill=(190,153,123),width=3)
  d.rounded_rectangle((x-7,y-21,x+7,y-10),radius=3,fill=kit)
  d.ellipse((x-4,y-29,x+4,y-21),fill=(186,143,112));d.arc((x-4,y-30,x+4,y-23),180,360,fill=(38,29,23),width=3)
  d.rectangle((x-4,y-19,x+4,y-12),fill=tuple(color))
  d.text((x+9,y-23),str(pid%100),font=small,fill=(218,232,222))
 bx,by=px(ball(t));d.ellipse((bx-6,by-6,bx+6,by+6),fill=(250,55,195),outline=(255,180,224),width=1)
 d.text((840,65),f'{t:05.1f} / 60.0',font=font,fill=(220,229,237))
 proc.stdin.write(im.tobytes())
 if frame==480:im.save(OUT/'poster.jpg',quality=92)
 if frame%3==0:truth.append({'t':t,'ball':ball(t),'players':{str(r[0]):pos(r[0],t) for r in roster}})
proc.stdin.close()
if proc.wait():raise RuntimeError('encoding failed')
(ROOT/args.truth).write_text(json.dumps({'actions':[{'start':a,'end':b,'from':c,'to':e,'type':f,'speed':math.dist(pos(c,a),pos(e,b) if e else (104.4,34))/(b-a)*3.6} for a,b,c,e,f in actions],'frames':truth}),encoding='utf-8')
(OUT/'calibration.json').write_text(json.dumps({'camera':camera,'width':W,'height':H,'fps':FPS,'duration':60,'pitch':{'width':105,'height':68,'x':42,'y':48,'scaleX':8.34,'scaleY':8.0},'markerFootOffset':15.5,'ballColor':[250,55,195],'roster':[{'id':r[0],'name':r[1],'role':r[2],'team':r[3],'color':r[4]} for r in roster],'source':'Controlled synthetic fixed-camera video; enrolled colour markers, not facial recognition.'}),encoding='utf-8')
print('Created 60-second video and separate evaluation truth.')
