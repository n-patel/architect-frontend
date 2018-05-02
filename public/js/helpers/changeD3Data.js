import * as utils from './utils.js';

import { 
  NONEXISTENT, 
  TO_REMOVE, 
  REMOVED, 
  TO_ADD,
  TO_ADD_LINK, 
  TO_ADD_GROUP,
  TO_HIDE, 
  TO_UNHIDE,
  HIDDEN, 
  GROUP_MEMBER,
  TO_UNGROUP,
  TO_TOGGLE_GROUP,
  TO_COLLAPSE_GROUP
} from './matrixConstants.js';

import { 
  GROUP_HULL
} from './typeConstants.js';

// Multi-node manipulation methods
export function deleteSelectedNodes() {
  /* remove selected nodes from DOM
      if the node is a group, delete the group */

  var select = this.svg.selectAll('.node.selected');
  select.each((d) => {
    const i = this.globalNodes.indexOf(d);
    if (i <= -1) { debugger; }
    this.adjacencyMatrix[i][i] = TO_REMOVE;
  })

  this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
  this.matrixToGraph();
  this.update();
}

// Delete selected links
export function deleteSelectedLinks() {
  /* remove selected nodes from DOM
      if the node is a group, delete the group */
  var select = this.svg.selectAll('.link.selected');

  select.each((d) => {
    this.adjacencyMatrix[this.globalNodes.indexOf(d.source)][this.globalNodes.indexOf(d.target)] = TO_REMOVE;
  })

  this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
  this.node.classed("selected", false)
  this.matrixToGraph();  
  this.update();
}

export function addLink(source, target) {
  const i = this.globalNodes.indexOf(source);
  const j = this.globalNodes.indexOf(target);
  if (i === -1 || j === -1) { debugger; }
  this.adjacencyMatrix[i][i] = TO_ADD_LINK;
  this.adjacencyMatrix[i][j] = TO_ADD;
  this.matrixToGraph();  
  this.update();
}

export function selectLink(source, target) {
  const linkId = this.linkedById[source.id + ',' + target.id] || this.linkedById[target.id + ',' + source.id];
  this.link.filter((d) => { return d.id === linkId; })
    .call(this.styleLink, true);
}

export function addNodeToSelected(selection, event=null) {

  this.adjacencyMatrix = utils.addRowColumn(this.adjacencyMatrix);
  this.adjacencyMatrix[this.adjacencyMatrix.length-1][this.adjacencyMatrix.length-1] = TO_ADD;
  // For each node selected, create a link attaching the new node to the selected node
  selection
    .each((d) => {
      this.adjacencyMatrix[this.globalNodes.indexOf(d)][this.adjacencyMatrix.length-1] = TO_ADD;
    });

  // Remove highlighting of all nodes and links 
  this.node.classed('selected', false);
  this.link.call(this.styleLink, false);
  this.nodeSelection = {};
  this.matrixToGraph(event)
  this.update();
  this.fillGroupNodes();
}

export function toggleDocumentView() {
  if (this.documentsShown) { //nothing is hidden, hide them
    this.hideDocumentNodes();
  } else {
    this.showHiddenNodes();
  }
  this.matrixToGraph();
  this.update();
}

export function hideDocumentNodes() {
  var select = this.svg.selectAll('.node')
    .filter((d) => {
      if (d.type === "Document") { return d; }
    })

  this.hideNodes(select);
  this.documentsShown = false;
}

export function hideNodes(select) {
  /* remove nodes
      remove links attached to the nodes
      push all the removed nodes & links to the global list of hidden nodes and links */
    select.each((d) => {
      this.adjacencyMatrix[this.globalNodes.indexOf(d)][this.globalNodes.indexOf(d)] = TO_HIDE;
    })
}

