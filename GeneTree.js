/*! GeneTree */
/* config = {
 *     fields: [ 'name', 'born', 'died', 'married', 'notes' ],
 *     levelSeparation: 35,
 *     partnerNodeSeparation: 20,
 *     siblingSeparation: 25,
 *     subtreeSeparation: 100,
 *     template: {
 *         width:  width,
 *         height: height,
 *         node:  '<rect x="0" y="0" height="'+ height +'" width="'+ width +'" stroke-width="1" fill="#f7f5e9" stroke="rgb(78,61,50)" rx="3" ry="3"></rect>',
 *         fields: {
 *             name:    '<text style="font-size: 16px;" fill="rgb(78,61,50)" x="'+ (width/2) +'" y="20" text-anchor="middle">{val}</text>',
 *             born:    '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="10" y="60" text-anchor="start">b. {val}</text>',
 *             died:    '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="'+ (width-10) +'" y="60" text-anchor="end">d. {val}</text>',
 *             married: '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="'+ (width/2) +'" y="40" text-anchor="middle">m. {val}</text>',
 *             notes:   '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="'+ (width/2) +'" y="'+ (height+15) +'" text-anchor="middle">({val})</text>'
 *         }
 *     },
 *     nodes
 * }
 */
class GeneTree {
    defaultFields = ['name', 'born', 'died', 'married', 'notes'];
    defaultWidth    = 200;
    defaultHeight   = 50;
    defaultTemplate = {
        width:  this.defaultWidth,
        height: this.defaultHeight,
        node:  '<rect x="0" y="0" height="'+ this.defaultHeight +'" width="'+ this.defaultWidth +'" stroke-width="1" fill="#f7f5e9" stroke="rgb(78,61,50)" rx="3" ry="3"></rect>',
        fields: {
            name:    '<text style="font-size: 16px;" fill="rgb(78,61,50)" x="'+ (this.defaultWidth/2) +'" y="20" text-anchor="middle">{val}</text>',
            born:    '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="10" y="60" text-anchor="start">b. {val}</text>',
            died:    '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="'+ (this.defaultWidth-10) +'" y="60" text-anchor="end">d. {val}</text>',
            married: '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="'+ (this.defaultWidth/2) +'" y="40" text-anchor="middle">m. {val}</text>',
            notes:   '<text style="font-size: 12px;" fill="rgb(145,131,121)" x="'+ (this.defaultWidth/2) +'" y="'+ (this.defaultHeight+15) +'" text-anchor="middle">({val})</text>'
        }
    };
    constructor (container, config) {
        let nodes_by_id = {},
            pairings    = {},
            root;

        this.container             = container;
        this.fields                = config && config.fields || this.defaultFields;
        this.levelSeparation       = config && config.levelSeparation || 0;
        // this.partnerNodeSeparation = config && config.partnerNodeSeparation || 0;
        this.siblingSeparation     = config && config.siblingSeparation || 0;
        // this.subtreeSeparation     = config && config.subtreeSeparation || 0;
        this.template              = Object.assign({}, this.defaultTemplate, config && config.template || {});
        this.nodes                 = (config && _isArray(config.nodes) ? config.nodes : []).map((node) => { let n = _clone(node); nodes_by_id[n.id] = n; return n; });

        // process the nodes (the node with the lowest ID is the initial root for calculating y values)
        this.nodes.sort(_IDSorter);
        root = this.nodes.find((n) => { return !!n.root; }) || this.nodes[0];
        
        // add parent & partner pairing references
        this.nodes.forEach((node) => {
            if (node.mother_id) node.mother = nodes_by_id[node.mother_id];
            if (node.father_id) node.father = nodes_by_id[node.father_id];
            if (node.partner_ids) {
                if (!node.partners) node.partners = [];
                node.partner_ids.forEach((p_id) => {
                    let p_node  = nodes_by_id[p_id],
                        pairing = pairings[node.id +'-'+ p_id] || pairings[p_id +'-'+ node.id];
                    if (!pairing) pairings[node.id +'-'+ p_id] = { partner_1:node, partner_2:p_node, children:[] };
                    if (!node.partners.includes(p_node)) node.partners.push(p_node);
                });
            }
            if (node.unattached_ids) {
                if (!node.unattached) node.unattached = [];
                node.unattached_ids.forEach((u_id) => {
                    let u_node = nodes_by_id[u_id];
                    if (!node.unattached.includes(u_node)) node.unattached.push(u_node);
                });
            }
        });
        
        // add children references
        this.nodes.forEach((node) => {
            if (node.father && node.mother) {
                let pairing = pairings[node.father.id +'-'+ node.mother.id] || pairings[node.mother.id +'-'+ node.father.id];
                if (!pairing.children) pairing.children = [];
                pairing.children.push(node);
            }
            else if (node.father && !node.mother) {
                if (!node.father.children) node.father.children = [];
                node.father.children.push(node);
            }
            else if (!node.father && node.mother) {
                if (!node.mother.children) node.mother.children = [];
                node.mother.children.push(node);
            }
        });

        // Y VALUES
        // ---------------
        // walk the tree and give each node a y value
        let low_y  = Number.POSITIVE_INFINITY, // track the lowest seen y value
            curr_y = 0,
            stack  = [root];
        while (stack.length) {
            let n = stack.slice(-1)[0];
            if (null == n.y) {
                n.y = curr_y;
                low_y = Math.min(low_y, curr_y);
            }
            if (!n.traversals) n.traversals = [];
            // traverse up to father: if we haven't traversed there before and if it's not in the stack (we didn't come from there)
            if (n.father && !n.traversals.includes(n.father.id) && !stack.includes(n.father)) {
                n.traversals.push(n.father.id);
                stack.push(n.father);
                --curr_y;
                continue;
            }
            // traverse up to mother: if we haven't traversed there before and if it's not in the stack (we didn't come from there)
            if (n.mother && !n.traversals.includes(n.mother.id) && !stack.includes(n.mother)) {
                n.traversals.push(n.mother.id);
                stack.push(n.mother);
                --curr_y;
                continue
            }
            // traverse down to a child not with a partner
            if (n.children) {
                let c = n.children.find((c) => { return !!c && !n.traversals.includes(c.id) && !stack.includes(c); });
                if (c) {
                    n.traversals.push(c.id);
                    stack.push(c);
                    ++curr_y;
                    continue;
                }
            }
            // traverse over to a partner: if we haven't traversed there before and if it's not in the stack (we didn't come from there)
            if (n.partners) {
                let p = n.partners.find((p) => { return !!p && !n.traversals.includes(p.id) && !stack.includes(p); });
                if (p) {
                    n.traversals.push(p.id);
                    stack.push(p);
                    continue;
                }
                // all partners have been traversed, so traverse down to a pairing child
                let c;
                n.partners.some((p) => {
                    if (!p) return false;
                    let pairing = pairings[n.id +'-'+ p.id] || pairings[p.id +'-'+ n.id];
                    if (pairing && pairing.children) {
                        c = pairing.children.find((c) => { return !!c && !n.traversals.includes(c.id) && !p.traversals.includes(c.id) && !stack.includes(c); });
                    }
                    if (c) {
                        n.traversals.push(c.id);
                        p.traversals.push(c.id);
                        return true;
                    }
                });
                if (c) {
                    stack.push(c);
                    ++curr_y;
                    continue;
                }
            }
            // nowhere to go? Go back down the stack
            stack.pop();
            curr_y = ((stack.slice(-1) || [])[0] || {}).y;
        }
        // delete traversals & shift y values so the lowest starts at 0
        const y_shift = 0 - (low_y < 0 ? low_y : 0);
        this.nodes.forEach((n) => {
            n.y += y_shift;
            delete n.traversals;
        });
        low_y += y_shift;

        // RENDER GROUPS
        // ---------------
        // group partners together into render groups, then each render group can be treated as a single node for determining x positions
        let group_root    = { members:[], uplinks:[], downlinks:[] },
            grouped_nodes = []; // this tracks which nodes have been grouped
        
        _processNodeForGroup(root, group_root);

        function _processNodeForGroup(node, group) {
            // process partners of this node
            if (node.unattached) {
                node.unattached.sort(_nameSorter).forEach((u) => {
                    if (!u) return;
                    if (!grouped_nodes.includes(u)) {
                        group.members.push(u);
                        grouped_nodes.push(u);
                    }
                });
            }
            group.members.push(node);
            grouped_nodes.push(node);
            if (node.partners) {
                node.partners.sort(_nameSorter).forEach((p) => {
                    if (!p) return;
                    if (!grouped_nodes.includes(p)) {
                        group.members.push(p);
                        grouped_nodes.push(p);
                    }
                });
            }
            // see if a partner has partners (in case we first came to a partner among multiples and the other partner has partners
            group.members.forEach((n) => {
                if (n.unattached) {
                    n.unattached.sort(_nameSorter).forEach((u) => {
                        if (!u) return;
                        if (!grouped_nodes.includes(u)) {
                            group.members.unshift(u);
                            grouped_nodes.push(u);
                        }
                    });
                }
                if (n.partners) {
                    n.partners.sort(_nameSorter).forEach((p) => {
                        if (!p) return;
                        if (!grouped_nodes.includes(p)) {
                            group.members.push(p);
                            grouped_nodes.push(p);
                        }
                    });
                }
            });
            // move on to the uplinks & downlinks
            group.members.forEach((n) => {
                if (!n) return;
                // uplinks
                if (n.mother || n.father) {
                    if (!grouped_nodes.includes(n.mother || n.father)) {
                        let new_group = { members:[], uplinks:[], downlinks:[] };
                        group.uplinks.push(new_group);
                        _processNodeForGroup(n.mother || n.father, new_group);
                    }
                }
                // downlinks
                if (n.children) {
                    n.children.forEach((c) => {
                        if (!c) return;
                        if (!grouped_nodes.includes(c)) {
                            let new_group = { members:[], uplinks:[], downlinks:[] };
                            group.downlinks.push(new_group);
                            _processNodeForGroup(c, new_group);
                        }
                    });
                }
                if (n.partners) {
                    n.partners.some((p) => {
                        if (!p) return false;
                        let pairing = pairings[n.id +'-'+ p.id] || pairings[p.id +'-'+ n.id];
                        if (pairing && pairing.children) {
                            pairing.children.forEach((c) => {
                                if (!c) return;
                                if (!grouped_nodes.includes(c)) {
                                    let new_group = { members:[], uplinks:[], downlinks:[] };
                                    group.downlinks.push(new_group);
                                    _processNodeForGroup(c, new_group);
                                }
                            });
                        }
                    });
                }
            });
        }
        console.log('grouped: ', group_root);



        // X VALUES
        // ---------------
        // start with the root, walk the tree, setting x values
        // stack = [];
        // stack.push([].concat(this.nodes).sort(_IDSorter)[0]);
        // while (stack.length) {
        //     let n = stack.slice(-1)[0],
        //         x = 0;
        //     if (!n.traversals) n.traversals = [];
        //     if (null == n.x) n.x = x;
        //     // check for parents of unattached partners
        //     if (n.unattached) {
        //         n.unattached.sort(_nameSorter);
        //         let u = n.unattached.find((u) => { return !!u && !n.traversals.includes(u.id) && !stack.includes(u); });
        //         if (u) {
        //             n.traversals.push(u.id);
        //             stack.push(u);
        //             x = ?;
        //             continue;
        //         }
        //     }

        //     // check for my own children

        //     // check for my attached pairing children

        //     // check for my attached partner's own children

        //     // nowhere to go? Go back down the stack
        //     stack.pop();
        // }
        

        console.log('--------------------------------------------------');
        this.nodes.forEach((n) => {
            console.log(n.name, n.x, n.y);
        });

        // { id, partner_ids, unattached_ids, mother_id (mother), father_id (father), name, born, died, married, notes }

        // sort an array by name properties
        function _nameSorter(a, b) {
            return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
        }

        // sort an array by y properties
        function _ySorter(a, b) {
            return a.y < b.y ? -1 : a.y > b.y ? 1 : 0;
        }

        // sort an array by ID properties
        function _IDSorter(a, b) {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        }

        // deep clone a value recursively
        function _clone(obj) {
            var val;
            
            if (_isArray(obj)) {
                val = obj.map((o) => { return _clone(o); });
            }
            else if (_isObject(obj)) {
                val = {};
                Object.keys(obj).forEach((p) => { val[p] = _clone(obj[p]); });
            }
            else {
                val = obj;
            }

            return val;
        }

        // see if a value is an array
        function _isArray(obj) {
            return !!(({}).toString.call(obj) === '[object Array]');
        }

        // see if a value is an object
        function _isObject(obj) {
            return !!(obj && ({}).toString.call(obj) === '[object Object]');
        }
    }
}
    