// Native, prepacked CGB artwork. Rebuild source conversion with npm run art:pack.
// Portraits and fighter faces are derived from the same individual likeness.
import {readFileSync} from 'node:fs';
const characters=JSON.parse(readFileSync(new URL('../assets/portraits/cgb-art.json',import.meta.url),'utf8'));
if(characters.length!==32)throw Error('Se requieren 32 retratos y luchadores.');
for(const c of characters){
 if(c.fighter.frames.some(p=>p.length!==64||p.some(row=>row.length!==32)))throw Error('Actualizar arte con npm run art:pack: '+c.name);
 if(c.portrait.pixels.length!==80||c.portrait.attributes.length!==80||c.portrait.palettes.length!==28)throw Error('Retrato incompleto: '+c.name);
}
export const fighterArt=(roster,frame,id)=>characters[id].fighter.frames[frame];
export const characterPalettes=(roster,id)=>characters[id].fighter.palettes;
export const portraitArt=id=>characters[id].portrait;
