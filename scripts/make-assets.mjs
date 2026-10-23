import {writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {roster} from './roster.mjs';
import {fighterArt,characterPalettes,portraitArt} from './character-art.mjs';
import {stageArt} from './stage-art.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
mkdirSync(path.join(root,'src'),{recursive:true});
const array=(name,d)=>`const unsigned char ${name}[] = {\n${Array.from({length:Math.ceil(d.length/24)},(_,i)=>d.slice(i*24,i*24+24).join(',')).join(',\n')}\n};\n`;
const rgb=s=>{const n=parseInt(s.slice(1),16);return `RGB(${Math.round((n>>16)/255*31)},${Math.round((n>>8&255)/255*31)},${Math.round((n&255)/255*31)})`;};
function canvas(w,h){
 const p=Array.from({length:h},()=>Array(w).fill(0));
 const dot=(x,y,c)=>{if(x>=0&&y>=0&&x<w&&y<h)p[y][x]=c;};
 const rect=(x,y,ww,hh,c)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)dot(xx,yy,c);};
 const line=(x,y,X,Y,c)=>{let dx=Math.abs(X-x),sx=x<X?1:-1,dy=-Math.abs(Y-y),sy=y<Y?1:-1,e=dx+dy;for(;;){dot(x,y,c);if(x===X&&y===Y)break;const ee=e*2;if(ee>=dy){e+=dy;x+=sx;}if(ee<=dx){e+=dx;y+=sy;}}};
 const oval=(x,y,rx,ry,c)=>{for(let yy=-ry;yy<=ry;yy++)for(let xx=-rx;xx<=rx;xx++)if(xx*xx*ry*ry+yy*yy*rx*rx<=rx*rx*ry*ry)dot(x+xx,y+yy,c);};
 return {p,dot,rect,line,oval};
}
function tile(p,x,y){const a=[];for(let j=0;j<8;j++){let l=0,h=0;for(let i=0;i<8;i++){const c=p[y+j]?.[x+i]??0;l|=(c&1)<<(7-i);h|=((c>>1)&1)<<(7-i);}a.push(l,h);}return a;}
let header='#ifndef ART_H\n#define ART_H\n#include <gb/cgb.h>\n';
for(let group=0;group<8;group++){
 let out=`#pragma bank ${group+2}\n`;
 for(let n=group*4;n<group*4+4;n++){
  const frames=[];
  // The 32x32 head is shared by all poses (16 tiles). Each animated 24x32
  // body is 12 tiles; 88 tiles per fighter keeps both players in OBJ bank 1.
  const head=fighterArt(roster[n],0,n);
  for(let y=0;y<2;y++)for(let x=0;x<4;x++)frames.push(...tile(head,x*8,y*16),...tile(head,x*8,y*16+8));
  for(let f=0;f<6;f++){const p=fighterArt(roster[n],f,n);for(let y=0;y<2;y++)for(let x=0;x<3;x++)frames.push(...tile(p,4+x*8,32+y*16),...tile(p,4+x*8,40+y*16));}
  out+=array(`fighter_${n}`,frames);header+=`extern const unsigned char fighter_${n}[];\n`;
  const portrait=[],art=portraitArt(n);
  for(let y=0;y<10;y++)for(let x=0;x<8;x++)portrait.push(...tile(art.pixels,x*8,y*8));
  // Native BG: 80 tiles (1280 bytes), 80 palette attributes, 7 CGB palettes.
  portrait.push(...art.attributes);
  for(const color of art.palettes){
   const rgb=parseInt(color.slice(1),16),v=Math.round((rgb>>16)*31/255)|(Math.round((rgb>>8&255)*31/255)<<5)|(Math.round((rgb&255)*31/255)<<10);
   portrait.push(v&255,v>>8);
  }
  out+=array(`portrait_${n}`,portrait);header+=`extern const unsigned char portrait_${n}[];\n`;
 }
 writeFileSync(path.join(root,`src/art${group+2}.c`),out);
}
// Each projectile has a distinct, deliberately legible 16x16 silhouette.
const icons=[];
for(let n=0;n<32;n++){
 const c=canvas(16,16),{rect,oval,line,dot}=c;
 switch(n){
 case 0:rect(1,7,7,7,1);rect(6,4,9,5,3);for(let x=7;x<16;x+=2){dot(x,3,2);dot(x,9,2);}break;
 case 1:rect(4,5,9,10,1);line(5,5,5,1,3);line(11,5,11,1,3);line(5,1,11,1,3);break;
 case 2:oval(8,5,5,5,1);line(8,10,6,15,3);break;
 case 3:case 16:case 21:case 30:rect(2,1,12,14,3);rect(3,2,10,12,1);for(let y=4;y<13;y+=3)line(5,y,11,y,3);break;
 case 4:oval(5,5,4,4,1);oval(11,5,4,4,1);for(let y=5;y<15;y++)line(1+y-5,y,15-y+5,y,1);break;
 case 5:rect(5,7,7,8,1);rect(7,3,3,5,3);line(9,3,12,1,1);dot(13,0,3);break;
 case 6:case 12:case 24:for(let i=0;i<5;i++)oval(3+i*3,8+(i%2)*2,4,4,i%2?1:3);break;
 case 7:case 28:rect(1,5,14,8,1);line(2,9,14,9,2);line(6,5,6,9,2);line(10,9,10,13,2);break;
 case 8:case 18:case 27:rect(1,4,14,10,1);rect(5,2,6,3,3);rect(7,7,3,5,3);break;
 case 9:for(let y=1;y<15;y++)line(8-Math.floor(y/2),y,8+Math.floor(y/2),y,1);oval(6,10,1,1,3);oval(10,12,1,1,3);break;
 case 10:case 29:oval(8,4,4,4,3);rect(6,6,4,7,1);line(7,12,3,15,3);break;
 case 11:oval(7,8,6,4,1);line(0,2,15,2,3);line(7,2,7,5,3);line(3,13,12,13,3);break;
 case 13:oval(8,9,5,7,2);oval(9,11,3,4,3);dot(10,4,3);rect(11,5,4,2,1);break;
 case 14:oval(5,11,5,4,1);oval(8,7,4,3,1);line(9,7,14,0,3);break;
 case 15:oval(8,9,7,4,1);line(2,8,14,8,3);break;
 case 17:oval(8,8,4,4,1);for(let i=0;i<16;i+=4){line(8,0,8,2,3);line(0,8,2,8,3);line(14,8,15,8,3);line(8,14,8,15,3);}break;
 case 19:rect(3,1,10,14,1);rect(5,3,6,3,3);for(let y=8;y<14;y+=3)for(let x=5;x<12;x+=3)dot(x,y,3);break;
 case 20:for(let y=1;y<15;y++)line(Math.max(0,8-y),y,Math.min(15,8+y),y,1);rect(0,7,16,3,3);break;
 case 22:oval(8,7,6,6,1);rect(3,9,8,6,1);line(4,6,11,6,3);break;
 case 23:line(0,9,15,9,3);line(3,12,13,12,1);line(0,9,3,12,1);rect(6,5,6,4,1);break;
 case 25:rect(0,3,16,10,1);rect(2,4,4,4,3);rect(8,4,6,4,3);oval(3,13,2,2,2);oval(12,13,2,2,2);break;
 case 26:oval(8,7,5,6,1);rect(1,11,14,2,3);oval(8,14,2,1,3);break;
 case 31:oval(7,10,7,5,1);oval(11,4,4,4,1);rect(12,5,4,2,3);dot(12,3,2);break;
 }
 for(let x=0;x<2;x++)icons.push(...tile(c.p,x*8,0),...tile(c.p,x*8,8));
 const small=c.p.map(row=>Array.from({length:8},(_,x)=>row[x*2]||row[x*2+1]));
 icons.push(...tile(small,0,0),...tile(small,0,8));
}
// Stages are tile-compressed by exact byte identity and share palette slots.
let stages='#pragma bank 10\n#include <gb/cgb.h>\n';
for(let s=0;s<4;s++){
 const art=stageArt(s),tiles=[],map=[],attr=art.attributes,cache=new Map();
 for(let y=0;y<18;y++)for(let x=0;x<20;x++){
  const d=tile(art.pixels,x*8,y*8),k=d.join(',');
  if(!cache.has(k)){cache.set(k,tiles.length);tiles.push(d);}
  map.push(128+cache.get(k));
 }
 if(tiles.length>128)throw Error('Stage tile overflow '+tiles.length);
 stages+=array(`stage_${s}_tiles`,tiles.flat())+array(`stage_${s}_map`,map)+array(`stage_${s}_attr`,attr);
 stages+=`const palette_color_t stage_${s}_palette[]={${art.palettes.map(rgb).join(',')}};\n`;
 header+=`extern const unsigned char stage_${s}_tiles[],stage_${s}_map[],stage_${s}_attr[];\nextern const palette_color_t stage_${s}_palette[];\n#define STAGE_${s}_COUNT ${tiles.length}\n`;
 console.log(`${art.name}: ${tiles.length} tiles, 8 palettes`);
}
stages+=array('icons',icons);
header+='extern const unsigned char icons[];\n';
header+='const unsigned char * const fighter_art[]={'+roster.map((_,i)=>`fighter_${i}`).join(',')+'};\n';
header+='const unsigned char * const portrait_art[]={'+roster.map((_,i)=>`portrait_${i}`).join(',')+'};\n';
header+='const palette_color_t * const stage_palettes[]={stage_0_palette,stage_1_palette,stage_2_palette,stage_3_palette};\n';
header+='const unsigned char * const stage_art[]={stage_0_tiles,stage_1_tiles,stage_2_tiles,stage_3_tiles};\n';
header+='const unsigned char * const stage_maps[]={stage_0_map,stage_1_map,stage_2_map,stage_3_map};\n';
header+='const unsigned char * const stage_attrs[]={stage_0_attr,stage_1_attr,stage_2_attr,stage_3_attr};\n';
header+='const unsigned char stage_counts[]={STAGE_0_COUNT,STAGE_1_COUNT,STAGE_2_COUNT,STAGE_3_COUNT};\n#endif\n';
writeFileSync(path.join(root,'src/stages.c'),stages);writeFileSync(path.join(root,'src/art.h'),header);
const rh=`/* Generated from scripts/roster.mjs */\n#define ROSTER_COUNT 32\ntypedef struct {const char *name,*special,*finish;unsigned char type,icon,speed,power;palette_color_t suit,hair;} Character;\nextern const Character roster[32];\nextern const palette_color_t character_palettes[32][12];\nextern const metasprite_t fighter_poses[2][6][15];\n`;
const rc='#pragma bank 11\n#include <gb/cgb.h>\n#include <gb/metasprites.h>\n#include "roster.h"\nconst Character roster[32]={\n'+roster.map(r=>`{"${r[0]}","${r[1]}","${r[2]}",${r[3]},${r[4]},${r[8]},${r[9]},${rgb(r[5])},${rgb(r[6])}}`).join(',\n')+'\n};\n';
const paletteData='const palette_color_t character_palettes[32][12]={\n'+roster.map((r,i)=>'{'+characterPalettes(r,i).map(rgb).join(',')+'}').join(',\n')+'\n};\n';
const meta='const metasprite_t fighter_poses[2][6][15]={\n'+[0,1].map(slot=>'{\n'+Array.from({length:6},(_,pose)=>{
 let px=0,py=0;const items=[];
 for(let row=0;row<4;row++)for(let col=0;col<(row<2?4:3);col++){
  const x=col*8+(row<2?-4:0),y=row*16-16,tile=(row<2?row*8:16+pose*12+(row-2)*6)+col*2;
  items.push(`{${y-py},${x-px},${tile},${slot*3+Math.min(row,2)}}`);px=x;py=y;
 }
 return '{'+items.join(',')+',METASPR_TERM}';
}).join(',\n')+'\n}').join(',\n')+'\n};\n';
writeFileSync(path.join(root,'src/roster.h'),rh);writeFileSync(path.join(root,'src/roster.c'),rc+paletteData+meta);
writeFileSync(path.join(root,'build/art-review.json'),JSON.stringify({characters:roster.map((r,i)=>({name:r[0],pixels:fighterArt(r,0,i),palettes:characterPalettes(r,i)})),stages:Array.from({length:4},(_,i)=>stageArt(i))}));
writeFileSync(path.join(root,'docs/plantel.md'),'# Plantel de Rosca Kombat\n\nCaricaturas de ficción. Los ataques y remates son chistes, no afirmaciones sobre hechos reales.\n\n| Personaje | Especial | Remate |\n| --- | --- | --- |\n'+roster.map(r=>`| ${r[0]} | ${r[1]} | ${r[2]} |`).join('\n')+'\n');
console.log('32 retratos de 64x80, 192 poses con caras nuevas, 32 objetos y 4 escenarios generados.');
