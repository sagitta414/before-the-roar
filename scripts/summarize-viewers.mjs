import {readFile} from 'node:fs/promises';
import {aggregateStudy} from '../dist/study-model.js';
const files=process.argv.slice(2);if(!files.length)throw Error('Supply participant JSON files explicitly. No human results are bundled.');
console.log(JSON.stringify(aggregateStudy(await Promise.all(files.map(async f=>JSON.parse(await readFile(f,'utf8'))))),null,2));
