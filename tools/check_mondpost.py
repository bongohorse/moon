"""CI inventory, byte integrity and PNG checks using only Python's standard library."""
from pathlib import Path
import hashlib,json,re,struct,zlib
ROOT=Path(__file__).resolve().parents[1]
def verify_png(path,expected=None):
 data=path.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n',path
 pos=8; dimensions=None
 while pos<len(data):
  size=struct.unpack('>I',data[pos:pos+4])[0];kind=data[pos+4:pos+8];chunk=data[pos+8:pos+8+size]
  crc=struct.unpack('>I',data[pos+8+size:pos+12+size])[0]
  assert zlib.crc32(kind+chunk)&0xffffffff==crc,f'PNG CRC: {path}'
  if kind==b'IHDR':
   w,h,bits,color,*_=struct.unpack('>IIBBBBB',chunk);assert bits==8 and color==6,f'Expected RGBA: {path}'
   dimensions=(w,h)
  pos+=12+size
  if kind==b'IEND':break
 assert pos==len(data) and dimensions,path
 if expected:assert dimensions==expected,f'Dimensions: {path}'
 return hashlib.sha256(data).hexdigest()
sources=json.loads((ROOT/'assets/source/mondpost/manifest.json').read_text())['assets']
runtime=json.loads((ROOT/'assets/sprites/mondpost/manifest.json').read_text())['assets']
assert len(sources)==len(runtime)==18
by_source={a['path']:a for a in sources};assert set(by_source)=={a['source'] for a in runtime}
for a in sources:
 assert verify_png(ROOT/'assets/source/mondpost'/a['path'],(a['width'],a['height']))==a['sha256']
for a in runtime:
 assert a['source_sha256']==by_source[a['source']]['sha256']
 assert verify_png(ROOT/a['runtime'],(a['width'],a['height']))==a['sha256']
 assert max(a['width'],a['height'])<=1000
 assert a['pivot']==[a['width']/2,a['height']/2]
for group in ('vehicle','world','backgrounds','ui'):
 atlas=(ROOT/'assets'/f'mondpost-{group}.atlas').read_text()
 expected={a['runtime'] for a in runtime if a['group']==group}
 if group=='ui':expected.add('assets/ui-panel.png')
 assert set(re.findall(r'image: "/([^"]+)"',atlas))==expected
 assert 'max_page_' not in atlas,'Default sprite/GUI materials require ordinary 2D atlas textures'
print('18 originals and runtime PNGs verified; RGBA, dimensions, checksums and four atlas inventories passed')
