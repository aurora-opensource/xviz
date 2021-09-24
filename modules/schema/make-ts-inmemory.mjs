import { compile } from 'json-schema-to-typescript'
import fs from 'fs';
import path from 'path';

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
  let fp = file.url; 
  if (fp.match(/^file:\/\//)) {
    fp = fp.slice(7);
  }

  let pp = fs.readFileSync(fp, 'utf8');
  let p = pp.split('\n');
  let npp = p.map(ln => {
    let nln = ln;
    if (nln.match(/"id":/)) {
      nln = nln.replace("https://xviz.org/schema/", '');
      nln = nln.replace(".schema.json", '');
      nln = nln.replace(".json", '');
      nln = nln.replace("core/", '');
      nln = nln.replace("session/", '');
      nln = nln.replace("math/", '');
      nln = nln.replace("primitive/", '');
      nln = nln.replace("style/", '');
    }
    if (nln.match(/"\$ref": "http/)) {
      nln = nln.replace("https://xviz.org/", 'file://');

      if (!nln.match(/schema.json/)) {
        nln = nln.replace(".json", ".schema.json");
      }
    }
    return nln;
  });
   
	const data = npp.join('\n');

	if (cb) {
		cb(null, data);
  }

  return data;
}


const files = await walk('schema');

let myResolver = {
  order: 1,

  canRead: true,

  read(file, callback, $refs) {
		processFile(file, callback);
  }
};

const opts = {
  bannerComment: "",
  declareExternallyReferenced: false,
  ignoreMinAndMaxItems: true,
  cwd: ".",
	$refOptions: { resolve: { http: false, file: false, memory: myResolver }}
};

const ts_defs = [
  'declare module "@xviz/types" {\nnamespace xviz {\nnamespace v2 {'
];
for (let file of files) {
  const file_path = path.parse(file);

  if (file_path.ext === '.json') {

  	let json_schema = processFile({url: file});
    // Fix schema definitions for processing
    /* write 1 .d.ts file per input file
    const dirs = file_path.dir.split('/');
    const new_path = `types/${dirs.slice(1)}`;
    if (!fs.existsSync(new_path)) {
      fs.mkdirSync(new_path);
    }
    const ts_def = `${new_path}/${file_path.name}.d.ts`;
    console.log(`Writing ${ts_def}`);
    */
    const ts = await compile(JSON.parse(json_schema), file_path.name.replace('.schema', ''), opts);
    ts_defs.push(ts);
    // fs.writeFileSync(ts_def, ts);
  }
}
if (!fs.existsSync("types")) {
  fs.mkdirSync("types");
}

ts_defs.push("} // namespace v2\n} // namespace xviz\n// module");
const defs = ts_defs.join("\n");
fs.writeFileSync("types/xviz.d.ts", defs);
