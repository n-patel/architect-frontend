'use strict';
// FontAwesome icon unicode-to-node type dict
// Use this to find codes for FA icons: https://fontawesome.com/cheatsheet

// Uncomment below for React implementation
// import * as d3 from 'd3';
// import 'font-awesome/css/font-awesome.min.css'

const icons = {
    "person": "",
    "Document": "",
    "corporation": "",
    "group": ""
};

const maxTextLength = 20;
class Graph {

    constructor() {
        this.height = null;
        this.width = null;
        this.brushX = null;
        this.brushY = null;
        this.minScale = 0.1;
        this.gridLength = 80;
        this.numTicks = null;

        this.groups = {}; // Store groupNodeId --> {links: [], nodes: [], groupid: int}
        this.expandedGroups = {}; // Store groupNodeId --> expansion state
        this.hidden = { links: [], nodes: [] }; // Store all links and nodes that are hidden  
        this.nodeSelection = {}; // Store node.index --> selection state
        this.linkedByIndex = {}; // Store each pair of neighboring nodes
        this.isDragging = false; // Keep track of dragging to disallow node emphasis on drag
        this.isBrushing = false;
        this.isEmphasized = false; // Keep track of node emphasis to end node emphasis on drag
        this.zoomTranslate = [0, 0]; // Keep track of original zoom state to restore after right-drag
        this.zoomScale = 1;
        this.printFull = 0; // Allow user to toggle node text length

        this.node = null;
        this.link = null;
        this.hull = null;
        this.nodes = null;
        this.links = null;
        this.nodeEnter = null;
        this.globallinkid = -1;
        this.globalnodeid = -1;
        this.zoom = null;
        this.brush = null;
        this.svg = null;
        this.svgBrush = null;
        this.container = null;
        this.curve = null;
        this.svgGrid = null;
        this.force = null;

        this.ticked = this.ticked.bind(this);
        this.brushstart = this.brushstart.bind(this);
        this.brushing = this.brushing.bind(this);
        this.brushend = this.brushend.bind(this);
        this.clicked = this.clicked.bind(this);
        this.rightclicked = this.rightclicked.bind(this);
        this.dblclicked = this.dblclicked.bind(this);
        this.isRightClick = this.isRightClick.bind(this);
        this.dragstart = this.dragstart.bind(this);
        this.dragging = this.dragging.bind(this);
        this.dragend = this.dragend.bind(this);
        this.mouseover = this.mouseover.bind(this);
        this.mouseout = this.mouseout.bind(this);
        this.dragstart = this.dragstart.bind(this);
        this.dragging = this.dragging.bind(this);
        this.dragend = this.dragend.bind(this);
        this.zoomstart = this.zoomstart.bind(this);
        this.zooming = this.zooming.bind(this);
        this.zoomend = this.zoomend.bind(this);
        this.initializeZoom = this.initializeZoom.bind(this);
        this.initializeBrush = this.initializeBrush.bind(this);
        this.drawHull = this.drawHull.bind(this);

        
        // this.dragend = this.dragend.bind(this);    
    }

    initializeZoom() {
        var self = this;
        const zoom = d3.behavior.zoom()
            .scaleExtent([this.minScale, 5])
            .on('zoomstart', function (d) { self.zoomstart(d, this) })
            .on('zoom', function (d) { self.zooming(d, this) })
            .on('zoomend', function (d) { self.zoomend(d, this) });
        return zoom;
    }

    initializeBrush() {
        var self = this;
        return d3.svg.brush()
            .on('brushstart', function (d) { self.brushstart(d, this) })
            .on('brush', function (d) { self.brushing(d, this) })
            .on('brushend', function (d) { self.brushend(d, this) })
            .x(self.brushX).y(self.brushY);
    }

    // Create canvas
    initializeSVG() {
        const svg = d3.select('#graph-container').append('svg')
            .attr('id', 'canvas')
            .attr('width', this.width)
            .attr('height', this.height)
            .call(this.zoom);

        // Disable context menu from popping up on right click
        svg.on('contextmenu', function (d, i) {
            d3.event.preventDefault();
        });
        return svg;
    }

    // Normally we append a g element right after call(zoom), but in this case we don't
    // want panning to translate the brush off the screen (disabling all mouse events).
    initializeSVGBrush() {
        // Extent invisible on left click
        const svgBrush = this.svg.append('g')
            .attr('class', 'brush')
            .call(this.brush);

        this.svg.on('mousedown', () => {
            svgBrush.style('opacity', this.isRightClick() ? 1 : 0);
        });
        return svgBrush;
    }


    // We need this reference because selectAll and listener calls will refer to svg, 
    // whereas new append calls must be within the same g, in order for zoom to work.
    initializeContainer() {
        return this.svg.append('g');
    }

