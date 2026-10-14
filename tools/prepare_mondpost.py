"""Prepare owner-provided Imagegen originals. Python 3 + Pillow 12.3.0.
Sources are checksum verified and never modified. No generative retouching.
"""
from pathlib import Path
from PIL import Image, ImageChops, __version__
assert __version__=="12.3.0", "Use Pillow 12.3.0 for byte-identical preparation"
import hashlib, json, math
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'assets/source/mondpost'; OUT=ROOT/'assets/sprites/mondpost'
# Canvas size, usage, center-pivot placement in design units. Pads are intentional.
SPECS={
 'vehicle/rover-chassis.png':((180,48),'vehicle','chassis at body (0,-7), visual only'),
 'vehicle/rover-wheel.png':((52,52),'vehicle','tread circle centered, physical radius 24; both wheel bodies'),
 'vehicle/rover-suspension.png':((24,84),'vehicle','eye centers (12,12) and (12,72); stretch between mounts'),
 'vehicle/astronaut-driver.png':((68,88),'vehicle','body attachment (24,32); behind chassis'),
 'vehicle/cargo-box.png':((72,44),'vehicle','body attachment (-38,33); behind chassis'),
 'world/solar-station.png':((160,148),'world','bottom center at x=3230; decorative background only'),
 'world/moon-rocks.png':((160,80),'world','center, beneath the collision surface'),
 'world/ground-details.png':((192,48),'world','center, beneath the collision surface'),
 'world/finish-flag.png':((128,208),'world','bottom center at existing finish x=3600'),
 'backgrounds/cratered-planet.png':((384,384),'backgrounds','center, far background; never collision'),
 'backgrounds/mountains-far.png':((1000,136),'backgrounds','center; feathered overlapping mirrored cards'),
 'backgrounds/mountains-near.png':((1000,170),'backgrounds','center; feathered overlapping mirrored cards'),
 'backgrounds/star-sparkle.png':((24,28),'world','center; sparse background stars'),
 'effects/moon-dust.png':((64,48),'world','center; bounded eight-sprite particle pool'),
 'ui/pedal-brake.png':((256,104),'ui','center; separate 240x115 touch rectangle'),
 'ui/pedal-gas.png':((256,100),'ui','center; separate 240x115 touch rectangle'),
 'ui/button-pause.png':((64,64),'ui','center; icon in a 140x55 labelled GUI hit rectangle'),
 'ui/button-restart.png':((64,64),'ui','center; icon in a 140x55 labelled GUI hit rectangle'),
}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def clean(im):
 im=im.convert('RGBA'); a=im.getchannel('A')
 # Suppress only near-invisible alpha dust; preserve motif antialiasing.
 im.putalpha(a.point(lambda x:0 if x<8 else x))
 b=a.point(lambda x:255 if x>=16 else 0).getbbox();assert b
 b=(max(0,b[0]-3),max(0,b[1]-3),min(im.width,b[2]+3),min(im.height,b[3]+3))
 return im.crop(b),b
def fit(im,size):
 im=im.convert('RGBa');im.thumbnail((size[0]-4,size[1]-4),Image.Resampling.LANCZOS)
 result=Image.new('RGBA',size);result.paste(im.convert('RGBA'),((size[0]-im.width)//2,(size[1]-im.height)//2))
 return result
records=[]
for entry in json.loads((SRC/'manifest.json').read_text())['assets']:
 rel=entry['path']; path=SRC/rel;assert sha(path)==entry['sha256'],f'Original changed: {rel}'
 size,group,use=SPECS[rel]; original=Image.open(path).convert('RGBA')
 original.putalpha(original.getchannel('A').point(lambda x:0 if x<8 else x)); cropped,bounds=clean(original)
 if rel.endswith('rover-suspension.png'):
  # Original eye centers visually measured on the source inspection grid.
  upper=(280,170);lower=(980,1070);dx=lower[0]-upper[0];dy=lower[1]-upper[1]
  length=math.hypot(dx,dy); along=(dx/length,dy/length); across=(along[1],-along[0]); k=length/60
  # Output y=12/72 maps exactly to the eye centers; source is sampled premultiplied.
  transform=(across[0]*k,along[0]*k,upper[0]-12*k*(across[0]+along[0]),
             across[1]*k,along[1]*k,upper[1]-12*k*(across[1]+along[1]))
  # Supersampled affine then Lanczos downsample avoids aliasing from large sources.
  factor=8; large=original.convert('RGBa').transform((size[0]*factor,size[1]*factor),Image.Transform.AFFINE,
   tuple(v/factor if i in (0,1,3,4) else v for i,v in enumerate(transform)),Image.Resampling.BICUBIC)
  result=large.resize(size,Image.Resampling.LANCZOS).convert('RGBA')
 elif rel.endswith('rover-wheel.png'):
  # Normalize the source's slight ellipse to the circular 48px collider diameter.
  result=Image.new('RGBA',size);result.paste(cropped.convert('RGBa').resize((48,48),Image.Resampling.LANCZOS).convert('RGBA'),(2,2))
 else:result=fit(cropped,size)
 if 'mountains-' in rel:
  alpha=result.getchannel('A'); mask=Image.new('L',size);pixels=mask.load()
  for y in range(size[1]):
   for x in range(size[0]):
    edge=min(1,x/96,(size[0]-1-x)/96);foot=min(1,(size[1]-1-y)/18)
    pixels[x,y]=round(255*max(0,edge)*max(0,foot))
  result.putalpha(ImageChops.multiply(alpha,mask))
 bounds_runtime=result.getchannel('A').point(lambda x:255 if x>=16 else 0).getbbox()
 floor_y=bounds_runtime[3];alpha=result.getchannel('A');mass=0;moment=0
 for y in range(max(bounds_runtime[1],floor_y-12),floor_y):
  for x in range(size[0]):
   v=alpha.getpixel((x,y));mass+=v;moment+=x*v
 floor_x=round(moment/mass,2)
 dest=OUT/rel;dest.parent.mkdir(parents=True,exist_ok=True);result.save(dest)
 records.append({'source':rel,'source_sha256':entry['sha256'],'runtime':str(dest.relative_to(ROOT)),
  'width':size[0],'height':size[1],'crop':bounds,'pivot':[size[0]/2,size[1]/2],'group':group,
  'floor_anchor':[floor_x,floor_y],'use':use,'sha256':sha(dest),'rgba_bytes':size[0]*size[1]*4})
# An authoring inventory, not an estimate of packed texture residency.
(OUT/'manifest.json').write_text(json.dumps({'source_commit':'856acdf','pillow':'12.3.0','assets':records},indent=2)+'\n')
for group in ['vehicle','world','backgrounds','ui']:
 images=[r['runtime'] for r in records if r['group']==group]
 if group=='ui':images.append('assets/ui-panel.png')
 text=''.join('images { image: "/'+p+'" }\n' for p in images)
 text+='margin: 2\nextrude_borders: 2\n'
 (ROOT/'assets'/f'mondpost-{group}.atlas').write_text(text)
lua='-- Generated by tools/prepare_mondpost.py; cosmetic dimensions only.\nreturn {\n'
for a in records:
 name=Path(a['runtime']).stem
 lua+=f"    ['{name}']={{w={a['width']},h={a['height']},floor_x={a['floor_anchor'][0]},floor_y={a['floor_anchor'][1]}}},\n"
(ROOT/'modules/mondpost_assets.lua').write_text(lua+'}\n')
print('Prepared 18 runtime assets; originals preserved; four bounded atlases')
