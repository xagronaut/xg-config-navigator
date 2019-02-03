(function(window, undefined) {
	function buildGraph(data, options) {
		if(typeof data === 'string') {
			data = JSON.parse(data || '{ "nodes": [ { "id": "Not found", "group": 1}], "links": [] }');
		}
		data = $.extend({ "nodes": [{ "id": "Not found", "group": 1 }], links: []}, data || {});
		
		var defaultColor = d3.scaleOrdinal(d3.schemeCategory20);

		options = $.extend(
			{
				width: 1200,
				height: 850,
				circleRadius: 45,
				markerHeight: 10,
				markerWidth: 10,
				target: '#graphDiv',
				viewBoxTop: 0,
				viewBoxLeft: 0,
				viewBoxWidth: 1200,
				viewBoxHeight: 850,
				markerFill: '#000000',
				arrowFill: '#FF0000',
				arrowStroke: '#FF0000',
				arrowWidth: 5,
				distance: 250,
				colorCount: 20,
				nodeTextProperty: 'id',
				toolTipProperty: 'comment',
				colorFunction: defaultColor
			}
			, options
		);

		var {
				circleRadius,
				width,
				height,
				markerHeight,
				markerWidth,
				markerFill,
				viewBoxTop,
				viewBoxLeft,
				viewBoxHeight,
				viewBoxWidth,
				arrowFill,
				arrowStroke,
				arrowWidth,
				distance,
				colorCount,
				colorFunction,
				target,
				nodeTextProperty,
				toolTipProperty
			} = options,
			refX = markerWidth + 4.5,
			refY = 2,
			drSub = circleRadius + refY;
	
		var svgElement = d3.select(target).insert("svg") //,function() {return nextSibling;})
			.attr("width", width)
			.attr("height", height),
			width = +svgElement.attr("width"),
			height = +svgElement.attr("height"),
			marker = svgElement
				.append("defs")
				.append("marker")
					.attr("id", function(d) {
						return "arrow";
					});
			
		marker
			.attr("orient", "auto")
			.attr("markerWidth", `${markerWidth}`)
			.attr("markerHeight", `${markerHeight}`)
			.attr("markerUnits", "strokeWidth")
			.attr("refX", refX)
			.attr("refY", refY)
			.append("path")
			.attr("d", "M 0,0 V 4 L6.1,2 Z")
			.attr("fill", `${markerFill}`);
	
		var simulation = d3.forceSimulation()
			.force("link",
				d3.forceLink()
				.id(function(d) {
                    //console.log(d.id);
					return d.id;
				})
				.distance(function(d) {
					return distance;
				})
			)
			.force("charge", d3.forceManyBody())
			.force("center", d3.forceCenter(width / 2, height / 2));
	
		svgElement
			.attr("viewBox", `${viewBoxLeft} ${viewBoxTop} ${viewBoxWidth} ${viewBoxHeight}`)
		;
	
		var graph = data;
	
		var link = svgElement.append("g")
            .attr("class", "links")
			.selectAll("line")
			.data(graph.links)
			.enter()
			.append("g")
			.append("line")
			.attr("marker-end", function(d) {
				return "url(#arrow)";
			})
			.attr("stroke-width", function(d) {
				return arrowWidth;
			}) //return d.value; /* Math.sqrt(d.value); */ })
			.attr("fill", arrowFill)
			.attr("stroke", arrowStroke)
			.each(function(d) {
				var parentNode =
					d3.select(this.parentNode);
				parentNode.append("rect");
				parentNode.append("text")
					.attr("text-anchor", "middle")
					.text(function() {
						return d.value;
					});
			});
			
        var node = svgElement.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(graph.nodes)
			.enter()
            .append("g")
            .classed("visible", true)
			.attr("data-node-id", function(d) {
				return d.id;
			})
			.attr("data-group-id", function(d) {
				return d.group;
			})
			.attr("class", "node-container")
			.append("circle")
			.attr("r", circleRadius)
			.style("fill", function(d, index) {
				return colorFunction((d.group || index) % colorCount, d);
			})
	  		.style("stroke", function(d, index) { return d3.rgb(colorFunction((d.group || index) % colorCount, d)).darker(); })
			.style("stroke-width", "2.5")
			.call(
				d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
			);

		node
			.append('title')
			.text(function(d) {
				return d[toolTipProperty] || '';
			});
	
		node
			.each(function(d, i, arr) {
				d.labelLines = (d[nodeTextProperty] || d.id).split(/\r?\n/);
				var textElement = d3.select(this.parentNode).append('text').attr("text-anchor", "middle");
				d.labelLines.forEach(function(line, index) {
					var dy = index * 15;
					var tspan = textElement
						.append("tspan")
						.attr("text-anchor", "middle")
						.text(function() {
							return line;
						});
					(dy && tspan.attr("dy", dy));
				});
			});
	
		simulation
			.nodes(graph.nodes)
			.on("tick", ticked);
	
		simulation.force("link")
			.links(graph.links);
	
		function ticked() {
			node
				.attr("cx", function(d) {
					var textElement = d3.select(this.parentNode).select("text").attr("dx", d.x);
					textElement.selectAll("tspan")
						.attr("x", function() { return "" + (textElement.x || d.x) })
						.attr("dx", 0 );
					return d.x;
				})
				.attr("cy", function(d) {
					d3.select(this.parentNode).select("text").attr("dy", d.y);
					return d.y;
				});

			link
				.attr("x1", function(d) {
					return d.source.x;
				})
				.attr("y1", function(d) {
					return d.source.y;
				})
				.attr("x2", function(d) {
					return d.target.x;
				})
				.attr("y2", function(d) {
					return d.target.y;
				})
				.each(function(d) {
					d3.select(this.parentNode).select("text")
						.attr("dx", (d.source.x + d.target.x) / 2)
						.attr("dy", (d.source.y + d.target.y) / 2);
					d3.select(this.parentNode).select("rect")
						.attr("x", (d.source.x + d.target.x) / 2)
						.attr("y", (d.source.y + d.target.y) / 2);
				});
	
		}
	
		function dragstarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}
	
		function dragged(d) {
			d.fx = Math.max(circleRadius, Math.min(width - circleRadius, d3.event.x));
			//d.fx = d3.event.x;
			d.fy = Math.max(circleRadius, Math.min(height - circleRadius, d3.event.y));
			//d.fy = d3.event.y;
		}
	
		function dragended(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			// leave node shape in place when drag ends
			//d.fx = null;
			//d.fy = null;
        }
        
        var controls = {
                "setNodeVisibility": function(id, isDisplayed) {
                    var nodeElement = svgElement.selectAll('g[data-node-id="' + id + '"]');
                    nodeElement
                        .classed('visible', isDisplayed)
                        .classed('invisible', !isDisplayed)
                        ;
				},
				"updateNodeGroupColor": function(groupId, colorValue) {
					var nodes = svgElement.selectAll('g[data-group-id="' + groupId + '"] circle')
						.style("fill", function(d, index) {
							return colorValue;
						})
						.style("stroke", function(d, index) { return d3.rgb(colorValue).darker(); });
				}
        };
        
        return controls;
	}

	function GraphUtil() {}

	GraphUtil.buildGraph = buildGraph;

	window.GraphUtil = window.GraphUtil || GraphUtil;
}(window));