    //set up how to draw the hulls
    initializeCurve() {
        return d3.svg.line()
            .interpolate('cardinal-closed')
            .tension(.85);
    }


    initializeSVGgrid() {
        const svgGrid = this.container.append('g');
        svgGrid
            .append('g')
            .attr('class', 'x-ticks')
            .selectAll('line')
            .data(d3.range(0, (this.numTicks + 1) * this.gridLength, this.gridLength))
            .enter().append('line')
            .attr('x1', (d) => { return d; })
            .attr('y1', (d) => { return -1 * this.gridLength; })
            .attr('x2', (d) => { return d; })
            .attr('y2', (d) => { return (1 / this.minScale) * this.height + this.gridLength; });

        svgGrid
            .append('g')
            .attr('class', 'y-ticks')
            .selectAll('line')
            .data(d3.range(0, (this.numTicks + 1) * this.gridLength, this.gridLength))
            .enter().append('line')
            .attr('x1', (d) => { return -1 * this.gridLength; })
            .attr('y1', (d) => { return d; })
            .attr('x2', (d) => { return (1 / this.minScale) * this.width + this.gridLength; })
            .attr('y2', (d) => { return d; });
        return svgGrid;
    }

    initializeForce() {
        return d3.layout.force()
            .linkDistance(90)
            .size([this.width, this.height]);
    }
    generateNetworkCanvas(centerid, nodes, links, width, height) {
        this.width = width;
        this.height = height;
        this.brushX = d3.scale.linear().range([0, width]),
        this.brushY = d3.scale.linear().range([0, height]);

        this.numTicks = width / this.gridLength * (1 / this.minScale);

        this.zoom = this.initializeZoom();
        this.brush = this.initializeBrush();
        this.svg = this.initializeSVG();
        this.svgBrush = this.initializeSVGBrush();
        this.container = this.initializeContainer();
        this.curve = this.initializeCurve();
        this.svgGrid = this.initializeSVGgrid();
        this.force = this.initializeForce();

        this.setupKeycodes();

        this.nodes = nodes;
        this.links = links;
        this.hulls = [];
  
       // Needed this code when loading 43.json to prevent it from disappearing forever by pinning the initial node
      // var index
      //   nodes.map((node, i)=> {
      //     if (node.id===43) {
      //       index = i
      //     }
      //   })
  
      //   nodes[index].fixed = true;
      //   nodes[index].px = width/2
      //   nodes[index].py = height/2; 
  
        this.force
          .gravity(.25)
          .charge(-1 * Math.max(Math.pow(this.nodes.length, 2), 750))
          .friction(this.nodes.length < 15 ? .75 : .65)
          .alpha(.8)
          .nodes(this.nodes)
          .links(this.links);
  
        // Create selectors
        this.hull = this.container.append('g').selectAll('.hull')  
        this.link = this.container.append('g').selectAll('.link');
        this.node = this.container.append('g').selectAll('.node');
  
        // Updates nodes and links according to current data
        this.update();
  
        this.force.on('tick', (e) => {this.ticked(e, this)});
        // Avoid initial chaos and skip the wait for graph to drift back onscreen
        for (let i = 750; i > 0; --i) this.force.tick();
    }

    update() {
        var self = this;
        this.link = this.link.data(this.links, function (d) { return d.id; }); //resetting the key is important because otherwise it maps the new data to the old data in order
        this.link
            .enter().append('line')
            .attr('class', 'link')
            .style('stroke-dasharray', function (d) { return d.type === 'possibly_same_as' ? ('3,3') : false; })
            .on('mouseover', this.mouseoverLink);

        this.link.exit().remove();

        this.node = this.node.data(this.nodes, function (d) { return d.id; });
        this.nodeEnter = this.node.enter().append('g')
            .attr('class', 'node')
            .attr('dragfix', false)
            .attr('dragselect', false)
            .on('click', function (d) { self.clicked(d, this) })
            .on('dblclick', function (d) { self.dblclicked(d, this) })
            .on('mouseover', function (d) { self.mouseover(d, this) })
            .on('mouseout', function (d) { self.mouseout(d, this) })
            .classed('fixed', function (d) { return d.fixed; })
            .call(this.force.drag()
                .origin(function (d) { return d; })
                .on('dragstart', function (d) { self.dragstart(d, this) })
                .on('drag', function (d) { self.dragging(d, this) })
                .on('dragend', function (d) { self.dragend(d, this) })
            );

        this.nodeEnter.append('circle')
            .attr('r', '20');

        this.nodeEnter.append('text')
            .attr('class', 'icon')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-family', 'FontAwesome')
            .attr('font-size', '20px')
            .text(function (d) { return (d.type && icons[d.type]) ? icons[d.type] : ''; });

        this.nodeEnter.append('text')
            .attr('class', 'node-name')
            .attr('dx', 25)
            .attr('dy', '.45em')
            .text(function (d) { return processNodeName(d.name, this.printFull) })
            .on('click', this.clickedText)
            .on('mouseover', this.mouseoverText)
            .on('mouseout', this.mouseoutText)
            .call(d3.behavior.drag()
                .on('dragstart', this.dragstartText)
                .on('dragstart', this.draggingText)
                .on('dragstart', this.dragendText)
            );

        this.node.exit().remove();

        this.hull = this.hull.data(this.hulls)

        this.hull
            .enter().append('path')
            .attr('class', 'hull')
            .attr('d', this.drawHull)
            .on('dblclick', function (d) {
                self.toggleGroupView(d.groupId);
                d3.event.stopPropagation();
            })
        this.hull.exit().remove();

        this.force.start();
        this.reloadNeighbors(); // TODO: revisit this and figure out WHY d.source.index --> d.source if this is moved one line up  
    }

