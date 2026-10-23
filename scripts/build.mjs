import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
mkdirSync(path.join(root,'build'),{recursive:true});
const sources=['src/main.c','src/roster.c', ...Array.from({length:8},(_,i)=>`src/art${i+2}.c`),'src/stages.c'];
const gbdkDir=(process.env.GBDKDIR??'tools/gbdk/').replaceAll('\\','/').replace(/\/?$/,'/');
const compiler=process.env.GBDK_LCC??path.join(gbdkDir,'bin',process.platform==='win32'?'lcc.exe':'lcc');
const r=spawnSync(compiler,[
  '-Wm-yC','-Wm-ynROSCAKOMBAT','-Wm-yt0x19','-Wm-yo16','-Wl-m','-Wl-j',
  '-o','build/rosca-kombat.gbc',...sources
],{cwd:root,stdio:'inherit',env:{...process.env,GBDKDIR:gbdkDir}});
if(r.error)throw Error(`No se pudo ejecutar ${compiler}. Instalá GBDK 4.5.0 en tools/gbdk o definí GBDKDIR. ${r.error.message}`);
if(r.status!==0)process.exit(r.status??1);
const rom=readFileSync(path.join(root,'build/rosca-kombat.gbc'));
// All executable code and interrupt handlers must remain in the fixed bank.
// Graphics and roster data temporarily replace the switchable bank.
const map=readFileSync(path.join(root,'build/rosca-kombat.map'),'utf8');
const fixedEnd=map.match(/([0-9A-F]+)\s+s__BASE/);
if(!fixedEnd||parseInt(fixedEnd[1],16)>0x4000)throw Error('El código fijo excede el banco 0; separar funciones antes de publicar.');
let sum=0;
for(let i=0x134;i<=0x14c;i++)sum=(sum-rom[i]-1)&255;
if(rom[0x143]!==0xc0||rom[0x147]!==0x19||sum!==rom[0x14d])throw Error('Cabecera inválida');
let global=0;for(let i=0;i<rom.length;i++)if(i!==0x14e&&i!==0x14f)global=(global+rom[i])&65535;
if(global!==((rom[0x14e]<<8)|rom[0x14f]))throw Error('Checksum global inválido');
const hash=createHash('sha256').update(rom).digest('hex');
writeFileSync(path.join(root,'build/rosca-kombat.sha256'),hash+'\n');
console.log(`ROM verificada: ${rom.length} bytes; SHA256 ${hash}`);
