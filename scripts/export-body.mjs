// Reusable hand-authored poses before applying the new portrait heads.
import {writeFileSync} from 'node:fs';
import {roster} from './roster.mjs';
import {fighterArt,characterPalettes} from './body-art.mjs';
writeFileSync(new URL('../build/body-art.json',import.meta.url),JSON.stringify(roster.map((r,i)=>({
 name:r[0],palettes:characterPalettes(r,i),frames:Array.from({length:6},(_,f)=>fighterArt(r,f,i))
}))));
