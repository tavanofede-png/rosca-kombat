"""Capture actual ROM portraits, arena shots and all six fighter poses for visual QA."""
import sys
import re
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools/python-packages'))
from pyboy import PyBoy
from PIL import Image,ImageDraw
symbols={n:int(a,16) for n,a in re.findall(r'DEF (\S+) (0x[\da-fA-F]+)',(ROOT/'build/rosca-kombat.noi').read_text())}
data=json.loads((ROOT/'build/art-review.json').read_text())
game=PyBoy(str(ROOT/'build/rosca-kombat.gbc'),window='null',sound_emulated=False,cgb=True)
game.set_emulation_speed(0)
def r(n,o=0):return game.memory[symbols['_'+n]+o]
def w(n,v,o=0):game.memory[symbols['_'+n]+o]=v&255
def f(i,n,v):
    off=i*16+{'x':0,'y':2,'hp':6,'pose':10}[n]
    w('fighters',v,off)
    if n in ('x','y'):w('fighters',v>>8,off+1)
def press(k):
    game.button_press(k);game.tick(6);game.button_release(k);game.tick(35)
def snap(name):
    game.screen.image.resize((640,576),Image.Resampling.NEAREST).save(ROOT/f'build/{name}.png')
try:
    game.tick(180);press('a')
    gallery=Image.new('RGB',(8*160,4*196),'#111a35')
    dr=ImageDraw.Draw(gallery)
    for i in range(32):
        assert r('menu_index')==i
        face=game.screen.image.crop((96,16,160,96)).resize((128,160),Image.Resampling.NEAREST)
        x=i%8*160;y=i//8*196
        gallery.paste(face,(x+16,y+6));dr.text((x+5,y+178),data['characters'][i]['name'],fill='#f5e3bc')
        if i in (0,1,3,4,5,6,7,10,14,17,22,24):snap(f'portrait-{i+1}')
        press('down')
    gallery.save(ROOT/'build/roster-gallery.png')
    press('a');press('a');press('a');game.tick(180)
    stages=Image.new('RGB',(1280,1152),'#111a35')
    pairs=[(0,5),(1,2),(4,8),(6,7)]
    for stage,(hero,rival) in enumerate(pairs):
        w('hero',hero);w('rival',rival);w('arena',stage);w('state',5)
        press('start');press('start')
        w('state',7);w('winner',0);w('loser',1);w('state_timer',255);w('message_ticks',1)
        f(0,'x',22*16);f(1,'x',112*16);f(0,'y',77*16);f(1,'y',77*16);f(0,'pose',0);f(1,'pose',0)
        game.tick(8)
        snap(f'arena-redesign-{stage+1}')
        stages.paste(game.screen.image.resize((640,576),Image.Resampling.NEAREST),((stage%2)*640,(stage//2)*576))
    stages.save(ROOT/'build/arenas-gallery.png')
    poses=Image.new('RGB',(6*160,144),'#111a35')
    for pose in range(6):
        f(0,'pose',pose);game.tick(4)
        poses.paste(game.screen.image,(pose*160,0))
    poses.resize((1920,288),Image.Resampling.NEAREST).save(ROOT/'build/poses-review.png')
finally:
    game.stop(save=False)
