const fs = require('fs');

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
    process.exit(1);
  }
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  const fileNodes = data.fileNodes || [];
  const importEdges = data.importEdges || [];
  const allEdges = data.allEdges || [];

  // A. Directory grouping (flat project -> group by extension/type)
  const paths = fileNodes.map(n => n.filePath || n.name || '');
  function commonPrefix(strs) {
    if (strs.length === 0) return '';
    let prefix = strs[0];
    for (const s of strs.slice(1)) {
      let i = 0;
      while (i < prefix.length && i < s.length && prefix[i] === s[i]) i++;
      prefix = prefix.slice(0, i);
    }
    const idx = prefix.lastIndexOf('/');
    return idx >= 0 ? prefix.slice(0, idx + 1) : '';
  }
  const prefix = commonPrefix(paths);

  const directoryGroups = {};
  for (const n of fileNodes) {
    const fp = n.filePath || n.name || '';
    let rest = fp.startsWith(prefix) ? fp.slice(prefix.length) : fp;
    const segs = rest.split('/').filter(Boolean);
    let group;
    if (segs.length > 1) {
      group = segs[0];
    } else {
      // flat - group by extension/type
      const fname = segs[0] || fp;
      const ext = fname.includes('.') ? fname.split('.').pop() : 'other';
      if (n.type && n.type !== 'file') {
        group = n.type;
      } else {
        group = ext;
      }
    }
    if (!directoryGroups[group]) directoryGroups[group] = [];
    directoryGroups[group].push(n.id);
  }

  // B. Node type grouping
  const nodeTypeGroups = {};
  for (const n of fileNodes) {
    const t = n.type || 'file';
    if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
    nodeTypeGroups[t].push(n.id);
  }

  // C. Import adjacency
  const fileFanOut = {};
  const fileFanIn = {};
  for (const n of fileNodes) {
    fileFanOut[n.id] = 0;
    fileFanIn[n.id] = 0;
  }
  for (const e of importEdges) {
    if (fileFanOut.hasOwnProperty(e.source)) fileFanOut[e.source]++;
    if (fileFanIn.hasOwnProperty(e.target)) fileFanIn[e.target]++;
  }

  // D. Cross-category dependency analysis
  const idToType = {};
  for (const n of fileNodes) idToType[n.id] = n.type || 'file';
  const crossCategoryMap = {};
  for (const e of allEdges) {
    const fromType = idToType[e.source];
    const toType = idToType[e.target];
    if (!fromType || !toType) continue;
    if (fromType === toType && e.type === 'imports') continue;
    const key = `${fromType}|${toType}|${e.type}`;
    crossCategoryMap[key] = (crossCategoryMap[key] || 0) + 1;
  }
  const crossCategoryEdges = Object.entries(crossCategoryMap).map(([k, count]) => {
    const [fromType, toType, edgeType] = k.split('|');
    return { fromType, toType, edgeType, count };
  });

  // E. Inter-group import frequency
  const idToGroup = {};
  for (const [g, ids] of Object.entries(directoryGroups)) {
    for (const id of ids) idToGroup[id] = g;
  }
  const interGroupMap = {};
  for (const e of importEdges) {
    const gs = idToGroup[e.source];
    const gt = idToGroup[e.target];
    if (!gs || !gt || gs === gt) continue;
    const key = `${gs}|${gt}`;
    interGroupMap[key] = (interGroupMap[key] || 0) + 1;
  }
  const interGroupImports = Object.entries(interGroupMap).map(([k, count]) => {
    const [from, to] = k.split('|');
    return { from, to, count };
  });

  // F. Intra-group import density
  const intraGroupDensity = {};
  for (const g of Object.keys(directoryGroups)) {
    let internalEdges = 0;
    let totalEdges = 0;
    for (const e of importEdges) {
      const gs = idToGroup[e.source];
      const gt = idToGroup[e.target];
      if (gs === g || gt === g) {
        totalEdges++;
        if (gs === g && gt === g) internalEdges++;
      }
    }
    intraGroupDensity[g] = {
      internalEdges,
      totalEdges,
      density: totalEdges > 0 ? internalEdges / totalEdges : 0
    };
  }

  // G. Directory pattern matching
  const patternTable = {
    routes: 'api', api: 'api', controllers: 'api', endpoints: 'api', handlers: 'api',
    services: 'service', core: 'service', lib: 'service', domain: 'service', logic: 'service',
    models: 'data', db: 'data', data: 'data', persistence: 'data', repository: 'data', entities: 'data',
    components: 'ui', views: 'ui', pages: 'ui', ui: 'ui', layouts: 'ui', screens: 'ui',
    middleware: 'middleware', plugins: 'middleware', interceptors: 'middleware', guards: 'middleware',
    utils: 'utility', helpers: 'utility', common: 'utility', shared: 'utility', tools: 'utility',
    config: 'config', constants: 'config', env: 'config', settings: 'config',
    __tests__: 'test', test: 'test', tests: 'test', spec: 'test', specs: 'test',
    types: 'types', interfaces: 'types', schemas: 'types', contracts: 'types', dtos: 'types',
    hooks: 'hooks',
    store: 'state', state: 'state', reducers: 'state', actions: 'state', slices: 'state',
    assets: 'assets', static: 'assets', public: 'assets',
    migrations: 'data',
    management: 'config', commands: 'config',
    templatetags: 'utility',
    signals: 'service',
    serializers: 'api',
    cmd: 'entry',
    internal: 'service',
    pkg: 'utility',
    dto: 'types', request: 'types', response: 'types',
    entity: 'data',
    controller: 'api',
    routers: 'api',
    composables: 'service',
    blueprints: 'api',
    mailers: 'service', jobs: 'service', channels: 'service',
    bin: 'entry',
    docs: 'documentation', documentation: 'documentation', wiki: 'documentation',
    deploy: 'infrastructure', deployment: 'infrastructure', infra: 'infrastructure', infrastructure: 'infrastructure',
    k8s: 'infrastructure', kubernetes: 'infrastructure', helm: 'infrastructure', charts: 'infrastructure',
    terraform: 'infrastructure', tf: 'infrastructure',
    docker: 'infrastructure',
    sql: 'data', database: 'data', schema: 'data',
    html: 'ui',
    document: 'documentation'
  };
  const patternMatches = {};
  for (const g of Object.keys(directoryGroups)) {
    if (patternTable[g]) patternMatches[g] = patternTable[g];
  }

  // H. Deployment topology
  const allPaths = fileNodes.map(n => n.filePath || '');
  const infraFiles = allPaths.filter(p =>
    /Dockerfile/i.test(p) || /docker-compose/i.test(p) || /\.tf$/.test(p) ||
    /\.github\/workflows\//.test(p) || /\.gitlab-ci\.yml/.test(p) || /Jenkinsfile/.test(p) ||
    /Makefile/.test(p) || /k8s|kubernetes|helm/i.test(p)
  );
  const deploymentTopology = {
    hasDockerfile: allPaths.some(p => /Dockerfile/i.test(p)),
    hasCompose: allPaths.some(p => /docker-compose/i.test(p)),
    hasK8s: allPaths.some(p => /k8s|kubernetes|helm/i.test(p)),
    hasTerraform: allPaths.some(p => /\.tf$/.test(p)),
    hasCI: allPaths.some(p => /\.github\/workflows\//.test(p) || /\.gitlab-ci\.yml/.test(p) || /Jenkinsfile/.test(p)),
    infraFiles
  };

  // I. Data pipeline detection
  const schemaFiles = allPaths.filter(p => /\.sql$/.test(p) || /\.graphql$/.test(p) || /\.proto$/.test(p));
  const migrationFiles = allPaths.filter(p => /migrations\//.test(p));
  const dataModelFiles = allPaths.filter(p => /models?\//.test(p));
  const apiHandlerFiles = allPaths.filter(p => /routes|controllers|handlers/.test(p));
  const dataPipeline = { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles };

  // J. Documentation coverage
  const totalGroups = Object.keys(directoryGroups).length;
  const docPaths = allPaths.filter(p => /\.md$/i.test(p) || /\.rst$/i.test(p));
  let groupsWithDocs = 0;
  const undocumentedGroups = [];
  for (const g of Object.keys(directoryGroups)) {
    const hasDoc = docPaths.some(p => p.toLowerCase().includes(g.toLowerCase())) ||
      (g === 'document' || g === 'documentation');
    if (hasDoc) groupsWithDocs++;
    else undocumentedGroups.push(g);
  }
  const docCoverage = {
    groupsWithDocs,
    totalGroups,
    coverageRatio: totalGroups > 0 ? groupsWithDocs / totalGroups : 0,
    undocumentedGroups
  };

  // K. Dependency direction
  const dependencyDirection = [];
  const seenPairs = new Set();
  for (const { from, to, count } of interGroupImports) {
    const key = [from, to].sort().join('|');
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    const reverse = interGroupImports.find(x => x.from === to && x.to === from);
    const reverseCount = reverse ? reverse.count : 0;
    if (count > reverseCount) {
      dependencyDirection.push({ dependent: from, dependsOn: to });
    } else if (reverseCount > count) {
      dependencyDirection.push({ dependent: to, dependsOn: from });
    }
  }

  // fileStats
  const filesPerGroup = {};
  for (const [g, ids] of Object.entries(directoryGroups)) filesPerGroup[g] = ids.length;
  const nodeTypeCounts = {};
  for (const [t, ids] of Object.entries(nodeTypeGroups)) nodeTypeCounts[t] = ids.length;

  const result = {
    scriptCompleted: true,
    directoryGroups,
    nodeTypeGroups,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup,
      nodeTypeCounts
    },
    fileFanIn,
    fileFanOut
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  process.exit(0);
}

try {
  main();
} catch (err) {
  console.error(err.stack || String(err));
  process.exit(1);
}
