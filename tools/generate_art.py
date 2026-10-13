"""Original Mondpost-inspired modular artwork. Pillow only; no source image pixels.
Run with Python 3 + Pillow. Supersampling preserves small sprite contours.
"""
from PIL import Image, ImageDraw
from pathlib import Path
import math, random
OUT=Path(__file__).resolve().parents[1]/'assets'
S=4
INK='#10152f'; ORANGE='#f6a044'; CREAM='#fff0d5'; CYAN='#78dce8'
class Art:
 def __init__(self,w,h):
  self.w=w;self.h=h;self.im=Image.new('RGBA',(w*S,h*S));self.d=ImageDraw.Draw(self.im)
 def box(self,xy,fill,outline=None,width=1,r=0):
  xy=tuple(round(x*S) for x in xy)
  if r:self.d.rounded_rectangle(xy,r*S,fill,outline,width*S)
  else:self.d.rectangle(xy,fill,outline,width*S)
 def poly(self,pts,fill,outline=None,width=1):
  p=[(round(x*S),round(y*S)) for x,y in pts];self.d.polygon(p,fill)
  if outline:self.d.line(p+[p[0]],outline,width*S,joint='curve')
 def line(self,p,fill,width=1):self.d.line([(round(x*S),round(y*S)) for x,y in p],fill,width*S,joint='curve')
 def oval(self,xy,fill,outline=None,width=1):self.d.ellipse(tuple(round(x*S) for x in xy),fill,outline,width*S)
 def save(self,name):self.im.resize((self.w,self.h),Image.Resampling.LANCZOS).save(OUT/(name+'.png'))
a=Art(180,110)
# dark undercarriage and distinct cream/orange body
for x in (33,147):
 a.oval((x-28,67,x+28,114),'#242a42',INK,2)
 a.oval((x-23,72,x+23,118),None,'#777f98',2)
a.poly([(12,74),(22,65),(148,64),(169,71),(173,82),(157,89),(135,89),(125,97),(65,97),(55,89),(16,88)],ORANGE,INK,3)
a.poly([(62,74),(138,71),(130,90),(119,96),(72,94)],CREAM,INK,2)
a.line([(19,76),(54,75)],'#ffda89',3);a.line([(70,77),(124,75)],'#fffaf0',2)
a.box((92,78,107,81),'#778199',INK,r=1)
a.poly([(67,96),(125,96),(129,100),(64,100)],'#444a60',INK,2)
a.box((162,69,172,82),CYAN,INK,2,r=4);a.line([(168,72),(168,78)],'#e3ffff',2)
# closed parcel, side seam and cube symbol
for xy,c in [((9,24,76,69),ORANGE),((68,25,80,69),'#d97c2d')]:a.box(xy,c,INK,2,r=6)
a.line([(18,29),(62,27),(68,31)],'#ffe0a0',2);a.line([(69,28),(69,65)],CREAM,3)
a.poly([(30,40),(42,34),(55,40),(43,47)],'#fff9e9')
a.poly([(30,43),(40,49),(40,60),(30,54)],CREAM)
a.poly([(44,49),(55,43),(55,54),(44,61)],'#fff9e9')
# astronaut seat, suit, rounded helmet and shiny blue visor
a.box((86,42,107,68),'#42495f',INK,2,r=5)
a.poly([(100,51),(120,49),(133,61),(134,70),(94,70)],CREAM,INK,2)
a.oval((94,13,142,59),CREAM,INK,2)
a.oval((104,21,141,54),'#284d75',INK,2)
a.oval((115,25,136,50),'#377e9a')
a.oval((128,27,134,39),CYAN);a.oval((117,25,126,29),'#eaffff')
a.oval((97,36,104,44),ORANGE,INK,1)
a.line([(101,60),(111,68),(126,63)],'#b6b2bc',3)
a.oval((123,58,135,66),CREAM,INK,1)
a.line([(132,57),(139,64)],INK,2)
for x in (19,58,141):a.oval((x,79,x+3,82),'#dee0e8',INK)
a.save('rover')
a=Art(52,52)
a.oval((2,2,50,50),'#23283e',INK,2)
for i in range(20):
 t=i*math.tau/20
 pts=[]
 for r,dt in [(22,-.10),(25,-.08),(25,.09),(22,.12)]:pts.append((26+r*math.cos(t+dt),26+r*math.sin(t+dt)))
 a.poly(pts,'#3b4056',INK,1)
a.oval((8,8,44,44),'#30384c','#647087',1)
a.oval((13,13,39,39),ORANGE,INK,2)
a.oval((18,18,34,34),'#d7792a',INK,1);a.oval((20,19,32,31),'#ffb952')
a.line([(17,18),(22,15),(29,15)],'#ffda97',1)
a.save('wheel')
a=Art(14,64)
a.box((4,2,10,62),'#475269',INK,1,r=2)
a.box((5,5,8,58),'#b9c3d4')
for y in range(8,57,8):
 a.line([(2,y),(12,y+4),(2,y+8)],INK,4);a.line([(2,y),(12,y+4),(2,y+8)],'#eee9dc',2)
