const fs = require('fs');
let graphStr = fs.readFileSync('dependency_graph.json', 'utf16le');
if (graphStr.charCodeAt(0) === 0xFEFF) graphStr = graphStr.slice(1);
const graph = JSON.parse(graphStr);

const importedNodes = new Set();
for (const [node, deps] of Object.entries(graph)) {
  for (const dep of deps) {
    importedNodes.add(dep);
  }
}

const unimportedNodes = [];
for (const node of Object.keys(graph)) {
  if (!importedNodes.has(node)) {
    unimportedNodes.push(node);
  }
}

fs.writeFileSync('unimported.json', JSON.stringify(unimportedNodes, null, 2));
console.log('Unimported nodes:', unimportedNodes.length);
console.log('Total nodes:', Object.keys(graph).length);