    // Occurs each tick of simulation
    ticked(e, self) {
        this.force.resume();
        if (!this.hull.empty()) {
            this.calculateAllHulls()
            this.hull.data(this.hulls)
                .attr('d', this.drawHull)
        }
        this.node
            .each(this.groupNodesForce(.3))
            .attr('transform', function (d) { return 'translate(' + d.x + ',' + d.y + ')'; });

        this.link.attr('x1', function (d) { return d.source.x; })
            .attr('y1', function (d) { return d.source.y; })
            .attr('x2', function (d) { return d.target.x; })
            .attr('y2', function (d) { return d.target.y; });
    }

    groupNodesForce(alpha) {
        /* custom force that takes the parent group position as the centroid and moves all the nodes near */
        return function (d) {
            if (d.group) {
                d.y += (d.cy - d.y) * alpha;
                d.x += (d.cx - d.x) * alpha;
            }
        }
    }

    // Click-drag node selection
    brushstart() {
        this.isBrushing = true;
    }

    brushing() {
        var self = this;
        if (this.isRightClick()) {
            const extent = this.brush.extent();
            this.svg.selectAll('.node')
                .classed('selected', function (d) {
                    const xPos = self.brushX.invert(d.x * self.zoomScale + self.zoomTranslate[0]);
                    const yPos = self.brushY.invert(d.y * self.zoomScale + self.zoomTranslate[1]);
                    const selected = (extent[0][0] <= xPos && xPos <= extent[1][0]
                        && extent[0][1] <= yPos && yPos <= extent[1][1])
                        || (this.classList.contains('selected') && d3.event.sourceEvent.ctrlKey);
                    self.nodeSelection[d.index] = selected;
                    return selected;
                });

            this.highlightLinksFromAllNodes();
        }
    }
    brushend() {
        this.brush.clear();
        this.svg.selectAll('.brush').call(this.brush);
        this.isBrushing = false;
    }

    // Single-node interactions
    clicked(d, self, i) {
        if (d3.event.defaultPrevented) return;
        const node = d3.select(self);
        const fixed = !(node.attr('dragfix') == 'true');
        node.classed('fixed', d.fixed = fixed);
        this.force.resume();
        d3.event.stopPropagation();
    }

    rightclicked(node, d) {
        const fixed = node.attr('dragfix') == 'true';
        const selected = !(node.attr('dragselect') == 'true');
        node.classed('fixed', d.fixed = fixed)
            .classed('selected', this.nodeSelection[d.index] = selected);
        this.highlightLinksFromNode(node[0]);
        this.force.resume();
    }

    dblclicked(d, self) {
        if (this.groups[d.id]) {
            this.toggleGroupView(d.id);
        }

        d3.event.stopPropagation();
    }

    // Click helper
    isRightClick() {
        return (d3.event && (d3.event.which == 3 || d3.event.button == 2))
            || (d3.event.sourceEvent && (d3.event.sourceEvent.which == 3 || d3.event.sourceEvent.button == 2));
    }

    // Click-drag node interactions
    dragstart(d, self) {
        d3.event.sourceEvent.preventDefault();
        d3.event.sourceEvent.stopPropagation();
        if (this.isEmphasized) this.resetGraphOpacity();

        this.isDragging = true;
        // displayNodeInfo(d);
        const node = d3.select(self);
        node
            .attr('dragfix', node.classed('fixed'))
            .attr('dragselect', node.classed('selected'))
            .attr('dragdistance', 0);

        node.classed('fixed', d.fixed = true);
        if (this.isRightClick()) {
            node.classed('selected', this.nodeSelection[d.index] = true);
            this.highlightLinksFromNode(node[0]);
        }
    }

