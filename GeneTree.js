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
        this.container             = container;
        this.fields                = config && config.fields || this.defaultFields;
        this.levelSeparation       = config && config.levelSeparation || 0;
        this.partnerNodeSeparation = config && config.partnerNodeSeparation || 0;
        this.siblingSeparation     = config && config.siblingSeparation || 0;
        this.subtreeSeparation     = config && config.subtreeSeparation || 0;
        this.template              = Object.assign({}, this.defaultTemplate, config && config.template || {});
        this.nodes                 = [].concat(config && config.nodes || []);
        // process the nodes
        this.nodes.sort((a,b) => { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
    }
}
    