export function showHiddenNodes() {
  /* add all hidden nodes and links back to the DOM display */
  for (var i = 0; i < this.adjacencyMatrix.length; i++) {
    if (this.adjacencyMatrix[i][i] === HIDDEN) {
      this.adjacencyMatrix[i][i] = TO_UNHIDE;
      for (var j = 0; j < this.adjacencyMatrix.length; j++) {
        if (this.adjacencyMatrix[i][j] === HIDDEN) { this.adjacencyMatrix[i][j] = TO_UNHIDE; };
        if (this.adjacencyMatrix[j][i] === HIDDEN) { this.adjacencyMatrix[j][i] = TO_UNHIDE; };   
      }
    }
  }
  this.documentsShown = true;
}

export function groupSame() {
  /* Groups all the nodes that are connected to each other with possibly_same_as */
  var select = this.svg.selectAll('.node');
  var grouped = {}; 

  // update this.sameGroups dict
  var createdGroup = {};

  select
    .each((d) => {
      if (!grouped[d.id]) { //this node is already in a same-as group
        grouped[d.id] = true;
        var groupId = this.globalnodeid;
        
        createdGroup[d.id] = { links: [], nodes: [d], id: groupId, name: d.name };

        this.createGroupFromNode(d, createdGroup[d.id], grouped); // Makes a group with d in it

        if (createdGroup[d.id].nodes.length > 1) {
          d.group = groupId;
          this.groups[groupId] = createdGroup[d.id];
          this.globalnodeid -= 1;
        }
        else {
          delete createdGroup[d.id];
        }
      }
    });

  for (var key in createdGroup) {
    // check if the property/key is defined in the object itself, not in parent
    if (createdGroup.hasOwnProperty(key)) {           
      const group_same = createdGroup[key];
      const nodes_same = createdGroup[key]['nodes'];
      nodes_same.map(node => {
        this.nodes.splice(this.nodes.indexOf(node), 1);
        }
      ); 

      this.nodes.push({ id: group_same.id, name: group_same.name, type: "same_as_group" }); //add the new node for the group
      this.moveLinksFromOldNodesToGroup(nodes_same, group_same);

      this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
      this.matrixToGraph();
      this.update();
      this.fillGroupNodes();
      this.displayGroupInfo(this.groups);
    }
  }
}

// export function groupSame() {
//   /* Groups all the nodes that are connected to each other with possibly_same_as */
//   var select = this.svg.selectAll('.node');
//   var grouped = {}; 

//   // update this.sameGroups dict
//   var createdGroup = {};

//   select
//     .each((d) => {
//       if (!grouped[d.id]) { //this node is already in a same-as group
//         grouped[d.id] = true;
//         var groupId = this.globalnodeid;
        
//         createdGroup[d.id] = { links: [], nodes: [d], id: groupId, name: d.name };

//         this.createGroupFromNode(d, createdGroup[d.id], grouped); // Makes a group with d in it

//         if (createdGroup[d.id].nodes.length > 1) {
//           d.group = groupId;
//           this.groups[groupId] = createdGroup[d.id];
//           this.globalnodeid -= 1;
//         }
//         else {
//           delete createdGroup[d.id];
//         }
//       }
//     });

//   for (var key in createdGroup) {
//     // check if the property/key is defined in the object itself, not in parent
//     if (createdGroup.hasOwnProperty(key)) {           
//       const group_same = createdGroup[key];
//       const nodes_same = createdGroup[key]['nodes'];
//       nodes_same.map(node => {
//         this.nodes.splice(this.nodes.indexOf(node), 1);
//         }
//       ); 

//       this.nodes.push({ id: group_same.id, name: group_same.name, type: "same_as_group" }); //add the new node for the group
//       this.moveLinksFromOldNodesToGroup(nodes_same, group_same);

//       this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
//       this.update();
//       this.fillGroupNodes();
//       this.displayGroupInfo(this.groups);
//     }
//   }
// }

export function groupSelectedNodes() {
  /* turn selected nodes into a new group, then delete the selected nodes and 
    move links that attached to selected nodes to link to the node of the new group instead */
  var select = this.svg.selectAll('.node.selected');
  if (select[0].length <= 1) { return; } //do nothing if nothing is selected & if there's one node

  this.adjacencyMatrix = utils.addRowColumn(this.adjacencyMatrix);
  this.adjacencyMatrix[this.adjacencyMatrix.length-1][this.adjacencyMatrix.length-1] = TO_ADD_GROUP;
  select.each((d) => {
    this.adjacencyMatrix[this.adjacencyMatrix.length-1][this.globalNodes.indexOf(d)] = GROUP_MEMBER;
  });

  this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
  this.matrixToGraph();  
  this.update();
  this.fillGroupNodes();
  this.displayGroupInfo(this.groups);
}