for y in (3,61):a.oval((2,y-3,12,y+3),ORANGE,INK,1)
a.save('spring')
# tactile UI plate assets; independent backgrounds, labels remain Defold text
for name,fill,hi in [('pedal-gas',ORANGE,'#ffd083'),('pedal-brake','#9999c3','#d0ccec')]:
 a=Art(240,115)
 a.box((3,9,237,114),'#252542',INK,3,r=25)
 a.box((4,2,236,106),fill,INK,3,r=24)
 a.box((9,7,231,100),None,hi,2,r=20)
 for x in (40,80,120,160,200):
  a.oval((x-6,18,x+6,30),'#5b4b54' if name.endswith('gas') else '#464965',hi,1)
 a.save(name)
a=Art(140,55);a.box((1,1,139,54),'#171e39','#777aa9',2,r=10);a.line([(12,5),(127,5)],'#444969',1);a.save('ui-panel')
# large cratered moon, transparent and softly shaded, original seeded texture
rng=random.Random(2401);a=Art(320,320)
a.oval((4,4,316,316),'#6864a4','#9692c5',1)
for i in range(115):
 x=rng.uniform(18,300);y=rng.uniform(15,300);r=rng.uniform(3,20)
 if math.hypot(x-160,y-160)+r<151:
  a.oval((x-r,y-r,x+r,y+r),'#5b5992');a.oval((x-r,y-r+3,x+r,y+r+3),'#7470ad');a.oval((x-r*.75,y-r*.65,x+r*.7,y+r*.55),'#605d99')
# darkening toward lower left, retaining circular silhouette
shade=Image.new('RGBA',a.im.size);pix=shade.load()
for y in range(320*S):
 for x in range(320*S):
  xx=x/S;yy=y/S
  if math.hypot(xx-160,yy-160)<156:pix[x,y]=(16,21,47,int(max(0,min(.72,(yy/320)*.63+(1-xx/320)*.24))*255))
a.im=Image.alpha_composite(a.im,shade);a.save('moon')
# seamless 512-wide angular mountain strata, noncolliding background
for name,base,light,dark,seed in [('ridge-far','#343559','#484478','#292d4b',2),('ridge-near','#4b487a','#59527f','#444068',5)]:
 rng=random.Random(seed);a=Art(512,200)
 peaks=[(0,140),(36,128),(65,112),(81,96),(97,110),(112,118),(153,132),(182,104),(207,78),(228,101),(253,119),(282,135),(315,110),(339,88),(355,107),(374,118),(423,135),(450,121),(467,112),(491,126),(512,140)]
 a.poly(peaks+[(512,200),(0,200)],base)
 for i in (3,8,13,18):
  x,y=peaks[i]
  a.poly([(x,y),(x-14,y+18),(x-28,y+50),(x+6,y+32),(x+30,y+64)],light)
  a.poly([(x,y),(x+18,y+22),(x+50,y+68),(x+14,y+49),(x+6,y+32)],dark)
 a.save(name)
# ground material, limited texture with no bright edges (continuous edges drawn separately)
a=Art(128,128);a.box((0,0,128,128),'#69608d');rng=random.Random(9)
for i in range(28):
 x=rng.randrange(128);y=rng.randrange(128);r=rng.choice([1,2,3]);a.oval((x-r,y-r,x+r,y+r),'#746b98' if i%3 else '#60587f')
a.save('soil')
a=Art(42,24);a.poly([(2,21),(7,9),(18,2),(29,8),(39,22)],'#494564',INK,1);a.poly([(7,9),(18,2),(16,17),(2,21)],'#79719c');a.poly([(18,2),(29,8),(24,15),(16,17)],'#615a84');a.save('rock')
print('Generated original modular artwork in assets/')

# Closed render mesh derives from the canonical track; never changes colliders.
import re, json
track=(OUT.parent/'modules/terrain.lua').read_text().split('M.points=',1)[1].split('M.finish=',1)[0]
points=[tuple(map(int,p)) for p in re.findall(r'\{(-?\d+),(\d+)\}',track)]
positions=[];uv=[]
for a,b in zip(points,points[1:]):
 for x,y in [a,(a[0],-800),b,b,(a[0],-800),(b[0],-800)]:
  positions.extend([x,y,-.2]);uv.extend([x/128,y/128])
(OUT/'terrain.buffer').write_text(json.dumps([{'name':'position','type':'float32','count':3,'data':positions},{'name':'texcoord0','type':'float32','count':2,'data':uv}],indent=2)+'\n')