    dragging(d, self) {
        const node = d3.select(self);
        node
            .attr('cx', d.x = d3.event.x)
            .attr('cy', d.y = d3.event.y)
            .attr('dragdistance', parseInt(node.attr('dragdistance')) + 1);
    }

    dragend(d, self) {
        const node = d3.select(self);
        if (!parseInt(node.attr('dragdistance')) && this.isRightClick()) {
            this.rightclicked(node, d);
        }

        this.isDragging = false;
        this.force.resume();
    }

    // Node emphasis
    mouseover(d, self) {
        var classThis = this;
        if (!this.isDragging && !this.isBrushing) {
            this.isEmphasized = true;
            this.node
                .filter(function (o) {
                    return !classThis.neighbors(d, o);
                })
                .style('stroke-opacity', .15)
                .style('fill-opacity', .15);
            // .select('.node-name')
            //   .text(function(d) { return processNodeName(d.name, 1); });

            this.link.style('stroke-opacity', function (o) {
                return (o.source == d || o.target == d) ? 1 : .05;
            });
            if (this.printFull == 0) d3.select(self).select('.node-name').text(processNodeName(d.name, 2));
        }
    }

    mouseout(d, self) {
        this.resetGraphOpacity();
        if (this.printFull != 1) d3.select(self).select('.node-name').text(function (d) { return processNodeName(d.name, this.printFull); });
    }

    // Zoom & pan
    zoomstart(d, self) {
        const e = d3.event;
        if (this.isRightClick()) {
            this.zoomTranslate = this.zoom.translate();
            this.zoomScale = this.zoom.scale();
        }
    }

    zooming(d, self) {
        if (!this.isRightClick()) {
            const e = d3.event;
            const transform = 'translate(' + (((e.translate[0] / e.scale) % this.gridLength) - e.translate[0] / e.scale)
                + ',' + (((e.translate[1] / e.scale) % this.gridLength) - e.translate[1] / e.scale) + ')scale(' + 1 + ')';
            this.svgGrid.attr('transform', transform);
            this.container.attr('transform', 'translate(' + e.translate + ')scale(' + e.scale + ')');
        }
    }

    zoomend(d, self) {
        this.svg.attr('cursor', 'move');
        if (this.isRightClick()) {
            this.zoom.translate(this.zoomTranslate);
            this.zoom.scale(this.zoomScale);
        }

        this.zoomTranslate = this.zoom.translate();
        this.zoomScale = this.zoom.scale();
    }

    // Link mouse handlers
    mouseoverLink(d) {
        // displayLinkInfo(d);
    }

    // Node text mouse handlers
    clickedText(d, i) {
        d3.event.stopPropagation();
    }

    dragstartText(d) {
        d3.event.sourceEvent.stopPropagation();
    }

    draggingText(d) {
        d3.event.sourceEvent.stopPropagation();
    }

    dragendText(d) {
        d3.event.sourceEvent.stopPropagation();
    }

    mouseoverText(d) {
        if (this.printFull == 0 && !this.isBrushing && !this.isDragging) {
            d3.select(this).text(processNodeName(d.name, 2));
        }

        d3.event.stopPropagation();
    }

    mouseoutText(d) {
        if (this.printFull == 0 && !this.isBrushing && !this.isDragging) {
            d3.select(this).text(processNodeName(d.name, 0));
        }

        d3.event.stopPropagation();
    }

    // Graph manipulation keycodes
    setupKeycodes() {
        var self = this;
        d3.select('body')
            .on('keydown', function () {
                // u: Unpin selected nodes
                if (d3.event.keyCode == 85) {
                    self.svg.selectAll('.node.selected')
                        .each(function (d) { d.fixed = false; })
                        .classed('fixed', false);
                }

                // e: Remove links
                else if (d3.event.keyCode == 69) {
                    self.deleteSelectedLinks();
                }

                // g: Group selected nodes
                else if (d3.event.keyCode == 71) {
                    self.groupSelectedNodes();
                }

                // h: Ungroup selected nodes
                else if (d3.event.keyCode == 72) {
                    self.ungroupSelectedGroups();
                }

                // r: Remove selected nodes
                else if (d3.event.keyCode == 82 || d3.event.keyCode == 46) {
                    self.deleteSelectedNodes();
                }

                // a: Add node linked to selected
                else if (d3.event.keyCode == 65) {
                    self.addNodeToSelected();
                }

                // d: Hide document nodes
                else if (d3.event.keyCode == 68) {
                    self.toggleDocumentView();
                }

                // p: Toggle btwn full/abbrev text
                else if (d3.event.keyCode == 80) {
                    self.printFull = (self.printFull + 1) % 3;
                    self.selectAllNodeNames().text(function (d) { return processNodeName(d.name, self.printFull); });
                }

                self.force.resume()
            });
    }

