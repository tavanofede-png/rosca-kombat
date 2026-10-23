"""Validate real ROM portrait colors, all fighter poses and the OAM line budget."""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools/python-packages'))
from pyboy import PyBoy
import numpy as np
from PIL import Image, ImageDraw

art = json.loads((ROOT/'assets/portraits/cgb-art.json').read_text())
symbols = {n:int(a,16) for n,a in re.findall(r'DEF (\S+) (0x[\da-fA-F]+)',(ROOT/'build/rosca-kombat.noi').read_text())}
game = PyBoy(str(ROOT/'build/rosca-kombat.gbc'),window='null',sound_emulated=False,cgb=True)
game.set_emulation_speed(0)
checks = []

def write(name,value,offset=0):
    game.memory[symbols['_'+name]+offset]=value&255

def word(name,value,offset=0):
    write(name,value,offset);write(name,value>>8,offset+1)

def press(key):
    game.button_press(key);game.tick(6);game.button_release(key);game.tick(35)

def colors(values):
    # CGB stores 5 bits per channel; PyBoy exposes the hardware value shifted 3.
    return np.array([[round(v*31/255)*8 for v in bytes.fromhex(c[1:])] for c in values])

def compare(actual,expected,mask,label):
    error=np.abs(actual.astype(int)-expected.astype(int))[mask].max()
    if error>7:
        game.screen.image.resize((640,576),Image.Resampling.NEAREST).save(ROOT/'build/graphics-failure.png')
        ys,xs=np.where((np.abs(actual.astype(int)-expected.astype(int)).max(axis=2)>7)&mask)
        print('Mismatch bounds',int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max()),'count',len(xs),'state',game.memory[symbols['_state']])
        print('Fighters',list(game.memory[symbols['_fighters']:symbols['_fighters']+32]))
    assert error<=7, f'{label}: color error {error}'
    checks.append(label)

try:
    game.tick(180);press('a')
    for i,c in enumerate(art):
        p=c['portrait'];pal=colors(p['palettes']).reshape(7,4,3)
        expected=np.zeros((80,64,3),dtype=np.uint8);pixels=np.array(p['pixels'])
        for k,a in enumerate(p['attributes']):
            y,x=k//8*8,k%8*8
            expected[y:y+8,x:x+8]=pal[a-1][pixels[y:y+8,x:x+8]]
        actual=np.asarray(game.screen.image.convert('RGB'))[16:96,96:160]
        compare(actual,expected,np.ones((80,64),dtype=bool),f'{c["name"]}: portrait tiles and colors')
        press('down')
    press('a');press('a');press('a');game.tick(180)
    gallery=Image.new('RGB',(8*144,4*224),'#111a35');draw=ImageDraw.Draw(gallery)
    for i,c in enumerate(art):
        write('hero',i);write('rival',i);write('state',5)
        press('start');press('start')
        write('state',7);word('state_timer',5000);write('winner',0);write('message_ticks',1)
        game.tick(10)  # Drain the last combat update before placing the fighters.
        for slot in range(2):
            word('fighters',(24 if slot==0 else 112)*16,slot*16)
            word('fighters',77*16,slot*16+2)
            write('fighters',0,slot*16+13);write('shots',0,slot*11+6)
        palette=colors(c['fighter']['palettes']).reshape(3,4,3)
        for pose in range(6):
            indices=np.array(c['fighter']['frames'][pose])
            expected=np.zeros((64,32,3),dtype=np.uint8)
            for y in range(64):expected[y]=palette[min(y//16,2)][indices[y]]
            for facing in range(2):
                for slot in range(2):
                    write('fighters',pose,slot*16+10);write('fighters',facing^slot,slot*16+11)
                game.tick(6)
                screen=np.asarray(game.screen.image.convert('RGB'))
                top=61+(7 if pose==4 else 0)
                for slot in range(2):
                    left=20 if slot==0 else 108
                    flip=facing^slot
                    compare(screen[top:top+64,left:left+32],expected[:,::-1] if flip else expected,
                            (indices[:,::-1] if flip else indices)>0,
                            f'{c["name"]}: pose {pose}, player {slot}, facing {flip}')
                if pose==0 and facing==0:
                    x,y=i%8*144,i//8*224
                    gallery.paste(game.screen.image.crop((20,61,52,125)).resize((96,192),Image.Resampling.NEAREST),(x+24,y+4))
                    draw.text((x+4,y+204),c['name'],fill='#f5e3bc')
        print(f'Checked {i+1}/32 {c["name"]}',flush=True)
    gallery.save(ROOT/'build/fighters-in-rom.png')
    # Put two projectiles across both enlarged heads: even this worst case
    # must obey the CGB maximum of ten 8x16 sprites on a scanline.
    for active in [(1,0),(0,1),(1,1)]:
        for slot in range(2):
            write('fighters',0,slot*16+10)
            write('shots',active[slot],slot*11+6)
            word('shots',(60+slot*18)*16,slot*11)
            word('shots',62*16,slot*11+2)
        game.tick(6)
        counts=[sum(0<game.memory[0xfe00+4*k+1]<168 and
                    game.memory[0xfe00+4*k]-16<=y<game.memory[0xfe00+4*k]
                    for k in range(40)) for y in range(144)]
        assert max(counts)<=10,f'OAM overflow with shots {active}: {max(counts)}'
        checks.append(f'OAM scanline limit with shots {active}')
    (ROOT/'build/likeness-check.json').write_text(json.dumps({
        'rom_sha256':hashlib.sha256((ROOT/'build/rosca-kombat.gbc').read_bytes()).hexdigest(),
        'passed':len(checks),'checks':checks},indent=2))
    print(f'PASS: {len(checks)} native graphics checks')
finally:
    game.stop(save=False)
