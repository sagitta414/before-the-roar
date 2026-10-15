import {readFileSync} from 'node:fs';
// Public source distributions deliberately exclude unresolved cinematic assets.
export const optionalMedia=JSON.parse(readFileSync(new URL('../dist/media-availability.json',import.meta.url),'utf8')).pitchside!==false;