    // Link highlighting
    highlightLinksFromAllNodes() {
        var self = this;
        this.svg.selectAll('.link')
            .classed('selected', function (d, i) {
                return self.nodeSelection[d.source.index] && self.nodeSelection[d.target.index];
            });
    }

    highlightLinksFromNode(node) {
        var self = this;
        node = node[0].__data__.index;
        this.svg.selectAll('.link')
            .filter(function (d, i) {
                return d.source.index == node || d.target.index == node;
            })
            .classed('selected', function (d, i) {
                return self.nodeSelection[d.source.index] && self.nodeSelection[d.target.index];
            });
    }

    // Multi-node manipulation methods
    deleteSelectedNodes() {
        /* remove selected nodes from DOM
            if the node is a group, delete the group */
        var self = this;

        var groupIds = Object.keys(this.groups);
        var select = this.svg.selectAll('.node.selected');
        let group;

        var removedNodes = this.removeNodesFromDOM(select);
        var removedLinks = this.removeNodeLinksFromDOM(removedNodes);

        removedLinks.map((link) => { //remove links from their corresponding group
            if (link.target.group) {
                group = self.groups[link.target.group];
                group.links.splice(group.links.indexOf(link), 1);
            } if (link.source.group) {
                group = self.groups[link.source.group];
                group.links.splice(group.links.indexOf(link), 1);
            }
        });

        removedNodes.map((node) => {// remove nodes from their corresponding group & if the node is a group delete the group
            if (isInArray(node.id, groupIds)) {
                delete this.groups[node.id];
            }
            if (node.group) {
                group = this.groups[node.group];
                group.nodes.splice(group.nodes.indexOf(node), 1);
            }
        });

        this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
        this.update();
    }

    // Delete selected links
    deleteSelectedLinks() {
        /* remove selected nodes from DOM
            if the node is a group, delete the group */
        var groupIds = Object.keys(this.groups);
        var select = this.svg.selectAll('.node.selected');
        let group;

        var removedLinks = this.removeNodeLinksSelectiveFromDOM(select);

        removedLinks.map((link) => { //remove links from their corresponding group
            if (link.target.group) {
                group = this.groups[link.target.group];
                group.links.splice(group.links.indexOf(link), 1);
            } if (link.source.group) {
                group = this.groups[link.source.group];
                group.links.splice(group.links.indexOf(link), 1);
            }
        });

        this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
        this.node.classed("selected", false)
        this.update();
    }

    addNodeToSelected() {
        /* create a new node using the globalnodeid counter
          for each node selected, create a link attaching the new node to the selected node
          remove highlighting of all nodes and links */
        const nodeid = this.globalnodeid;
        const newnode = { id: nodeid, name: `Node ${-1 * nodeid}`, type: "Custom" };
        var select = this.svg.selectAll('.node.selected');
        if (select[0].length === 0) { return; } //if nothing is selected, don't add a node for now because it flies away

        this.globalnodeid -= 1;
        this.nodes.push(newnode);

        select
            .each((d) => {
                this.links.push({ id: this.globallinkid, source: this.nodes.length - 1, target: this.nodes.indexOf(d), type: "Custom" });
                this.globallinkid -= 1;
            })

        this.node.classed("selected", false);
        this.link.classed("selected", false);
        this.nodeSelection = {};
        this.update();
    }

    toggleDocumentView() {
        if (this.hidden.links.length === 0 && this.hidden.nodes.length === 0) { //nothing is hidden, hide them
            this.hideDocumentNodes();
        } else {
            this.showHiddenNodes();
        }
        this.update();
    }

    hideDocumentNodes() {
        var select = this.svg.selectAll('.node')
            .filter((d) => {
                if (d.type === "Document") { return d; }
            })

        this.hideNodes(select);
    }

    hideNodes(select) {
        /* remove nodes
            remove links attached to the nodes
            push all the removed nodes & links to the global list of hidden nodes and links */

        const removedNodes = this.removeNodesFromDOM(select);
        const removedLinks = this.removeNodeLinksFromDOM(removedNodes);
        removedNodes.map((node) => {
            this.hidden.nodes.push(node)
        });
        removedLinks.map((link) => {
            this.hidden.links.push(link)
        });
    }

    showHiddenNodes() {
        /* add all hidden nodes and links back to the DOM display */

        this.hidden.nodes.slice().map((node) => { this.nodes.push(node); });
        this.hidden.links.slice().map((link) => { this.links.push(link); });

        this.hidden.links = [];
        this.hidden.nodes = [];
    }

