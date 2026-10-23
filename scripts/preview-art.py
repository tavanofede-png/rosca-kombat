"""Render the authored tile art for inspection before looking at the ROM."""
import json
from pathlib import Path
from PIL import Image, ImageDraw
root=Path(__file__).resolve().parent.parent
data=json.loads((root/'build/art-review.json').read_text())
board=Image.new('RGB',(8*144,4*224),'#111a35')
draw=ImageDraw.Draw(board)
for n,c in enumerate(data['characters']):
    image=Image.new('RGB',(32,64),'#111a35')
    for y in range(64):
        for x in range(32):
            pal=min(y//16,2)*4
            image.putpixel((x,y),tuple(bytes.fromhex(c['palettes'][pal+c['pixels'][y][x]][1:])))
    xx=n%8*144
    yy=n//8*224
    board.paste(image.resize((96,192),Image.Resampling.NEAREST),(xx+24,yy+8))
    draw.text((xx+5,yy+205),c['name'],fill='#f4e3bc')
board.save(root/'build/characters-review.png')
