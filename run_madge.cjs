const madge = require('madge');
const fs = require('fs');

madge(['src', 'electron'], {
  fileExtensions: ['js', 'jsx']
}).then((res) => {
  const obj = res.obj();
  fs.writeFileSync('dependency_graph.json', JSON.stringify(obj, null, 2));
  
  const importedNodes = new Set();
  for (const deps of Object.values(obj)) {
    for (const dep of deps) {
      importedNodes.add(dep);
    }
  }

  const unimportedNodes = [];
  for (const node of Object.keys(obj)) {
    if (!importedNodes.has(node)) {
      unimportedNodes.push(node);
    }
  }

  fs.writeFileSync('unimported.json', JSON.stringify(unimportedNodes, null, 2));
  console.log('Unimported nodes:', unimportedNodes.length);
  console.log('Total nodes:', Object.keys(obj).length);
}).catch(console.error);
