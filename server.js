const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/bfhl", (req, res) => {

    const input = req.body.data || [];

    const validEdges = [];
    const invalidEntries = [];
    const duplicateEdges = [];

    const seenEdges = new Set();
    const childParent = new Map();

   
    input.forEach(raw => {
        const edge = raw.trim();

        if (!/^[A-Z]->[A-Z]$/.test(edge) || edge[0] === edge[3]) {
            invalidEntries.push(edge);
            return;
        }

        if (seenEdges.has(edge)) {
            if (!duplicateEdges.includes(edge)) {
                duplicateEdges.push(edge);
            }
            return;
        }

        const [parent, child] = edge.split("->");

      
        if (childParent.has(child)) return;

        childParent.set(child, parent);
        seenEdges.add(edge);
        validEdges.push(edge);
    });

    
    const graph = {};
    const allNodes = new Set();

    validEdges.forEach(edge => {
        const [p, c] = edge.split("->");

        if (!graph[p]) graph[p] = [];
        if (!graph[c]) graph[c] = [];

        graph[p].push(c);

        allNodes.add(p);
        allNodes.add(c);
    });

   
    Object.keys(graph).forEach(node => graph[node].sort());

    const visitedGlobal = new Set();
    const hierarchies = [];

    function getComponent(start) {
        const stack = [start];
        const component = new Set();

        while (stack.length) {
            const node = stack.pop();

            if (!component.has(node)) {
                component.add(node);

                graph[node].forEach(n => stack.push(n));

                for (let key in graph) {
                    if (graph[key].includes(node)) {
                        stack.push(key);
                    }
                }
            }
        }

        return component;
    }

    function hasCycleDFS(node, visited, path) {
        if (!visited.has(node)) {
            visited.add(node);
            path.add(node);

            for (let child of graph[node]) {
                if (!visited.has(child) && hasCycleDFS(child, visited, path)) {
                    return true;
                }
                if (path.has(child)) return true;
            }
        }

        path.delete(node);
        return false;
    }




    function buildTree(node) {

        
        const result = {};
        result[node] = {};

        graph[node].forEach(child => {
            Object.assign(result[node], buildTree(child));
        });

        return result;
    }

    function calculateDepth(node) {
        if (graph[node].length === 0) return 1;
        return 1 + Math.max(...graph[node].map(calculateDepth));
    }

    for (let node of allNodes) {
        if (visitedGlobal.has(node)) continue;

        const component = getComponent(node);
        component.forEach(n => visitedGlobal.add(n));

        const nodesArray = [...component];

        const childSet = new Set();
        nodesArray.forEach(n => {
            graph[n].forEach(c => childSet.add(c));
        });

        const possibleRoots = nodesArray.filter(n => !childSet.has(n));
        const root = possibleRoots.length
            ? possibleRoots.sort()[0]
            : nodesArray.sort()[0];

        let cycleExists = false;
        const visited = new Set();

        for (let n of nodesArray) {
            if (!visited.has(n)) {
                if (hasCycleDFS(n, visited, new Set())) {
                    cycleExists = true;
                    break;
                }
            }
        }

        if (cycleExists) {
            hierarchies.push({
                root,
                tree: {},
                has_cycle: true
            });
        } else {
            const tree = buildTree(root);
            const depth = calculateDepth(root);

            hierarchies.push({
                root,
                tree,
                depth
            });
        }
    }

    const totalTrees = hierarchies.filter(h => !h.has_cycle).length;
    const totalCycles = hierarchies.filter(h => h.has_cycle).length;

    const largestTree = hierarchies
        .filter(h => !h.has_cycle)
        .sort((a, b) => b.depth - a.depth || a.root.localeCompare(b.root))[0];

    res.json({
        user_id: "Praveen_Kumar_Arella_23082005",
        email_id: "praveenkumar_arella@srmap.edu.in",
        college_roll_number: "AP23110011295",
        hierarchies,
        invalid_entries: invalidEntries,
        duplicate_edges: duplicateEdges,
        summary: {
            total_trees: totalTrees,
            total_cycles: totalCycles,
            largest_tree_root: largestTree ? largestTree.root : null
        }
    });

});

app.listen(7783, () => {
    console.log("Server running on port 7783");
});