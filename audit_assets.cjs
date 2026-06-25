const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'release') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const allFiles = walkSync('.');
const mdFiles = allFiles.filter(f => f.endsWith('.md'));
const csvFiles = allFiles.filter(f => f.endsWith('.csv'));

fs.writeFileSync('audit_md_files.json', JSON.stringify(mdFiles, null, 2));
fs.writeFileSync('audit_csv_files.json', JSON.stringify(csvFiles, null, 2));
console.log('Audit completed.');
