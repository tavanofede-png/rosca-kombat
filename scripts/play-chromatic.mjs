import {existsSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const cli=process.env.CHROMATIC_CLI ?? path.join(root,'tools/chromatic-cli.exe');
const rom=path.join(root,'build/rosca-kombat.gbc');
const seconds=process.argv[2]??'1800';
if(!Number.isFinite(Number(seconds))||Number(seconds)<1||Number(seconds)>43200)throw Error('Duración: de 1 a 43200 segundos.');
if(!existsSync(cli))throw Error('No se encontró tools/chromatic-cli.exe. Definí CHROMATIC_CLI con la ruta de la CLI oficial.');
const devices=spawnSync(cli,['list-devices','--format','json'],{cwd:root,encoding:'utf8'});
if(devices.error)throw devices.error;
if(devices.status!==0)throw Error(devices.stderr||devices.stdout||'No se pudo detectar el dispositivo.');
const info=JSON.parse(devices.stdout);
if(!info.result?.devices?.length){
 console.error('No se detecta el Chromatic. Conectalo encendido por USB-C con un cable de datos y repetí el comando.');process.exit(2);
}
const hash=createHash('sha256').update(readFileSync(rom)).digest('hex');
console.log(`ROSCA KOMBAT: demo USB durante ${seconds} segundos. El juego del cartucho se conserva.`);
const r=spawnSync(cli,['live-demo',rom,'--player','1','--duration',seconds,'--expect-sha256',hash,'--no-save','--yes','--format','jsonl'],{cwd:root,stdio:'inherit'});
if(r.error)throw r.error;process.exit(r.status??1);
