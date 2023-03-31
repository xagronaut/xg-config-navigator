(function(window, undefined) {
    function CytoscapeUtil(data) {
        var self = this;

        var cy = window.cy = cytoscape({
            container: document.getElementById('cy'),

            minZoom: .05,
            maxZoom: 2.5,

            style: [
                {
                    selector: 'node',
                    style: {
                        'background-color': '#ad1a66',
                        //'shape': 'roundrectangle',
                        'shape': 'cutrectangle',
                        'label': 'data(label)',
                        'text-wrap': 'wrap',
                        'height': '50',
                        'width': 'label',
                        'padding': 20,
                        'border-width': 2,
                        'compound-sizing-wrt-labels': 'include',
                        'text-valign': 'center',
                        'text-halign': 'center'
                    }
                },

                {
                    selector: '[borderColor]',
                    style: {
                        'border-color': 'data(borderColor)'
                    }
                },

                {
                    selector: '[groupColor]',
                    style: {
                        'background-color': 'data(groupColor)'
                    }
                },

                {
                    selector: 'node:selected',
                    style: {
                        'border-color' : 'orange',
                        'border-width' : 4
                    }
                },

                {
                    selector: '[fontSize]',
                    style: {
                        'font-size': 'data(fontSize)'
                    }
                },

                {
                    selector: ':parent',
                    style: {
                        'background-opacity': 0.333,
                        'background-color': 'data(parentColor)',
                        'color' : '#000000',
                        'font-weight': 'bold',
                        'font-size': '5em',
                        //'text-opacity' : 0.6,
                        'text-valign': 'top',
                        'text-margin-y': 90,
                        //'z-index': 1001,
                        'z-compound-depth': 'auto',
                        'padding': 120
                    }
                },

                {
                    selector: 'node:unselected:parent node',
                    style: {
                        'z-compound-depth': 'auto',
                        'z-index-compare': 'manual',
                        'z-index': 3000
                    }
                },

                {
                    selector: 'node:selected:parent',
                    style: {
                        'border-width' : 14,
                        'background-opacity': .888,
                        'text-outline-color': '#ffffff',
                        'text-outline-width': 2,
                        'z-index': 10000,
                        'z-compound-depth': 'auto'
                    }
                },

                {
                    selector: 'node.highlighted',
                    style: {
                        'border-color' : 'yellow',
                        'border-width' : 10,
                        'text-outline-color': 'yellow',
                        'text-outline-width': 4,
                        'text-background-color': '#CCCCCC',
                        'text-background-padding': 10,
                        'text-background-opacity': .7,
                        'background-opacity': 1.0,
                        'z-index': 8000
                    }
                },

                {
                    selector: 'node.non-isolated',
                    style: {
                        'display': 'none'
                    }
                },

                {
                    selector: 'node.isolated',
                    style: {
                        'display': 'element'
                    }
                },

                {
                    selector: 'node.init-invisible',
                    style: {
                        'display': 'none'
                    }
                },

                {
                    selector: 'edge',
                    style: {
                        'width': 3,
                        'curve-style': 'bezier',
                        'line-color': '#ad1a66',
                        'arrow-scale': 3,
                        'target-arrow-color': '#000',
                        'target-arrow-shape': 'triangle',
                        'font-size': '2em',
                        'label' : 'data(label)',
                        'text-outline-color': '#ffffff',
                        'text-outline-width': 2
                    }                        
                }
            ],

            elements: data
        });

        function getDefaultLayoutOptions(options) {
            options = options || {};
            var defaults = {
                name: 'cose-bilkent',
                animate: 'end',
                refresh: 30,
                quality: 'draft',
                randomize: false,
                //nodeDimensionsIncludeLabels: true,
                animationDuration: 800,
                tile: true,
                // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
                tilingPaddingVertical: 150,
                // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
                tilingPaddingHorizontal: 200,
                gravityRange: 1.5,
                gravityRangeCompound: 1.0,
                padding: 50,
                paddingCompound: 150,
                // nodeRepulsion: 2048,
                idealEdgeLength: 115,
                fit: true
                // unused options from other layouts
                //name: 'grid',
                //name: 'circle',
                //name: 'breadthfirst',
                //avoidOverlap: true,
                //avoidOverlapPadding: 100,
                //spacingFactor: 1,
                //zoom: .6,
            };

            for(var o in options) { defaults[o] = options[o]; }

            return defaults;
        }

        var onSelectCallback = function() {};
        var onUnselectCallback = function() {};
        var onIsolateCallback = function() {};
        var onSubtractCallback = function() {};
        var onVisibleChangedCallback = function() {};
        var onExpandCallback = function() {};

        function showNodeInfo(node) {
            var id = node.id();
            var nodeData = (node.data() || { properties: {} });
            var inbound = node.incomers().map(function(incomer) {
                return { source: incomer.source().data('id'), value: incomer.data('label'), target: incomer.target().data('target') };
            });
            (onSelectCallback && onSelectCallback({
                "id": id,
                "properties": nodeData.properties,
                "inbound": inbound
            }));
        }

        function hideNodeInfo(node) {
            (onUnselectCallback && onUnselectCallback(null));
        }

        function clearHighlight () {
            cy.$('.highlighted').removeClass('highlighted');
        }

        function highlight(eles) {
            fitElements(eles, function() {
                eles.flashClass('highlighted', 1500);
            });
        }

        cy.on('select unselect', 'node', function(e){
            var node = cy.$('node:selected');

            if( node.nonempty() ){
                showNodeInfo( node );
                if(!cy.animated()) {
                    cy.animate({
                        center: { eles: node },
                        duration: 800
                    });
                }
            } else {
                hideNodeInfo();
            }
        });

        function fitElements(eles, callback, duration) {
            duration = duration || 800;
            if( eles && eles.nonempty() ){
                var padding = eles.isParent() ? 30 : 100;
                cy.animate({
                    fit: {
                        eles: eles,
                        padding: padding,
                        "padding-relative-to": "width"
                    },
                    duration: duration,
                    complete: function() {
                        (callback || function() {})(eles);
                    }
                });
            }
        }

        function fitVisibleElements() { fitElements(cy.$(':visible')); }

        function getTaggedElements(tag) {
            var eles = cy.$('.' + tag);
            return eles;
        }

        function getOrphans() {
            var eles = cy.$(':orphan:childless');
            return eles;
        }

        function arrange(eles, options) {
            options = options || {};

            cy.$(':locked').unlock();

            var arrangeElements;

            // arrange selection is not working yet (hard-code disabling)
            if(false && eles && eles.nonempty()) {
                arrangeElements = eles.union(eles.descendants());
            } else {
                eles = cy.$(':parent:orphan:visible, :orphan:childless:visible');
                arrangeElements = eles.union(eles.descendants(':visible'));
            }

            (!options.hasOwnProperty(options, "fit") && (options.fit = true));

            var layoutOptions = getDefaultLayoutOptions(options);

            var layout = arrangeElements.layout(layoutOptions);

            layout.run();
            //fitElements(allVisible, function() { allVisible.unlock();  })
            setTimeout(function() { fitVisibleElements(); }, 1500);
        }

        function subtractSelected() {
            var selected = cy.$(':selected');
            setElementIsolation(selected, false);
            selected.unselect();
            cy.resize();
            fitVisibleElements();
            (onSubtractCallback && onSubtractCallback());
            (onVisibleChangedCallback && onVisibleChangedCallback());
        }
        
        function selectTag(tag) {
            cy.$('node').unselect();
            var eles = getTaggedElements(tag);
            eles.select();
        }

        function addTag(tag) {
            cy.$('node').unselect();
            var eles = getTaggedElements(tag);
            eles = eles.union(eles.ancestors());
            setElementIsolation(eles, true);
            cy.resize();
            fitVisibleElements();
        }

        function setElementIsolation(eles, isolated) {
            if(!eles || eles.empty()) return;
            var nodes = eles.nodes();
            nodes.removeClass('isolated');
            nodes.removeClass('non-isolated');
            nodes.removeStyle('display');
            nodes.addClass(isolated ? 'isolated' : 'non-isolated');
            nodes.style('display', isolated ? 'element' : 'none');
        }

        function addNeighborhood(eles) {
            var eles = eles || cy.$(':selected');
            if(!eles || eles.empty()) {
                eles = cy.$(':visible');
            }
            var neighbors = eles.neighborhood('node');
            neighbors = neighbors.union(neighbors.ancestors());
            eles = eles.union(neighbors);
            setElementIsolation(eles, true);

            fitVisibleElements();
        }

        function isolateSelected(eles, includeNeighbors) {
            var selectedElements = eles || cy.$(':selected');

            if(selectedElements.empty()) {
                return;
            }

            var ancestors = selectedElements.ancestors();
            var descendants = selectedElements.descendants();
            var isolatedElements = selectedElements.union(ancestors).union(descendants);

            if(includeNeighbors) {
                var neighborhood = selectedElements.neighborhood();
                isolatedElements =
                    neighborhood
                        .union(neighborhood.ancestors())
                        .union(neighborhood.descendants())
                        .union(isolatedElements);
            }

            setElementIsolation(isolatedElements, true);

            var otherNodes = isolatedElements.absoluteComplement().nodes();

            setElementIsolation(otherNodes, false);

            (onIsolateCallback && onIsolateCallback());
            (onVisibleChangedCallback && onVisibleChangedCallback());

            return isolatedElements;
        }

        function isolatePlusOne(eles) {
            if(typeof eles == "string") {
                eles = cy.$('#' + eles);
            }
            eles = eles || cy.$(':selected');
            var isolatedElements = isolateSelected(eles, true);
            arrange(isolatedElements);
        }

        function expandIsolation() {
            var selectedElements = cy.$(':selected');

            if(selectedElements.empty()) {
                return;
            }

            if(selectedElements.nonempty()) {
                selectedElements = selectedElements.union(selectedElements.descendants());
                var edgesWith = cy.$('node').edgesWith(selectedElements);
                var connectedNodes = edgesWith.sources().union(edgesWith.targets());
                connectedNodes = connectedNodes
                    .union(connectedNodes.ancestors())
                    .union(connectedNodes.descendants())
                    .union(connectedNodes.children())
                    ;
                var isolatedNodes = connectedNodes.union(selectedElements);

                setElementIsolation(isolatedNodes, true);

                fitVisibleElements();

                (onExpandCallback && onExpandCallback());
                (onVisibleChangedCallback && onVisibleChangedCallback());
            }
        }

        function selectElements(eles) {
            cy.$('node').unselect();
            eles.select();
        }

        cy.on('cxttap', function(e) {
            if (e.target == cy) {
                fitVisibleElements();
            } else {
                var node = e.target;
                fitElements(node, selectElements);
            }
        });

        var layoutOptions = getDefaultLayoutOptions();

        // var masterLayout = cy.layout(layoutOptions);
        var initialLayoutElements = cy.$(':parent:orphan:visible');
        initialLayoutElements = initialLayoutElements.union(initialLayoutElements.descendants());
        var masterLayout = initialLayoutElements.layout(layoutOptions);
        masterLayout.one("layoutstart", function() {
            // hide anything that has an Id starting with "."
            cy.$('node[id^="."]').addClass('init-invisible');
        });
        masterLayout.one("layoutready", function() {
            // this is a layout hack
            setTimeout(fitVisibleElements, 1100);
        });

        // for debugging in the browser?
        self.masterLayout = masterLayout;
        
        masterLayout.run();
        
        var controls = {
            applyStyles: function(style) {
                style = style || [];
                style.forEach(function(item) {
                    cy.style().selector(item.selector).style(item.style).update();
                });
            },
            selectNode: function(nodeId) {
                nodeId = (nodeId || '').trim().replace('.', '\\.');
                var eles = cy.$('#' + nodeId);

                var relatedElements = eles.union(eles.ancestors()).union(eles.descendants());
                setElementIsolation(relatedElements, true);

                relatedElements.removeClass('init-invisible');

                fitElements(eles, selectElements);

                return nodeId;
            },
            selectParent: function() {
                var selected = cy.$(':selected');
                if(selected && selected.nonempty() && selected.length == 1 && selected.isChild()) {
                    var parent = selected.parent();
                    selected.unselect();
                    fitElements(parent, selectElements);
                    return parent.id();
                }
                selected = cy.$(':selected');
                if(selected && selected.length == 1) {
                    return selected.first().id();
                }
            },
            setGroupVisibility: function (groupName, isDisplayed) {
                cy.$('node[groupName="' + groupName + '"]').style({ 'display': isDisplayed ? 'element' : 'none' });
                fitVisibleElements();
            },
            resetDiagram: function() {
                clearHighlight();
                var allNodes = cy.$('node');
                allNodes.unlock();
                allNodes.removeClass('non-isolated');
                allNodes.removeClass('isolated');
                allNodes.removeStyle('display');
                cy.resize();
                fitVisibleElements();
            },
            resizeDiagram: function () {
                cy.resize();
            },
            expandIsolation: expandIsolation,
            fitAll: function() {
                fitVisibleElements();
            },
            subtractSelected: subtractSelected,
            arrange: function() {
                var eles = cy.$(':selected');
                arrange(eles);
            },
            isolateSelected: isolateSelected,
            isolatePlusOne: isolatePlusOne,
            addNeighborhood: addNeighborhood,
            addTag: addTag,
            highlightTag: function (tag) {
                clearHighlight();
                var eles = getTaggedElements(tag);
                highlight(eles);
            },
            subtractTag: function(tag) {
                selectTag(tag);
                subtractSelected();
            },
            selectTag: selectTag,
            isolateTag: function(tag) {
                var eles = getTaggedElements(tag);
                isolateSelected(eles);
                arrange(eles);
            },
            highlightOrphans: function () {
                clearHighlight();
                var eles = getOrphans();
                highlight(eles);
            },
            subtractOrphans: function(tag) {
                var eles = getOrphans();
                selectElements(eles);
                subtractSelected();
            },
            getOrphanNodes: function() {
                var eles = getOrphans();
                return eles.map(function(node) {
                    var nodeData = (node.data() || { properties: {} });
                    var inbound = node.incomers().map(function(incomer) {
                        return { source: incomer.source().data('id'), value: incomer.data('label'), target: incomer.target().data('target') };
                    });
                    return {
                        "id": node.data('id'),
                        "properties": nodeData.properties,
                        "inbound": inbound
                    };
                });
            },
            exportPng: function(fullView) {
                return cy.png({ output: 'base64uri', full: fullView });
            },
            masterLayout: masterLayout,
            getViewData : function() {
                return cy.json();
            },
            restoreViewData: function (viewData) {
                viewData = (typeof viewData == "string") ? JSON.parse(viewData) : viewData;
                cy.json(viewData);
                fitVisibleElements();
            },
            isolateOrphans: function(tag) {
                var eles = getOrphans();
                isolateSelected(eles);
                arrange(eles);
            },
            setGroupColor: function (groupName, colors) {
                colors = colors || {};

                var groupNodes = cy.$('node[groupName="' + groupName + '"]'),
                { groupColor, borderColor, parentColor } = groupNodes.data() || {};

                groupNodes.data('groupColor', colors.color || groupColor);
                groupNodes.data('borderColor', colors.borderColor || borderColor);
                groupNodes.data('parentColor', colors.parentColor || parentColor);
            },
            zoom: cy.zoom,
            minZoom: cy.maxZoom,
            maxZoom: cy.maxZoom,
            setZoomLevel: function(level) {
                cy.zoom(level);
            },
            onSelect: function(callback) {
                onSelectCallback = callback || function() {};
            },
            onUnselect: function (callback) {
                onUnselectCallback = callback || function() {};
            },
            onSubtract: function (callback) {
                onSubtractCallback = callback || function() {};
            },
            onExpand: function (callback) {
                onExpandCallback = callback || function() {};
            },
            onVisibleChange: function (callback) {
                onVisibleChangeCallback = callback || function() {};
            },
            onIsolate: function(callback) {
                onIsolateCallback = callback || function() {};
            }
        };

        return controls;
    }

	window.CytoscapeUtil = window.CytoscapeUtil || CytoscapeUtil;
}(window));
