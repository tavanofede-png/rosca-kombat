import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {python} from './runtime.mjs';
for(const script of ['scripts/playtest.py','scripts/check-likeness.py']){
 const r=spawnSync(python,[script],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit'});
 if(r.error)throw r.error;
 if(r.status!==0)process.exit(r.status??1);
}
