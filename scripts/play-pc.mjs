import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {python} from './runtime.mjs';
const r=spawnSync(python,['scripts/play-pc.py'],{cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit'});
if(r.error)throw r.error;process.exit(r.status??1);
