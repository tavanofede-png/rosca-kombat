"""Playtests of the compiled ROM, with scenarios placed through debug symbols."""
import json
import pathlib
import re
import sys
import hashlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools/python-packages'))
from pyboy import PyBoy
from PIL import Image

symbols = {n: int(a, 16) for n, a in re.findall(r'DEF (\S+) (0x[\da-fA-F]+)', (ROOT/'build/rosca-kombat.noi').read_text())}
game = PyBoy(str(ROOT/'build/rosca-kombat.gbc'), window='null', sound_emulated=True, cgb=True)
game.set_emulation_speed(0)
checks = []

def read(name, off=0):
    return game.memory[symbols['_'+name]+off]

def write(name, val, off=0):
    game.memory[symbols['_'+name]+off] = val & 255

def word(name, val=None, off=0):
    if val is not None:
        write(name, val, off)
        write(name, val >> 8, off+1)
    return read(name, off) | (read(name, off+1) << 8)

def f(i, field, val=None):
    fields = {'x':0,'y':2,'vy':4,'hp':6,'meter':7,'action':8,'ticks':9,'pose':10,'face':11,'cooldown':12,'invuln':13,'blocking':14}
    off = i*16+fields[field]
    if field in ('x','y','vy'):
        return word('fighters', val, off)
    if val is not None:
        write('fighters', val, off)
    return read('fighters', off)

def press(key, hold=6, settle=20):
    game.button_press(key)
    game.tick(hold)
    game.button_release(key)
    game.tick(settle)

def check(value, text):
    if not value:
        raise AssertionError(f'{text}; state={read("state")} meter={f(0,"meter")} action={f(0,"action")} ticks={f(0,"ticks")} keys={read("keys")} previous={read("previous")}')
    checks.append(text)

def snap(name):
    game.screen.image.save(ROOT/f'build/{name}.png')
    game.screen.image.resize((640,576), Image.Resampling.NEAREST).save(ROOT/f'build/{name}-preview.png')

def isolate(x=52, other=80):
    # PyBoy tick ends at an LCD frame, which can be mid-instruction in combat.
    # Drain that update in pause before writing a deterministic scenario.
    write('state',10)
    game.tick(8)
    write('ai_wait',250)
    write('seconds_left',60)
    write('subsecond',0)
    write('previous',0)
    for i in range(2):
        f(i,'x',(x if i==0 else other)*16)
        f(i,'y',77*16)
        f(i,'vy',0)
        f(i,'hp',100)
        f(i,'meter',100)
        f(i,'ticks',0)
        f(i,'action',0)
        f(i,'cooldown',0)
        f(i,'invuln',0)
        f(i,'face',i)
        f(i,'blocking',0)
        write('shots',0,i*11+6)
    write('state',5)