    groupSelectedNodes() {
        /* turn selected nodes into a new group, then delete the selected nodes and 
          move links that attached to selected nodes to link to the node of the new group instead */
        var select = this.svg.selectAll('.node.selected');

        if (select[0].length <= 1) { return; } //do nothing if nothing is selected & if there's one node

        const group = this.createGroupFromSelect(select);
        const removedNodes = this.removeNodesFromDOM(select);
        this.nodes.push({ id: group.id, name: `Group ${-1 * group.id}`, type: "group" }); //add the new node for the group
        this.moveLinksFromOldNodesToGroup(removedNodes, group);

        select.each((d) => { delete this.groups[d.id]; });
        // delete any groups that were selected AFTER all nodes & links are deleted
        // and properly inserted into the global variable entry for the new group

        this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
        this.update();
        this.fillGroupNodes();
        // displayGroupInfo(this.groups);
    }

    ungroupSelectedGroups() {
        /* expand nodes and links in the selected groups, then delete the group from the global groups dict */
        var self = this;
        var select = this.svg.selectAll('.node.selected')
            .filter((d) => {
                if (self.groups[d.id]) { return d; }
            });

        const newNodes = this.expandGroups(select, false);
        newNodes.map((node) => { node.group = null }); //these nodes no longer have a group
        select.each((d) => { delete this.groups[d.id]; }); //delete this group from the global groups 

        this.nodeSelection = {}; //reset to an empty dictionary because items have been removed, and now nothing is selected
        this.node.classed("selected", false)
        this.update();
        //displayGroupInfo(this.groups);
    }

    expandGroup(groupId) {
        /* expand the group of the groupId passed in*/
        var self = this;
        var select = this.svg.selectAll('.node')
            .filter((d) => {
                if (d.id === groupId && self.groups[d.id]) { return d; }
            });

        this.expandGroups(select, true);
    }

    expandGroups(select, centered = false) {
        /* bring nodes and links from a group back to the DOM, with optional centering around the node of the group's last position */
        var newNodes = [];
        select
            .each((d) => {
                const group = this.groups[d.id];
                if (group) {
                    group.nodes.map((node) => {
                        if (centered) {
                            group.fixedX = d.x; //store the coordinates of the group node
                            group.fixedY = d.y;
                            const offset = .5 * 45 * Math.sqrt(group.nodes.length); // math to make the total area of the hull equal to 15*15 per node
                            const xboundlower = group.fixedX - offset;
                            const yboundlower = group.fixedY - offset;

                            node.x = node.px = Math.floor(Math.random() * offset * 2) + xboundlower;
                            node.y = node.py = Math.floor(Math.random() * offset * 2) + yboundlower;
                            node.cx = group.fixedX;
                            node.cy = group.fixedY;
                            //node.fixed = true;  
                        }
                        newNodes.push(node);
                        this.nodes.push(node); //add all nodes in the group to global nodes
                    });
                    group.links.map((link) => {
                        this.links.push(link); //add all links in the group to global links
                    });
                }
            });

        const removedNodes = this.removeNodesFromDOM(select);
        this.removeNodeLinksFromDOM(removedNodes);
        return newNodes;
    }

    collapseGroupNodes(groupId) {
        /* collapse nodes in a group into a single node representing the group */
        const group = this.groups[groupId];
        const groupNodeIds = group.nodes.map((node) => { return node.id; });

        var select = this.svg.selectAll('.node')
            .filter((d) => {
                if (isInArray(d.id, groupNodeIds)) { return d; }
            });

        const removedNodes = this.removeNodesFromDOM(select);
        this.nodes.push({ id: group.id, name: `Group ${-1 * group.id}`, type: 'group' }); //add the new node for the group
        this.moveLinksFromOldNodesToGroup(removedNodes, group);
    }

    toggleGroupView(groupId) {
        /* switch between viewing the group in expanded and collapsed state.
          When expanded, the nodes in the group will have a hull polygon encircling it */
        const self = this;
        const group = this.groups[groupId];

        if (!group) {
            console.log("error, the group doesn't exist even when it should: ", groupId);
        }

        if (this.expandedGroups[groupId]) {
            this.collapseGroupNodes(groupId);
            this.hulls.map((hull, i) => {
                if (hull.groupId === groupId) {
                    self.hulls.splice(i, 1); // remove this hull from the global list of hulls
                }
            })
            this.expandedGroups[groupId] = false;
        } else {
            this.expandGroup(groupId);
            this.hulls.push(this.createHull(group));
            this.expandedGroups[groupId] = true;
        }

        this.update();
        this.fillGroupNodes();
    }

