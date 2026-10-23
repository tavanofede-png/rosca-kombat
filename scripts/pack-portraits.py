"""Compile source portrait atlases into native CGB tiles and animated fighters.

This is an asset conversion step, not an emulator filter. The checked-in JSON
is consumed by the ordinary Node build, so Pillow/NumPy are only needed when
repacking art. Every portrait tile uses one of seven four-color CGB palettes.
Each combat sprite row uses three opaque colors plus transparent index zero.
"""
import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'assets/portraits'
BG = (16, 24, 49)
WIDTH, HEIGHT = 64, 80


def cgb(colors):
    return np.rint(np.rint(np.asarray(colors, dtype=float) / 255 * 31) * 255 / 31).astype(np.uint8)


def hexes(colors):
    return ['#' + ''.join(f'{int(v):02x}' for v in p) for p in colors]


def palette_for(pixels, count=4):
    pixels = np.asarray(pixels, dtype=np.uint8).reshape(-1, 3)
    im = Image.fromarray(pixels.reshape(1, len(pixels), 3))
    q = im.quantize(colors=count, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    colors = np.array(q.getpalette()[:count * 3]).reshape(-1, 3)
    if len(colors) < count:
        colors = np.vstack([colors, np.tile(colors[-1],(count-len(colors),1))])
    colors = cgb(colors)
    return colors[np.argsort(colors @ np.array([.2126, .7152, .0722]))]


def nearest(pixels, palette):
    # Weight luminance and red skin structure; avoid dithering on a small LCD.
    delta = pixels.astype(float)[..., None, :] - palette.astype(float)
    distance = np.sum(delta * delta * np.array([.30, .52, .18]), axis=-1)
    return np.argmin(distance, axis=-1), np.min(distance, axis=-1)


def portrait_pack(im):
    rgb = np.asarray(im.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS))
    tiles = np.array([rgb[y:y+8, x:x+8].reshape(64, 3)
                      for y in range(0, HEIGHT, 8) for x in range(0, WIDTH, 8)])
    candidates = [palette_for(t) for t in tiles]
    candidate_errors = np.array([nearest(tiles, p)[1].sum(axis=1) for p in candidates])
    best = None
    # Several deterministic seeds prevent a large skin region consuming every palette.
    for seed in [int(np.argmin(candidate_errors.sum(axis=1))), 0, 27, 55]:
        selected = [seed]
        errors = candidate_errors[seed].copy()
        for _ in range(6):
            gain = np.maximum(0, errors[None, :] - candidate_errors).sum(axis=1)
            gain[selected] = -1
            pick = int(np.argmax(gain))
            selected.append(pick)
            errors = np.minimum(errors, candidate_errors[pick])
        palettes = np.array([candidates[k] for k in selected])
        for _ in range(5):
            costs = np.array([nearest(tiles, p)[1].sum(axis=1) for p in palettes])
            assignment = np.argmin(costs, axis=0)
            for k in range(7):
                use = tiles[assignment == k]
                if len(use):
                    candidate = palette_for(use)
                    old = nearest(use, palettes[k])[1].sum()
                    new = nearest(use, candidate)[1].sum()
                    if new < old:
                        palettes[k] = candidate
        costs = np.array([nearest(tiles, p)[1].sum(axis=1) for p in palettes])
        assignment = np.argmin(costs, axis=0)
        score = costs[assignment, np.arange(len(tiles))].sum()
        if best is None or score < best[0]:
            best = (score, palettes.copy(), assignment.copy())
    _, palettes, assignment = best
    indices = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)
    preview = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
    for k, colors in enumerate(tiles):
        y, x = (k // 8) * 8, (k % 8) * 8
        palette = palettes[assignment[k]]
        ix = nearest(colors, palette)[0].reshape(8, 8)
        indices[y:y+8, x:x+8] = ix
        preview[y:y+8, x:x+8] = palette[ix]
    return {'pixels': indices.tolist(), 'attributes': (assignment + 1).tolist(),
            'palettes': hexes(palettes.reshape(-1, 3))}, Image.fromarray(preview)


def cut_head(im, fraction, number):
    # Source portraits contain a solid blue backdrop. Flood only the outside
    # backdrop so blue eyes and dark facial features remain intact.
    crop = im.crop((0, 0, im.width, round(im.height * fraction)))
    rgb = np.asarray(crop)
    r, g, b = rgb[..., 0].astype(float), rgb[..., 1].astype(float), rgb[..., 2].astype(float)
    background = (b > r * 1.2) & (b > g * 1.12) & (r < 60) & (g < 75) & (b < 120)
    h, w = background.shape
    outside = np.zeros((h, w), dtype=bool)
    queue = deque([(x, y) for x in range(w) for y in (0, h-1)] +
                  [(x, y) for y in range(h) for x in (0, w-1)])
    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= w or y < 0 or y >= h or outside[y, x] or not background[y, x]:
            continue
        outside[y, x] = True
        queue.extend(((x-1, y), (x+1, y), (x, y-1), (x, y+1)))
    # Cut away shoulders from the bust photograph before joining the animated
    # torso. The lower head silhouette is art-directed, retaining long hair.
    shape = Image.new('1', crop.size)
    if number in (1, 3, 6, 20, 26):
        contour = [(0,0),(100,0),(100,70),(91,88),(78,86),(69,80),(50,80),(37,86),(3,89),(0,70)]
    else:
        contour = [(0,0),(100,0),(100,43),(94,53),(88,59),(85,70),(76,80),(62,86),(49,85),(33,77),(22,65),(10,59),(0,51)]
    if number == 4:
        contour = [(0,0),(100,0),(100,47),(92,60),(88,70),(75,79),(58,81),(43,74),(31,63),(10,60),(0,54)]
    ImageDraw.Draw(shape).polygon([(round(x*im.width/100),round(y*im.height/100)) for x,y in contour], fill=1)
    opaque = ~outside & np.asarray(shape, dtype=bool)
    rgba = np.dstack((rgb, np.where(opaque, 255, 0).astype(np.uint8)))
    head = Image.fromarray(rgba).resize((32, 32), Image.Resampling.LANCZOS)
    a = np.asarray(head).copy()
    a[..., 3] = np.where(a[..., 3] >= 140, 255, 0)
    return Image.fromarray(a)


def fighter_pack(im, old, number):
    # Individual chin crops retain the head/hair shape instead of stretching
    # a generic face. The enlarged head extends above the existing body/hitbox.
    chin = [.86, .81, .82, .83, .80, .86, .87, .86,
            .84, .86, .85, .86, .85, .87, .87, .88,
            .84, .85, .84, .84, .82, .85, .85, .84,
            .86, .86, .83, .85, .86, .88, .88, .82][number]
    head = cut_head(im, chin, number)
    previous_palettes = np.array([tuple(bytes.fromhex(c[1:])) for c in old['palettes']])
    composed = []
    for pose in range(6):
        p = np.array(old['frames'][pose])
        rgba = np.zeros((48, 24, 4), dtype=np.uint8)
        for y in range(0 if number == 31 else 16, 48):
            for x in range(24):
                if p[y, x]:
                    pal = 0 if y < 16 else 8 if y < 32 and 8 <= x < 16 else 4
                    rgba[y, x, :3] = previous_palettes[pal + p[y, x]]
                    rgba[y, x, 3] = 255
        body = Image.fromarray(rgba[16:])
        canvas = Image.new('RGBA', (32, 64))
        canvas.paste(body, (4, 32))
        skin = tuple(previous_palettes[3]) + (255,)
        ImageDraw.Draw(canvas).rectangle((14,28,19,35),fill=skin)
        canvas.alpha_composite(head, (0, 0))
        if number == 31:
            canvas.paste(Image.fromarray(rgba[:16]).resize((32,32), Image.Resampling.NEAREST),(0,0))
        composed.append(np.asarray(canvas))
    palettes = []
    for band in range(3):
        end = 64 if band == 2 else band*16+16
        pixels = np.concatenate([p[band*16:end].reshape(-1, 4) for p in composed])
        visible = pixels[pixels[:, 3] > 0, :3]
        colors = palette_for(visible, 3)
        if band < 2 and number != 31:
            # Preserve dark eyes, brows and facial hair even for gray/blonde
            # heads; an area-only median cut otherwise washes these away.
            luminance = visible @ np.array([.2126,.7152,.0722])
            dark = visible[luminance <= np.quantile(luminance,.10)].mean(axis=0)
            dark *= min(1,80/max(1,dark @ np.array([.2126,.7152,.0722])))
            colors[0] = cgb([dark])[0]
            for _ in range(5):
                groups = nearest(visible, colors)[0]
                for k in (1,2):
                    selected = visible[groups == k]
                    if len(selected):
                        colors[k] = cgb([selected.mean(axis=0)])[0]
        palettes.append(np.vstack([cgb([BG]), colors]))
    frames, previews = [], []
    for p in composed:
        indices = np.zeros((64, 32), dtype=np.uint8)
        preview = np.tile(np.array(BG, dtype=np.uint8), (64, 32, 1))
        for band in range(3):
            end = 64 if band == 2 else band*16+16
            area = p[band*16:end]
            ix = nearest(area[..., :3], palettes[band][1:])[0] + 1
            ix[area[..., 3] == 0] = 0
            indices[band*16:end] = ix
            preview[band*16:end] = palettes[band][ix]
        frames.append(indices.tolist())
        previews.append(Image.fromarray(preview))
    return {'frames': frames, 'palettes': hexes(np.array(palettes).reshape(-1, 3))}, previews


def main():
    bodies = json.loads((ROOT / 'build/body-art.json').read_text())
    characters = []
    gallery = Image.new('RGB', (8*160, 4*232), BG)
    draw = ImageDraw.Draw(gallery)
    fighters = Image.new('RGB', (8*144, 4*224), BG)
    fd = ImageDraw.Draw(fighters)
    for page, filename in enumerate(['atlas-a.png', 'atlas-b.png']):
        atlas = Image.open(DEST / filename).convert('RGB')
        # The generated atlases have intentionally reviewed cell boundaries;
        # do not assume exact quarters and bleed neighboring heads into tiles.
        rows = [0,362,724,1064,1448] if page == 0 else [0,346,701,1055,1448]
        columns = ([[0,276,551,808,1086],[0,276,541,808,1086],
                    [0,276,541,817,1086],[0,276,541,817,1086]] if page == 0 else
                   [[0,274,539,814,1086],[0,274,539,806,1086],
                    [0,274,539,811,1086],[0,274,539,814,1086]])
        for i in range(16):
            number = page * 16 + i
            x, y = i % 4, i // 4
            inset = 8 if number == 2 else 2
            cell = atlas.crop((columns[y][x]+2, rows[y]+2, columns[y][x+1]-inset, rows[y+1]-2))
            portrait, preview = portrait_pack(cell)
            fighter, combat = fighter_pack(cell, bodies[number], number)
            characters.append({'name': bodies[number]['name'], 'portrait': portrait, 'fighter': fighter})
            cell.save(DEST / f'{number:02d}.png')
            gx, gy = number % 8 * 160, number // 8 * 232
            gallery.paste(preview.resize((128,160), Image.Resampling.NEAREST), (gx+16, gy+8))
            draw.text((gx+5, gy+184), bodies[number]['name'], fill='#f3e3bd')
            fx, fy = number % 8 * 144, number // 8 * 224
            fighters.paste(combat[0].resize((96,192),Image.Resampling.NEAREST),(fx+24,fy+4))
            fd.text((fx+4,fy+201),bodies[number]['name'],fill='#f3e3bd')
            print(f'{number+1:02d}/32 {bodies[number]["name"]}', flush=True)
    (DEST / 'cgb-art.json').write_text(json.dumps(characters, separators=(',', ':')))
    gallery.save(ROOT / 'build/portrait-conversion.png')
    fighters.save(ROOT / 'build/fighter-conversion.png')
    print('Packed 32 portraits (64x80, seven BG palettes) and 192 fighter frames (32x64, three OBJ palettes).')


if __name__ == '__main__':
    main()
