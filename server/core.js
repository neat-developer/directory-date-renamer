let fs = require('fs');
const path = require('path');
const promisify = require('util').promisify;
const readdirp = promisify(fs.readdir);
const statp = promisify(fs.stat);

const args = process.argv.slice(2).reduce((acc, arg) => {
    let [key, value] = arg.split('=');
    acc[key] = value;
    return acc;
}, {});

let dirPath = __dirname + args['directory'];

async function scan(directoryName, results = []) {
    let files = await readdirp(directoryName);
    for (let f of files) {
        let fullPath = path.join(directoryName, f);
        let stat = await statp(fullPath);

        if (stat.isDirectory()) {
            results.push(fullPath);
            await scan(fullPath, results);
        }
    }
    return results;
}

(async () => {
    if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
        let results = await scan(dirPath, []);
        let dateRegularExpression = new RegExp(/(.*)(\d{2})\.(\d{2})\.(\d{4})(.*)/);

        results = results.filter(path => {
            return dateRegularExpression.test(path)
        });

        results.forEach(path => {
            let newName = path.replace(dateRegularExpression, "$1$4.$3.$2$5");
            
            fs.rename(path, newName, function (err) {
                if (err) console.log('ERROR: ' + err);
            });
        });
    }
})();
