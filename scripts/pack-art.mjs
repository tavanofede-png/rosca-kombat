import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {python} from './runtime.mjs';
const cwd=fileURLToPath(new URL('../',import.meta.url));
for(const [cmd,args] of [[process.execPath,['scripts/export-body.mjs']],[python,['scripts/pack-portraits.py']]]){
 const result=spawnSync(cmd,args,{cwd,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