    //Hull functions
    createHull(group) {
        var vertices = [];
        var offset = 20; //arbitrary, the size of the node radius
        group.nodes.map(function (d) {
            vertices.push(
                [d.x + offset, d.y + offset], // creates a buffer around the nodes so the hull is larger
                [d.x - offset, d.y + offset],
                [d.x - offset, d.y - offset],
                [d.x + offset, d.y - offset]
            );
        });

        return { groupId: group.id, path: d3.geom.hull(vertices) }; //returns a hull object
    }

    calculateAllHulls() {
        /* calculates paths of all hulls in the global hulls list */
        var self = this;
        this.hulls.map((hull, i) => {
            self.hulls[i] = self.createHull(self.groups[hull.groupId]);
        });
    }

    drawHull(d) {
        return this.curve(d.path);
    }

    // =================
    // SELECTION METHODS
    // =================

    // Get all node text elements
    selectAllNodeNames() {
        return d3.selectAll('text')
            .filter(function (d) { return d3.select(this).classed('node-name'); });
    }



    // Determine if neighboring nodes
    neighbors(a, b) {
        return this.linkedByIndex[a.index + ',' + b.index]
            || this.linkedByIndex[b.index + ',' + a.index]
            || a.index == b.index;
    }

    reloadNeighbors() {
        this.linkedByIndex = {};
        var self = this;
        this.links.forEach(function (d) {
            self.linkedByIndex[d.source.index + "," + d.target.index] = true;
        });
    }

    removeLink(removedNodes, link) {
        /* takes in a list of removed nodes and the link to be removed
            if the one of the nodes in the link target or source has actually been removed, remove the link and return it
            if not, then don't remove */
        let removedLink;
        //only remove a link if it's attached to a removed node
        if (removedNodes[link.source.id] === true || removedNodes[link.target.id] === true) { //remove all links connected to a node to remove
            const index = this.links.indexOf(link);
            removedLink = this.links.splice(index, 1)[0];
        }

        return removedLink;
    }

    removeSelectiveLink(nodesSelected, link) {
        /* takes in a list of removed nodes and the link to be removed
            if both of the nodes in the link target or source are in the list, remove the link and return it
            if not, then don't remove */
        let removedLink;
        if (nodesSelected[link.source.id] === true && nodesSelected[link.target.id] === true) { //remove all links connected to both nodes to remove
            const index = this.links.indexOf(link);
            removedLink = this.links.splice(index, 1)[0];
        }

        return removedLink;
    }

    reattachLink(link, newNodeId, removedNodes, nodeIdsToIndex) {
        /* takes in a link, id of the new nodes, and a dict mapping ids of removed nodes to state
            depending on whether the link source or target will be newNodeId,
            create a new link with appropriate source/target mapping to index of the node
            if neither the source nor target were in removedNodes, do nothing */
        let linkid = this.globallinkid;
        if (removedNodes[link.source.id] === true && removedNodes[link.target.id] !== true) {
            //add new links with appropriate connection to the new group node
            //source and target refer to the index of the node
            this.links.push({ id: linkid, source: nodeIdsToIndex[newNodeId], target: nodeIdsToIndex[link.target.id], type: 'multiple' });
            this.globallinkid -= 1;
        } else if (removedNodes[link.source.id] !== true && removedNodes[link.target.id] === true) {
            this.links.push({ id: linkid, source: nodeIdsToIndex[link.source.id], target: nodeIdsToIndex[newNodeId], type: 'multiple' });
            this.globallinkid -= 1;
        }
    }

    moveLinksFromOldNodesToGroup(removedNodes, group, ) {
        /* takes in an array of removedNodes and a group
          removes links attached to these nodes
          if the removed link was already attached to a group, don't add that link to the group's list of links 
          (because we're not adding that node to the group's list of nodes)
          if else, add that link to the group's list of links
          then reattach the link */

        var self = this;
        const removedNodesDict = {};
        const nodeIdsToIndex = {};
        const existingLinks = {};

        removedNodes.map((node) => {
            removedNodesDict[node.id] = true;
        });

        this.nodes.map((node, i) => {
            nodeIdsToIndex[node.id] = i; //map all nodeIds to their new index
        });
        group.links.map((link) => {
            existingLinks[link.target.id + ',' + link.source.id] = true;
        })

        this.links.slice().map((link) => {
            const removedLink = self.removeLink(removedNodesDict, link);
            if (removedLink) {
                const groupids = Object.keys(self.groups).map((key) => { return parseInt(key); });
                if (isInArray(link.target.id, groupids) || isInArray(link.source.id, groupids)) {
                    // do nothing if the removed link was attached to a group
                } else if (existingLinks[link.target.id + ',' + link.source.id]) {
                    //do nothing if the link already exists in the group, i.e. if you're expanding
                } else {
                    group.links.push(removedLink);
                }
                self.reattachLink(link, group.id, removedNodesDict, nodeIdsToIndex);
            }
        });
    }


