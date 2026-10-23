import {existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
export const python=process.env.CHROMATIC_PYTHON ?? [
  path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'),
  process.platform==='win32'?'python':'python3'
].find(p=>p==='python'||p==='python3'||existsSync(p));