export function ungroupSelectedGroups() {
  /* expand nodes and links in the selected groups, then delete the group from the global groups dict */
  var select = this.svg.selectAll('.node.selected')
    .filter((d) => {
      this.adjacencyMatrix[this.globalNodes.indexOf(d)][this.globalNodes.indexOf(d)] = TO_UNGROUP;
    });

  this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
  this.node.classed('selected', false);
  this.link.call(this.styleLink, false);
  this.matrixToGraph();  
  this.update();
  this.fillGroupNodes();
  this.displayGroupInfo(this.groups);
}

export function expandGroup(d) {
  /* expand the group of the groupId passed in*/
  this.adjacencyMatrix[this.globalNodes.indexOf(d)][this.globalNodes.indexOf(d)] = TO_UNGROUP;

  // this.expandGroups(select, true);
}

export function expandGroups(select, centered = false) {
  /* bring nodes and links from a group back to the DOM, with optional centering around the node of the group's last position */
  var newNodes = [];
  select
    .each((d) => {
      this.adjacencyMatrix[this.globalNodes.indexOf(d)][this.globalNodes.indexOf(d)] = TO_UNGROUP;
    });

  // const removedNodes = this.removeNodesFromDOM(select);
  // this.removeNodeLinksFromDOM(removedNodes);
  // this.hoveredNode = null;
  // return newNodes;
}

export function collapseGroupNodes(d) {
  /* collapse nodes in a group into a single node representing the group */

  this.adjacencyMatrix[this.globalNodes.indexOf(d)][this.globalNodes.indexOf(d)] = TO_ADD_GROUP;

}

export function toggleGroupView(d) {
  /* switch between viewing the group in expanded and collapsed state.
    When expanded, the nodes in the group will have a hull polygon encircling it */
  let index = this.globalNodes.indexOf(d)

  if (!utils.isGroup(d)) { return; }
  if (this.expandedGroups[index]) {
    this.collapseGroupNodes(d);
    this.hulls.map((hull, i) => {
      if (hull.groupId === d.id) {
        this.hulls.splice(i, 1); // remove this hull from the global list of hulls
      }
    });
    this.expandedGroups[index] = false;
  } else {
    this.expandGroup(d);
    const group = this.getGroup(this.globalNodes.indexOf(d));
    this.hulls.push(this.createHull(d, group));
    this.expandedGroups[index] = true;
  }
  this.hoveredNode = null;
  this.matrixToGraph();
  this.update();
  this.fillGroupNodes();
}

//Hull functions
export function createHull(groupNode, group) {
  const nodes = this.globalNodes.filter((d, i)=> {
    if (utils.isInArray(i, group)) { return d; }
  });

  var vertices = [];
  var offset = 30; //arbitrary, the size of the node radius

  const nodeids = this.nodes.map((node) => { return node.id }); // create array of all ids in nodes
  nodes.map((d) => {
    if (utils.isInArray(d.id, nodeids)) {
      // draw a hull around a node only if it's shown on the DOM
      vertices.push(
        [d.x + offset, d.y + offset], // creates a buffer around the nodes so the hull is larger
        [d.x - offset, d.y + offset],
        [d.x - offset, d.y - offset],
        [d.x + offset, d.y - offset]
      );
    }
  });

  return { groupNode: groupNode, groupId: groupNode.id, path: d3.geom.hull(vertices), type: GROUP_HULL }; //returns a hull object
}

export function calculateAllHulls() {
  /* calculates paths of all hulls in the global hulls list */
  this.hulls.map((hull, i) => {
    const group = this.getGroup(this.globalNodes.indexOf(hull.groupNode));

    this.hulls[i] = this.createHull(hull.groupNode, group);
  });
}

export function drawHull(d) {
  return this.curve(d.path);
}