    removeNodesFromDOM(select) {
        /* iterates through a select to remove each node, and returns an array of removed nodes */

        var self = this;
        const removedNodes = []
        select
            .each((d) => {
                if (self.nodes.indexOf(d) === -1) {
                    console.log("Error, wasn't in there and node is: ", d, " and nodes is: ", self.nodes);
                } else {
                    removedNodes.push(d);
                    self.nodes.splice(self.nodes.indexOf(d), 1);
                }
            });

        return removedNodes
    }

    removeNodeLinksFromDOM(removedNodes) {
        /* takes in an array of nodes and removes links associated with any of them
            returns an arry of removed links */
        const removedLinks = [];
        let removedLink;
        const removedNodesDict = {};

        removedNodes.map((node) => {
            removedNodesDict[node.id] = true;
        })

        this.links.slice().map((link) => {
            removedLink = this.removeLink(removedNodesDict, link);
            if (removedLink) {
                removedLinks.push(removedLink);
            }
        });

        return removedLinks;
    }

    removeNodeLinksSelectiveFromDOM(select) {
        /* iterates through select to gather list of nodes selected, and removes
            link if both of its endpoint nodes are selected */

        const nodesSelected = []
        select
            .each((d) => {
                if (this.nodes.indexOf(d) === -1) {
                    console.log("Error, wasn't in there and node is: ", d, " and nodes is: ", this.nodes);
                } else {
                    nodesSelected.push(d);
                }
            });

        const removedLinks = [];
        let removedLink;
        const nodesDict = {};

        nodesSelected.map((node) => {
            nodesDict[node.id] = true;
        })

        this.links.slice().map((link) => {
            removedLink = this.removeSelectiveLink(nodesDict, link);
            if (removedLink) {
                removedLinks.push(removedLink);
            }
        });

        return removedLinks;
    }

    createGroupFromSelect(select) {
        /* iterates through the items in select to create a new group with proper links and nodes stored.
            if a node in the select is already a group, takes the nodes and links from that group and puts it in
            the new group */

        const groupId = this.globalnodeid;
        const group = this.groups[groupId] = { links: [], nodes: [], id: groupId }; //initialize empty array to hold the nodes

        select
            .each((d) => {
                if (this.groups[d.id]) { //this node is already a group
                    var newNodes = this.groups[d.id].nodes;
                    var newLinks = this.groups[d.id].links;
                    newNodes.map((node) => {
                        group.nodes.push(node); //add each of the nodes in the old group to the list of nodes in the new group        
                    });
                    newLinks.map((link) => {
                        group.links.push(link); //add all the links inside the old group to the new group
                    });
                } else {
                    d.group = groupId;
                    group.nodes.push(d); //add this node to the list of nodes in the group
                }
            });

        this.globalnodeid -= 1;
        return group;
    }

    // Fill group nodes blue
    fillGroupNodes() {
        this.svg.selectAll('.node')
            .classed('grouped', function (d) { return d.id < 0; });
    }

    // Reset all node/link opacities to 1
    resetGraphOpacity() {
        this.isEmphasized = false;
        this.node.style('stroke-opacity', 1)
            .style('fill-opacity', 1);
        this.link.style('stroke-opacity', 1);
    }
}

// =================
// DEBUGGING METHODS
// =================

// Sleep for duration ms
function sleep(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}

function isObject(input) {
    return input !== null && typeof input === 'object';
}

function printObject(object) {
    console.log(JSON.stringify(object, null, 4));
}

// ==============
// HELPER METHODS
// ==============

function isInArray(value, array) {
    return array.indexOf(value) > -1;
}
// Normalize node text to same casing conventions and length
// printFull states - 0: abbrev, 1: none, 2: full
function processNodeName(str, printFull) {
    if (!str || printFull == 1) {
        return '';
    }

    // Length truncation
    str = str.trim();
    if (str.length > maxTextLength && printFull == 0) {
        str = `${str.slice(0, maxTextLength).trim()}...`;
    }

    // Capitalization
    const delims = [' ', '.', '('];
    for (let i = 0; i < delims.length; i++) {
        str = splitAndCapitalize(str, delims[i]);
    }

    return str;
}

function splitAndCapitalize(str, splitChar) {
    let tokens = str.split(splitChar);
    tokens = tokens.map(function (token, idx) {
        return capitalize(token, splitChar == ' ');
    });

    return tokens.join(splitChar);
}

function capitalize(str, first) {
    return str.charAt(0).toUpperCase() + (first ? str.slice(1).toLowerCase() : str.slice(1));
}

// Uncomment below for React implementation
// export default Graph;