try:
    game.tick(180)
    check(read('state')==0,'ROM boots to title')
    snap('title')
    press('select')
    check(read('state')==11,'Control guide opens')
    press('b',settle=45)
    press('a',settle=20)
    check(read('state')==1,'Character selector opens')
    press('up',settle=20)
    check(read('menu_index')==31,'Roster wraps to character 32')
    press('down',settle=20)
    portrait_hashes=set()
    for i in range(32):
        check(read('menu_index')==i,f'Character {i+1} selectable')
        # Each portrait loads its own native tiles and seven BG palettes.
        portrait_hashes.add(hashlib.sha256(game.screen.image.crop((96,16,160,96)).tobytes()).hexdigest())
        press('down',settle=20)
    check(len(portrait_hashes)==32,'All 32 native 64x80 portraits are distinct across eight ROM banks')
    snap('selector')
    press('right',settle=20)
    check(read('menu_index')==4,'Selector pages by four')
    press('left',settle=20)
    press('a',settle=20)
    check(read('state')==2 and read('hero')==0,'Player character chosen')
    press('a',settle=20)
    check(read('state')==3 and read('rival')==5,'Rival chosen')
    press('right')
    check(read('difficulty')==2,'Hard difficulty selectable')
    press('left')
    check(read('difficulty')==1,'Normal difficulty selectable')
    press('left')
    check(read('difficulty')==0,'Easy difficulty selectable')
    press('right')
    for i in range(4):
        press('down')
    check(read('arena')==0,'Four stages selectable with wrap')
    snap('setup')
    press('a',settle=150)
    check(read('state')==5,'Fight starts after round intro')
    snap('fight')

    isolate(28,115)
    old=f(0,'x')
    press('right',hold=18)
    check(f(0,'x')>old,'Walking moves the fighter')
    press('up',hold=3,settle=3)
    check(f(0,'y')<77*16,'Jump leaves the ground')
    game.tick(80)
    check(f(0,'y')==77*16,'Jump lands back on stage')

    isolate(52,77)
    press('a',hold=2,settle=30)
    check(f(1,'hp')<100,'Punch connects and damages opponent')
    isolate(52,85)
    press('b',hold=2,settle=35)
    check(f(1,'hp')==89,'Kick has greater reach and deals 11 damage')

    isolate(52,77)
    f(0,'blocking',1)
    f(0,'action',5)
    # A real CPU punch already in its windup; the player holds block.
    f(1,'action',1)
    f(1,'ticks',14)
    before=read('block_count')
    game.button_press('down')
    game.tick(12)
    game.button_release('down')
    check(f(0,'hp')==100 and read('block_count')>before,'Holding down blocks a normal hit')

    isolate(22,100)
    before=read('special_count')
    press('select',hold=8,settle=4)
    check(read('special_count')==before+1 and f(0,'meter')==65,'Special spends 35 meter')
    check(read('shots',6)==1,'Special creates a projectile')
    game.tick(80)
    check(f(1,'hp')<100,'Projectile travels and damages opponent')
    isolate(22,100)
    f(0,'meter',20)
    before=read('special_count')
    press('select')
    check(read('special_count')==before and f(0,'meter')==20,'Special cannot be used without meter')
    isolate(22,100)
    game.button_press('down')
    press('b',hold=8,settle=4)
    game.button_release('down')
    check(f(0,'meter')==65,'Down+B also triggers special')

    isolate(22,100)
    before=read('super_count')
    game.button_press('a')
    game.button_press('b')
    game.tick(8)
    game.button_release('a')
    game.button_release('b')
    check(read('super_count')==before+1 and f(0,'meter')==0,'A+B consumes full meter for a super')

    isolate()
    press('start')
    check(read('state')==10,'Start pauses fight')
    old=word('frame')
    clock=read('seconds_left')
    position=f(0,'x')
    game.tick(120)
    check(read('seconds_left')==clock and f(0,'x')==position,'Pause freezes timer and movement')
    press('select')
    check(read('music_on')==0,'Music toggle works in pause')
    press('start')
    check(read('state')==5,'Start resumes fight')

    # CPU must approach and attack without player input.
    isolate(22,115)
    write('ai_wait',0)
    old=f(1,'x')
    game.tick(60)
    check(f(1,'x')<old,'CPU approaches the player')
    game.tick(240)
    check(f(0,'hp')<100,'CPU attacks and damages the player')

    isolate()
    write('wins',0,0)
    write('wins',0,1)
    write('seconds_left',0)
    f(1,'hp',40)
    game.tick(4)
    check(read('state')==6 and read('wins')==1,'Time limit awards round to higher health')
    game.tick(250)
    check(read('state')==5 and read('round_no')==2,'Next round starts with restored health')

    isolate()
    f(0,'hp',0)
    f(1,'hp',0)
    write('wins',0)
    game.tick(4)
    check(read('winner')==2 and read('wins')==0,'Double KO awards no round')

    isolate()
    write('wins',1)
    write('wins',0,1)
    f(1,'hp',0)
    game.tick(4)
    check(read('state')==7 and read('wins')==2,'Second KO opens finisher window')
    snap('remate')
    press('select')
    check(read('state')==8 and read('finisher_done')==1,'Player can trigger comic finisher')
    game.tick(85)
    snap('roscality')
    game.tick(160)
    check(read('state')==9,'Finisher reaches match result')
    snap('result')
    press('a',settle=150)
    check(read('state')==5 and read('wins')==0 and read('wins',1)==0,'Rematch resets match score')

    # Every stage and every special archetype boots in a genuine match.
    for stage in range(4):
        isolate()
        write('arena',stage)
        press('start')
        press('start')
        game.tick(15)
        check(read('state')==5,f'Stage {stage+1} renders and resumes')
        snap(f'stage-{stage+1}')
    for char in (4,7,8,2,6,28,29,31):
        write('hero',char)
        isolate(22,100)
        press('start')
        press('start')
        f(0,'hp',55)
        before=read('special_count')
        press('select',hold=8,settle=4)
        check(read('special_count')==before+1,f'Character {char+1} special executes')
        if char in (4,31):
            check(f(0,'hp')==68,'Healing special restores 13 HP')
        game.tick(80)
        if char not in (4,31,7,28):
            check(f(1,'hp')<100,f'Character {char+1} special can hit')

    isolate()
    write('game_mode',1)
    write('ladder',0)
    write('state',9)
    write('winner',0)
    press('a',settle=150)
    check(read('ladder')==1 and read('rival')==6,'Tournament advances to the next rival')
    write('state',9)
    write('winner',0)
    write('ladder',7)
    press('a',settle=150)
    check(read('ladder')==0,'Completed tournament can restart')

    report={'passed':len(checks),'rom_sha256':hashlib.sha256((ROOT/'build/rosca-kombat.gbc').read_bytes()).hexdigest(),'checks':checks}
    (ROOT/'build/playtest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(report,ensure_ascii=False))
finally:
    game.stop(save=False)

