import fs from 'fs'

const statusFile = './static/status.json';

if (!fs.existsSync(statusFile)) {
  fs.writeFileSync(statusFile, JSON.stringify({}), 'utf8');
}