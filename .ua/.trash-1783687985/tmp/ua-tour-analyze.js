#!/usr/bin/env node
'use strict';

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) {
    console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
    process.exit(1);
  }

  let data;
  try {
    const fs = require('fs');
    const raw = fs.readFileSync(inputPath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read/parse input: ' + e.message);
    process.exit(1);
  }

  const fs = require('fs');
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const layers = Array.isArray(data.layers) ? data.layers : [];

  const nodeById = new Map(nodes.map(n => [n.id, n]));

  const fanIn = new Map();
  const fanOut = new Map();
  for (const n of nodes) { fanIn.set(n.id, 0); fanOut.set(n.id, 0); }
  for (const e of edges) {
    if (fanOut.has(e.source)) fanOut.set(e.source, fanOut.get(e.source) + 1);
    if (fanIn.has(e.target)) fanIn.set(e.target, fanIn.get(e.target) + 1);
  }

  const fanInRanking = [...fanIn.entries()]
    .map(([id, v]) => ({ id, fanIn: v, name: nodeById.get(id) ? nodeById.get(id).name : id }))
    .sort((a, b) => b.fanIn - a.fanIn)
    .slice(0, 20);

  const fanOutRanking = [...fanOut.entries()]
    .map(([id, v]) => ({ id, fanOut: v, name: nodeById.get(id) ? nodeById.get(id).name : id }))
    .sort((a, b) => b.fanOut - a.fanOut)
    .slice(0, 20);

  // Entry point candidates
  const entryFilenames = new Set(['index.ts','index.js','main.ts','main.js','app.ts','app.js','server.ts','server.js','mod.rs','main.go','main.py','main.rs','manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py','Application.java','Main.java','Program.cs','config.ru','index.php','App.swift','Application.kt','main.cpp','main.c','index.html']);

  const fanOutVals = [...fanOut.values()].sort((a,b) => b-a);
  const fanInVals = [...fanIn.values()].sort((a,b) => a-b);
  const top10PctFanOutThreshold = fanOutVals.length ? fanOutVals[Math.max(0, Math.floor(fanOutVals.length * 0.1) - 1)] : 0;
  const bottom25PctFanInThreshold = fanInVals.length ? fanInVals[Math.max(0, Math.floor(fanInVals.length * 0.25) - 1)] : 0;

  const entryPointCandidates = [];
  for (const n of nodes) {
    let score = 0;
    const filePath = n.filePath || '';
    const depth = filePath.split('/').filter(Boolean).length;
    if (n.type === 'document') {
      const isRoot = depth <= 1;
      if (isRoot && /^readme\.md$/i.test(n.name || '')) score += 5;
      else if (isRoot && /\.md$/i.test(n.name || '')) score += 2;
    } else if (n.type === 'file') {
      if (entryFilenames.has(n.name)) score += 3;
      if (depth <= 2) score += 1;
      if (fanOut.get(n.id) >= top10PctFanOutThreshold && fanOut.get(n.id) > 0) score += 1;
      if (fanIn.get(n.id) <= bottom25PctFanInThreshold) score += 1;
    }
    if (score > 0) entryPointCandidates.push({ id: n.id, score, name: n.name, summary: n.summary });
  }
  entryPointCandidates.sort((a, b) => b.score - a.score);
  const topEntryCandidates = entryPointCandidates.slice(0, 5);

  // BFS from top code entry point (skip document nodes)
  const codeEntry = topEntryCandidates.find(c => {
    const node = nodeById.get(c.id);
    return node && node.type !== 'document';
  }) || (nodes.find(n => n.type === 'file'));

  const adjacency = new Map();
  for (const n of nodes) adjacency.set(n.id, []);
  for (const e of edges) {
    if ((e.type === 'imports' || e.type === 'calls') && adjacency.has(e.source)) {
      adjacency.get(e.source).push(e.target);
    }
  }

  let bfsTraversal = { startNode: null, order: [], depthMap: {}, byDepth: {} };
  if (codeEntry) {
    const start = codeEntry.id;
    const visited = new Set([start]);
    const order = [start];
    const depthMap = { [start]: 0 };
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift();
      const d = depthMap[cur];
      for (const next of (adjacency.get(cur) || [])) {
        if (!visited.has(next)) {
          visited.add(next);
          depthMap[next] = d + 1;
          order.push(next);
          queue.push(next);
        }
      }
    }
    const byDepth = {};
    for (const [id, d] of Object.entries(depthMap)) {
      if (!byDepth[d]) byDepth[d] = [];
      byDepth[d].push(id);
    }
    bfsTraversal = { startNode: start, order, depthMap, byDepth };
  }

  // Non-code file inventory
  const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
  for (const n of nodes) {
    const entry = { id: n.id, name: n.name, type: n.type, summary: n.summary };
    if (n.type === 'document') nonCodeFiles.documentation.push(entry);
    else if (['service', 'pipeline', 'resource'].includes(n.type)) nonCodeFiles.infrastructure.push(entry);
    else if (['table', 'schema', 'endpoint'].includes(n.type)) nonCodeFiles.data.push(entry);
    else if (n.type === 'config') nonCodeFiles.config.push(entry);
  }

  // Clusters: bidirectional relationships (imports/calls both ways)
  const edgeSet = new Set(edges.map(e => `${e.source}=>${e.target}:${e.type}`));
  const pairs = [];
  for (const e of edges) {
    if (e.type !== 'imports' && e.type !== 'calls') continue;
    const reverseKey = `${e.target}=>${e.source}:${e.type}`;
    if (edgeSet.has(reverseKey) && e.source < e.target) {
      pairs.push([e.source, e.target]);
    }
  }
  const clusterGroups = [];
  const assigned = new Map();
  for (const [a, b] of pairs) {
    let cluster = assigned.get(a) || assigned.get(b);
    if (!cluster) {
      cluster = new Set();
      clusterGroups.push(cluster);
    }
    cluster.add(a); cluster.add(b);
    assigned.set(a, cluster); assigned.set(b, cluster);
  }
  // Expand clusters: add nodes connecting to 2+ existing members
  for (const cluster of clusterGroups) {
    let changed = true;
    while (changed && cluster.size < 5) {
      changed = false;
      const counts = new Map();
      for (const e of edges) {
        if (cluster.has(e.target) && !cluster.has(e.source)) {
          counts.set(e.source, (counts.get(e.source) || 0) + 1);
        }
        if (cluster.has(e.source) && !cluster.has(e.target)) {
          counts.set(e.target, (counts.get(e.target) || 0) + 1);
        }
      }
      for (const [id, cnt] of counts.entries()) {
        if (cnt >= 2 && cluster.size < 5) {
          cluster.add(id);
          changed = true;
        }
      }
    }
  }
  const clusters = clusterGroups.map(set => {
    const nodeIds = [...set];
    let edgeCount = 0;
    for (const e of edges) {
      if (nodeIds.includes(e.source) && nodeIds.includes(e.target)) edgeCount++;
    }
    return { nodes: nodeIds, edgeCount };
  }).sort((a, b) => b.edgeCount - a.edgeCount).slice(0, 10);

  // Layers
  const layersOut = { count: layers.length, list: layers.map(l => ({ id: l.id, name: l.name, description: l.description })) };

  // Node summary index
  const nodeSummaryIndex = {};
  for (const n of nodes) {
    nodeSummaryIndex[n.id] = { name: n.name, type: n.type, summary: n.summary };
  }

  const result = {
    scriptCompleted: true,
    entryPointCandidates: topEntryCandidates,
    fanInRanking,
    fanOutRanking,
    bfsTraversal,
    nonCodeFiles,
    clusters,
    layers: layersOut,
    nodeSummaryIndex,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };

  try {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Failed to write output: ' + e.message);
    process.exit(1);
  }

  process.exit(0);
}

main();
