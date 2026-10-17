"""Controlled synthetic football video. Ground truth stays outside the web assets.
The browser detector receives only compressed pixels, marker enrollment and pitch calibration.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, math, subprocess, shutil, random
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist/assets/tracking';OUT.mkdir(parents=True,exist_ok=True)
W,H,FPS=960,640,30
roster=[(6,'Amir Cole','Holding midfielder','harbor',[255,200,40],(27,38)),(8,'Mateo Silva','Central midfielder','harbor',[40,230,235],(49,29)),(10,'Rafael Costa','Attacking midfielder','harbor',[180,95,245],(67,39)),(7,'Luca Moreau','Left winger','harbor',[255,125,35],(73,15)),(9,'Theo Brooks','Striker','harbor',[125,245,55],(84,32)),(102,'Jules Laurent','Right back','north',[70,110,255],(77,22)),(104,'Alex Ross','Centre back','north',[245,60,75],(85,40)),(101,'Max Berg','Goalkeeper','north',[35,245,135],(100,34))]
actions=[(4,5.6,6,8,'pass'),(12,13.4,8,10,'pass'),(20,21.7,10,7,'pass'),(28,29.0,7,9,'pass'),(36,36.65,9,None,'shot'),(44,45.6,6,8,'pass'),(52,53.2,8,10,'pass'),(57,58.5,10,None,'shot')]
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
def px(p):return (42+p[0]*8.34,48+p[1]*8.0)
base=Image.new('RGB',(W,H),(11,20,28));d=ImageDraw.Draw(base)
for i in range(14):d.rectangle((42+i*62.55,48,42+(i+1)*62.55,592),fill=(28,91+7*(i%2),61))
line=(160,194,167)
d.rectangle((42,48,918,592),outline=line,width=2);d.line((480,48,480,592),fill=line,width=2)
d.ellipse((404,247,556,393),outline=line,width=2)
for x,sign in [(42,1),(918,-1)]:
 d.rectangle((min(x,x+sign*138),159,max(x,x+sign*138),481),outline=line,width=2)
 d.rectangle((min(x,x+sign*46),247,max(x,x+sign*46),393),outline=line,width=2)
 d.rectangle((x-8,290,x+8,350),outline=(190,205,210),width=2)
try:font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13);small=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',10)
except:font=small=ImageFont.load_default()
d.text((42,14),'BTR   /   SYNTHETIC TRAINING CAPTURE',font=font,fill=(219,229,237))
d.text((42,609),'FIXED CAMERA   •   105 × 68 m   •   FICTIONAL PLAYERS   •   COLOUR-MARKER ID',font=font,fill=(164,187,197))
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
 d.text((840,14),f'{t:05.1f} / 60.0',font=font,fill=(220,229,237))
 proc.stdin.write(im.tobytes())
 if frame==480:im.save(OUT/'poster.jpg',quality=92)
 if frame%3==0:truth.append({'t':t,'ball':ball(t),'players':{str(r[0]):pos(r[0],t) for r in roster}})
proc.stdin.close()
if proc.wait():raise RuntimeError('encoding failed')
(ROOT/'docs/proof/tracking-ground-truth.json').write_text(json.dumps({'actions':[{'start':a,'end':b,'from':c,'to':e,'type':f,'speed':math.dist(pos(c,a),pos(e,b) if e else (104.4,34))/(b-a)*3.6} for a,b,c,e,f in actions],'frames':truth}),encoding='utf-8')
(OUT/'calibration.json').write_text(json.dumps({'width':W,'height':H,'fps':FPS,'duration':60,'pitch':{'width':105,'height':68,'x':42,'y':48,'scaleX':8.34,'scaleY':8.0},'markerFootOffset':15.5,'ballColor':[250,55,195],'roster':[{'id':r[0],'name':r[1],'role':r[2],'team':r[3],'color':r[4]} for r in roster],'source':'Controlled synthetic fixed-camera video; enrolled colour markers, not facial recognition.'}),encoding='utf-8')
print('Created 60-second video and separate evaluation truth.')
