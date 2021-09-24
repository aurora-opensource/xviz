import { compile, compileFromFile } from 'json-schema-to-typescript'
import fs from 'fs';
import path from 'path';
import {dirname} from 'path';

function walk(dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
      if (error) {
        return reject(error);
      }
      Promise.all(files.map((file) => {
        return new Promise((resolve, reject) => {
          const filepath = path.join(dir, file);
          fs.stat(filepath, (error, stats) => {
            if (error) {
              return reject(error);
            }
            if (stats.isDirectory()) {
              walk(filepath).then(resolve);
            } else if (stats.isFile()) {
              resolve(filepath);
            }
          });
        });
      }))
      .then((foldersContents) => {
        resolve(foldersContents.reduce((all, folderContents) => all.concat(folderContents), []));
      });
    });
  });
}

function processFile(file, cb) {
  let pp = fs.readFileSync(file, 'utf8');
  let p = pp.split('\n');
  let npp = p.map(ln => {
    let nln = ln;
    if (nln.match(/"id":/)) {
      console.log('found id');
      nln = nln.replace("https://xviz.org/schema/", '');
      nln = nln.replace(".schema.json", '');
      nln = nln.replace(".json", '');
    }
    if (nln.match(/"\$ref": "http/)) {
      nln = nln.replace("https://xviz.org/", './');
      nln = nln.replace(".json", ".schema.json");
    }
    return nln;
  });
   
	const data = npp.join('\n');

	if (cb) {
		cb(null, data);
  }

  return data;
}

const opts = {
  // declareExternallyReferenced: false,
  cwd: ".",
};

const files = await walk('schema');

if (process.env.WRITE) {
	for (let file of files) {
  	const file_path = path.parse(file);
  	if (file_path.ext !== '.json') {
			continue;
		}
  	let json_schema = processFile(file);
    console.log(`Rewriting ${file}`);
    fs.writeFileSync(file, json_schema);
	}
}

for (let file of files) {
  console.log(file);
  const file_path = path.parse(file);
  if (file_path.ext === '.json') {
  	let json_schema = processFile(file);
    // Fix schema definitions for processing
    const dirs = file_path.dir.split('/');
    const new_path = `ts/${dirs.slice(1)}`;
    if (!fs.existsSync(new_path)) {
      fs.mkdirSync(new_path);
    }
    const ts_def = `${new_path}/${file_path.name}.d.ts`;
    console.log(`Writing ${ts_def}`);
    console.log(json_schema);
    console.log("name ", file_path.name.replace('.schema', ''));
    console.log("file", file);
    console.log("dirname ", dirname(file));
    const ts = await compileFromFile(file, opts);
		fs.writeFileSync(ts_def, ts)
  }
}
