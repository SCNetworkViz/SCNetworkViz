function extract_select2_data(graph) {
    var results = [];
    graph.nodes.forEach(function (node) {
        results.push({"id": node.id, "text": node.name});
    });
    return results;
}

function extract_datatable_data(d, graph, node_type) {
    let datatable_data = [];
    graph.links.forEach(function (e) {
        if (e[node_type].id === d.id) {
            datatable_data.push(e);
        }
    });
    return datatable_data;
}

function displayLinkInfo(d) {
    d3v4.select("#relSource")
        .text('Source: ' + d.source.name);
    d3v4.select("#relTarget")
        .text('Target: ' + d.target.name);
    d3v4.select("#relType")
        .text("Relation: " + (d.rel == null ? "N/A" : d.rel));
    d3v4.select("#relDet")
        .text("Relation Detail: " + (d.rel_type == null ? "N/A" : d.rel_type));
    d3v4.select("#relRev")
        .text("Revenue: " + (d.revenue_percent == null ? "N/A" : d.revenue_percent + "%"));
    d3v4.select("#relRevEst")
        .text("Revenue Estimated: " + (d.percent_estimated == null ? "N/A" : d.percent_estimated));
    d3v4.select("#relSub")
        .text("Subsidiaries: " + (d.subsidiaries == null ? "N/A" : d.subsidiaries));
    d3v4.select("#relKey1")
        .text("Keyword1: " + (d.keyword1 == null ? "N/A" : d.keyword1));
    d3v4.select("#relKey2")
        .text("Keyword2: " + (d.keyword2 == null ? "N/A" : d.keyword2));
    d3v4.select("#relKey3")
        .text("Keyword3: " + (d.keyword3 == null ? "N/A" : d.keyword3));
    d3v4.select("#relStart")
        .text("Start Time: " + (d.start_ == null ? "N/A" : d.start_));
    d3v4.select("#relEnd")
        .text("End Time: " + (d.end_ == null ? "N/A" : d.end_));
}

function displayCompanyInfo(color, d) {
    d3v4.select("#left_panel_company_title")
        .text((d.name == null ? "N/A" : d.name) + "'s Profile");
    d3v4.select("#nodeTick")
        .text("Ticker: " + (d.ticker == null ? "N/A" : d.ticker));
    d3v4.select("#nodeCUSIP")
        .text("CUSIP: " + (d.cusip == null ? "N/A" : d.cusip));
    d3v4.select("#nodeCountry")
        .text("Country: " + (d.country == null ? "N/A" : d.country))
        .style('color', color(d.country));
    d3v4.select("#nodeProvince")
        .text("Province: " + (d.province_name == null ? "N/A" : d.province_name));
    d3v4.select("#nodeCity")
        .text("City: " + (d.city == null ? "N/A" : d.city));
    d3v4.select("#nodeHome")
        .text("Home Region: " + (d.home_region == null ? "N/A" : d.home_region));
    d3v4.select("#nodeActive")
        .text("Active Status: " + (d.active == null ? "N/A" : d.active));
    d3v4.select("#nodeISIN")
        .text("ISIN: " + (d.isin == null ? "N/A" : d.isin));
    d3v4.select("#nodeInvest")
        .text("Investor: " + (d.investor_contact_name == null ? "N/A" : d.investor_contact_name));
    d3v4.select("#nodeStart")
        .text("Start Time: " + (d.start_ == null ? "N/A" : d.start_));
    d3v4.select("#nodeEnd")
        .text("End Time: " + (d.end_ == null ? "N/A" : d.end_));
    d3v4.select("#out_rel")
        .text((d.name == null ? "N/A" : d.name) + "'s Out Relation");
    d3v4.select("#in_rel")
        .text((d.name == null ? "N/A" : d.name) + "'s In Relation");
}

function arcDegree(rel) {
    if (rel === "CUSTOMER") {
        return 1;
    }
    else if (rel === "PARTNER") {
        return 0.8;
    }
    else if (rel === "COMPETITOR") {
        return 0.6;
    }
    else if (rel === "SUPPLIER") {
        return 0.4;
    }
    else {
        return 0.1
    }
}

function buildHierarchy(d, data) {
    var root = {"name": d.name + "'s Product Category", "children": []};
    for (var i = 0; i < data.length; i++) {
        var sequence = data[i].path;
        /*
        if (isNaN(size)) { // e.g. if this is a header row
            continue;
        }
        */
        var parts = sequence.split(" > ");
        var currentNode = root;
        for (var j = 0; j < parts.length; j++) {
            var children = currentNode["children"];
            var nodeName = parts[j];
            var childNode;
            if (j + 1 < parts.length) {
                // Not yet at the end of the sequence; move down the tree.
                var foundChild = false;
                for (var k = 0; k < children.length; k++) {
                    if (children[k]["name"] === nodeName) {
                        childNode = children[k];
                        foundChild = true;
                        break;
                    }
                }
                // If we don't already have a child node for this branch, create it.
                if (!foundChild) {
                    childNode = {"name": nodeName, "children": [], 'leaf': false};
                    children.push(childNode);
                }
                currentNode = childNode;
            } else {
                // Reached the end of the sequence; create a leaf node.
                childNode = {"name": nodeName, 'data': data[i], 'leaf': true};
                children.push(childNode);
            }
        }
    }
    return root;
}

function displayProductInfo(graph, d) {
    d3v4.select('#product_list_title')
        .text(d.name + "'s Product");

    var tooltip = d3v4.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var product_list = [];
    graph.product.forEach(function (item) {
        if (item.company_id === d.id) {
            product_list.push(item);
        }
    });
    product_json = buildHierarchy(d, product_list);

    var margin = {top: 30, right: 20, bottom: 30, left: 20},
        width = 960,
        barHeight = 20,
        barWidth = (width - margin.left - margin.right) * 0.8;

    var i = 0,
        duration = 400,
        root;

    var diagonal = d3v4.linkHorizontal()
        .x(function (d) {
            return d.y;
        })
        .y(function (d) {
            return d.x;
        });

    var svg = d3v4.select("#product_list_tree").append("svg")
        .classed('tree-Main', true)
        .attr("width", width) // + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    root = d3.hierarchy(product_json);
    root.x0 = 0;
    root.y0 = 0;
    update(root);

    function update(source) {

        // Compute the flattened node list.
        var nodes = root.descendants();

        var height = nodes.length * barHeight + margin.top + margin.bottom;

        d3v4.select(".tree-Main").transition()
            .duration(duration)
            .attr("height", height);

        // Compute the "layout". TODO https://github.com/d3/d3-hierarchy/issues/67
        var index = -1;
        root.eachBefore(function (n) {
            n.x = ++index * barHeight;
            n.y = n.depth * 20;
        });

        // Update the nodes…
        var node = svg.selectAll(".node")
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .style("opacity", 0)
            .on('mouseover', function (d) {
                if (d.data.leaf === true) {

                    tooltip.transition()
                        .duration(300)
                        .style("opacity", 1.0);

                    tooltip.html("<div class='rel-title'>Product: " + d.data.data.product_name + "</div>" +
                        "<table class='detail-info'>" +
                        d.data.data.description +
                        "<tr><td class='td-label'>Start Time: " + (d.data.data.start_ == null ? "N/A" : d.data.data.start_) + "</td></tr>" +
                        "<tr><td class='td-label'>End Time: " + (d.data.data.end_ == null ? "N/A" : d.data.data.end_) + "</td></tr>" +
                        "<tr><td class='td-label'>Active Status: " + (d.data.data.active == null ? "N/A" : d.data.data.active) + "</td></tr>" +
                        "<tr><td class='td-label'>Terminal: " + (d.data.data.terminal == null ? "N/A" : d.data.data.terminal) + "</td></tr>"
                        + "</table>"
                    )
                        .style("left", (d3.event.pageX + 20) + "px")
                        .style("top", (d3.event.pageY - 20) + "px");
                }
            })
            .on("mouseout", function () {
                tooltip.transition()
                    .duration(100)
                    .style("opacity", 0);
            });

        // Enter any new nodes at the parent's previous position.
        nodeEnter.append("rect")
            .attr("y", -barHeight / 2)
            .attr("height", barHeight)
            .attr("width", barWidth)
            .style("fill", color)
            .on("click", click);

        nodeEnter.append("text")
            .attr("dy", 3.5)
            .attr("dx", 5.5)
            .text(function (d) {
                return d.data.name;
            });

        // Transition nodes to their new position.
        nodeEnter.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
            .style("opacity", 1);

        node.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
            .style("opacity", 1)
            .select("rect")
            .style("fill", color);

        // Transition exiting nodes to the parent's new position.
        node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .style("opacity", 0)
            .remove();

        // Update the links…
        var link = svg.selectAll(".link")
            .data(root.links(), function (d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        // Stash the old positions for transition.
        root.each(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

// Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    function color(d) {
        return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
    }
}

function createSupplyVizGraph(panel, graph) {
    // if both d3v3 and d3v4 are loaded, we'll assume
    // that d3v4 is called d3v4, otherwise we'll assume
    // that d3v4 is the default (d3)
    if (typeof d3v4 === 'undefined')
        d3v4 = d3;

    let parentWidth = d3v4.select('#supply_chain_graph').node().clientWidth;
    let parentHeight = d3v4.select('#supply_chain_graph').node().clientHeight;

    var svg = d3v4.select('#supply_chain_graph');

    svg.attr('width', parentWidth);
    svg.attr('height', parentHeight);

    // remove any previous graphs
    svg.selectAll('.g-main').remove();

    var gMain = svg.append('g')
        .classed('g-main', true);

    var rect = gMain.append('rect')
        .attr('width', parentWidth) // background width
        .attr('height', parentHeight) // background height
        .style('fill', 'white'); // background color

    var gDraw = gMain.append('g');

    var zoom = d3v4.zoom()
        .on('zoom', zoomed);

    function zoomed() {
        gDraw.attr('transform', d3v4.event.transform);

        gDraw.selectAll('text')
            .attr('transform', function (d) {
                return 'scale(' + (1 / d3v4.event.transform.k) + ')';
            });
    }

    gMain.call(zoom);

    var color = d3v4.scaleOrdinal(d3v4.schemeCategory20);
    var link_color = d3v4.scaleOrdinal(d3v4.schemeCategory10);


    if (!("links" in graph)) {
        console.log("Graph is missing links");
        return;
    }

    /* search engine initialization*/
    let select2_data = extract_select2_data(graph);
    //init search box
    $("#search-box").select2({
        data: select2_data,
        containerCssClass: "search-box",
        placeholder: "Search Company ..."
    });

    /*
    let highlightToolTip = function (obj) {
        if (obj) {
            tooltip.html("<div class='title'>" + obj.name + "'s Document</div><table class='detail-info'><tr><td class='td-label'>Country: </td><td>" + (obj.country == null ? "N/A" : obj.country) + "</td></tr>" +
                "<tr><td class='td-label'>Province: </td><td>" + (obj.province_name == null ? "N/A" : d.province_name) + "</td></tr>" +
                "<tr><td class='td-label'>City: </td><td>" + (obj.city == null ? "N/A" : d.city) + "</td></tr>" +
                "<tr><td class='td-label'>Home Region: </td><td>" + (obj.home_region == null ? "N/A" : d.home_region) + "</td></tr>" +
                "<tr><td class='td-label'>Active Status: </td><td>" + (obj.active == null ? "N/A" : d.active) + "</td></tr>" +
                "<tr><td class='td-label'>Investor: </td><td>" + (obj.investor_contact_name == null ? "N/A" : d.investor_contact_name) + "</td></tr>"
                + "</table>")
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 20) + "px")
                .style("opacity", 1.0);
        } else {
            tooltip.style("opacity", 0.0);
        }
    };
    */

    var tooltip = d3v4.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // the brush needs to go before the nodes so that it doesn't
    // get called when the mouse is over a node
    var gBrushHolder = gDraw.append('g');
    var gBrush = null;

    // Add link arrow preparation
    gDraw.append("svg:defs").selectAll("marker")
        .data(["link-end"])
        .enter().append("svg:marker")
        .attr("id", "arrow")
        .attr('class', 'arrow')
        .attr("viewBox", "0 -5 10 10")
        // relative position
        .attr("refX", 17)
        .attr("refY", 0)
        // marker shape
        .attr("markerWidth", 9)
        .attr("markerHeight", 16)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr('fill', '#666');

    var link = gDraw.append("g")
        .attr("class", "link")
        .selectAll("line.link")
        .data(graph.links)
        .enter().append("svg:path")
        .attr("stroke-width", function (d) {
            return Math.sqrt(d.revenue_percent == null ? 2 : d.revenue_percent);
        })
        .attr('id', function (d) {
            return d.source + '_' + d.target;
        })
        .attr('marker-end', function (d) {
            if (d.source === d.target) {
                return false; //不应该有指向自己的关系 异常处理
            } else {
                return "url(#arrow)";
            }
        })
        .attr('stroke', function (d) {
            return link_color(d.rel);
        })
        .attr('fill', 'none')
        .on('mouseover', function (d) {
            displayLinkInfo(d);

            tooltip.transition()
                .duration(300)
                .style("opacity", .8);

            tooltip.html("<div class='rel-title'>" + d.rel + (d.rel_type === null ? '' : " - " + d.rel_type) + "</div>")
                .style("left", (d3.event.pageX + 20) + "px")
                .style("top", (d3.event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(100)
                .style("opacity", 0);
        });

    var node = gDraw.append("g")
        .attr("class", "node")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g");

    var circles = node.append("circle")
        .attr("r", 5)
        .attr("fill", function (d) {
            if ('color' in d)
                return d.color;
            else
                return color(d.country);
        })
        .call(d3v4.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended))
        .on("mouseover", function (d) {
            displayCompanyInfo(color, d);
            d3v4.select("#product_list_tree").selectAll('*').remove();
            displayProductInfo(graph, d);
            highlightNeighbors(d);
        });

    var nodeLabels = node.append("svg:text")
        .attr("class", "nodetext")
        .attr("dy", "-1em")
        .attr('text-anchor', 'middle')
        .attr('stroke-width', 0)
        .text(function (d) {
            return d.name
        })
        .style("visibility", "hidden");

    var neighbors = {};

    graph.nodes.forEach(function (node) {
        neighbors[node.id] = neighbors[node.id] || [];
    });

    graph.links.forEach(function (link) {
        neighbors[link.source].push(link.source);
        neighbors[link.target].push(link.target);
        neighbors[link.source].push(link.target);
        neighbors[link.target].push(link.source);
    });

    function highlightNeighbors(d) {

        deHighlight();

        node.classed("background", function (n) {
            return neighbors[d.id].indexOf(n.id) === -1;
        });

        link.classed("background", function (n) {
            return !(d.id === n.source.id || d.id === n.target.id);
        });

        nodeLabels.filter(function (n) {
            return neighbors[d.id].indexOf(n.id) !== -1;
        })
        // we can't use display:none with labels because we need to load them in the DOM in order to calculate the background rectangle dimensions with the getBBox function.
        // So we used visibility:hidden instead.
            .style("visibility", "visible");

        /* add in & out relation */
        let source_data = extract_datatable_data(d, graph, 'source');
        let target_data = extract_datatable_data(d, graph, 'target');

        if ($.fn.dataTable.isDataTable('#in_rel_table')) {
            $('#in_rel_table').dataTable().fnClearTable();
            if (target_data.length !== 0) {
                $('#in_rel_table').dataTable().fnAddData(target_data);
            }
        }
        else {
            if (target_data.length !== 0) {
                $(document).ready(function () {
                    $('#in_rel_table').DataTable({
                        "scrollX": true,
                        "scrollY": 200,
                        paging: false,
                        "bInfo": false,
                        columnDefs: [{"className": "dt-center", "targets": "_all"}],
                        data: target_data,
                        columns: [
                            {data: "source.name"},
                            {data: "start_"},
                            {data: "end_"},
                            {data: "rel"},
                            {data: "rel_type"},
                            {data: "revenue_percent"},
                            {data: "percent_estimated"},
                            {data: "subsidiaries"}
                        ]
                    });

                    $('#in_rel_table tbody').on('click', 'tr', function () {
                        $(this).toggleClass('selected');
                        displayLinkInfo($('#in_rel_table').DataTable().row(this).data());
                    });
                });
            }
        }

        if ($.fn.dataTable.isDataTable('#out_rel_table')) {
            $('#out_rel_table').dataTable().fnClearTable();
            if (source_data.length !== 0) {
                $('#out_rel_table').dataTable().fnAddData(source_data);
            }
        }
        else {
            if (source_data.length !== 0) {
                $(document).ready(function () {
                    $('#out_rel_table').DataTable({
                        "scrollX": true,
                        "scrollY": 200,
                        paging: false,
                        "bInfo": false,
                        columnDefs: [{"className": "dt-center", "targets": "_all"}],
                        data: source_data,
                        columns: [
                            {data: "target.name"},
                            {data: "start_"},
                            {data: "end_"},
                            {data: "rel"},
                            {data: "rel_type"},
                            {data: "revenue_percent"},
                            {data: "percent_estimated"},
                            {data: "subsidiaries"}
                        ]
                    });

                    $('#out_rel_table tbody').on('click', 'tr', function () {
                        $(this).toggleClass('selected');
                        displayLinkInfo($('#out_rel_table').DataTable().row(this).data());
                    });
                });
            }
        }
    }

    function deHighlight() {
        node.classed("background", false);
        link.classed("background", false);
        nodeLabels.style("visibility", "hidden");
        //nodeGlyph.style("display", "none");
        //glyphLabels.style("display", "none");
        //textBackground.style("display", "none");
    }

    /* search engine */
    $("#search-box").on("select2-selecting", function (e) {
        // var paths = searchTree(root, e.object.text, []);
        let theCircle = null;
        circles.filter(function (d) {
            if (e.object.id === d.id) {
                theCircle = d;
            }
            else {
                console.log(e.object.id + ' not found!');
            }
        });
        displayCompanyInfo(color, theCircle);
        displayProductInfo(graph, theCircle);
        highlightNeighbors(theCircle);
    });

    // TODO: add link line

    var simulation = d3v4.forceSimulation()
        .force("link", d3v4.forceLink()
            .id(function (d) {
                return d.id;
            })
            .distance(function (d) {
                return d.revenue_percent == null ? 100 : 600 / d.revenue_percent;
                //var dist = 20 / d.value;
                //console.log('dist:', dist);
                // return dist;
            })
        )
        .force("charge", d3v4.forceManyBody())
        .force("center", d3v4.forceCenter(parentWidth / 2, parentHeight / 2))
        .force("x", d3v4.forceX(parentWidth / 2))
        .force("y", d3v4.forceY(parentHeight / 2))
        .force("collide", d3v4.forceCollide(10).strength(1).iterations(1));

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    function ticked() {
        // update node and line positions at every step of
        // the force simulation
        /*
        link.attr("x1", function (d) {
            return d.source.x;
        })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });
            */
        link.attr("d", function (d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" +
                d.source.x + "," +
                d.source.y + "A" +
                dr * arcDegree(d.rel) + "," + dr * arcDegree(d.rel) + " 0 0,1 " +
                d.target.x + "," +
                d.target.y;
        });

        node.attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    }

    var brushMode = false;
    var brushing = false;

    var brush = d3v4.brush()
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    function brushstarted() {
        // keep track of whether we're actively brushing so that we
        // don't remove the brush on keyup in the middle of a selection
        brushing = true;

        circles.each(function (d) {
            d.previouslySelected = shiftKey && d.selected;
        });

        link.each(function (d) {
            d.previouslySelected = shiftKey && d.selected;
        })
    }

    rect.on('click', () => {
        circles.each(function (d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        circles.classed("selected", false);

        link.each(function (d) {
            d.selected = false;
            d.previouslySelected = false;
        });
        link.classed("selected", false);

        deHighlight();
    });

    function brushed() {
        if (!d3v4.event.sourceEvent) return;
        if (!d3v4.event.selection) return;

        var extent = d3v4.event.selection;

        circles.classed("selected", function (d) {
            return d.selected = d.previouslySelected ^
                (extent[0][0] <= d.x && d.x < extent[1][0]
                    && extent[0][1] <= d.y && d.y < extent[1][1]);
        });

        link.classed("selected", function (d) {
            return d.selected = d.previouslySelected ^
                (extent[0][0] <= d.x && d.x < extent[1][0]
                    && extent[0][1] <= d.y && d.y < extent[1][1]);
        });
    }

    function brushended() {
        if (!d3v4.event.sourceEvent) return;
        if (!d3v4.event.selection) return;
        if (!gBrush) return;

        gBrush.call(brush.move, null);

        if (!brushMode) {
            // the shift key has been release before we ended our brushing
            gBrush.remove();
            gBrush = null;
        }

        brushing = false;
    }

    d3v4.select('body').on('keydown', keydown);
    d3v4.select('body').on('keyup', keyup);

    var shiftKey;

    function keydown() {
        shiftKey = d3v4.event.shiftKey;

        if (shiftKey) {
            // if we already have a brush, don't do anything
            if (gBrush)
                return;

            brushMode = true;

            if (!gBrush) {
                gBrush = gBrushHolder.append('g');
                gBrush.call(brush);
            }
        }
    }

    function keyup() {
        shiftKey = false;
        brushMode = false;

        if (!gBrush)
            return;

        if (!brushing) {
            // only remove the brush if we're not actively brushing
            // otherwise it'll be removed when the brushing ends
            gBrush.remove();
            gBrush = null;
        }
    }

    function dragstarted(d) {
        if (!d3v4.event.active) simulation.alphaTarget(0.9).restart();

        if (!d.selected && !shiftKey) {
            // if this node isn't selected, then we have to unselect every other node
            circles.classed("selected", function (p) {
                return p.selected = p.previouslySelected = false;
            });
        }

        d3v4.select(this).classed("selected", function (d) {
            d.previouslySelected = d.selected;
            return d.selected = true;
        });

        circles.filter(function (d) {
            return d.selected;
        })
            .each(function (d) { //d.fixed |= 2;
                d.fx = d.x;
                d.fy = d.y;
            })
    }

    function dragged(d) {
        //d.fx = d3v4.event.x;
        //d.fy = d3v4.event.y;
        circles.filter(function (d) {
            return d.selected;
        })
            .each(function (d) {
                d.fx += d3v4.event.dx;
                d.fy += d3v4.event.dy;
            })
    }

    function dragended(d) {
        if (!d3v4.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        circles.filter(function (d) {
            return d.selected;
        })
            .each(function (d) { //d.fixed &= ~6;
                d.fx = null;
                d.fy = null;
            })
    }

    // relation legend
    var rel_Legned = d3v4.select("#rel-legend").append("svg")
        .attr("width", 850)
        .attr("height", 10);

    var dataL = 0;
    var offset = 80;

    var rel_legend = rel_Legned.selectAll('.rel_legends')
        .data(link_color.domain())
        .enter().append('g')
        .attr("class", "rel_legends")
        .attr("transform", function (d, i) {
            if (i === 0) {
                dataL = d.length + offset;
                return "translate(0,0)"
            } else {
                var newdataL = dataL;
                dataL += d.length + offset;
                return "translate(" + (newdataL) + ",0)"
            }
        });

    rel_legend.append('rect')
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function (d, i) {
            return link_color(d);
        });

    rel_legend.append('text')
        .attr("x", 15)
        .attr("y", 10)
        //.attr("dy", ".35em")
        .text(function (d) {
            return d;
        })
        .attr("class", "textselected")
        .style("text-anchor", "start")
        .style("font-size", 10);

    // TODO: node legend


    /*
    var texts = ['Use the scroll wheel to zoom',
        'Hold the shift key to select nodes'];

    svg.select('text')
        .data(texts)
        .enter()
        .append('text')
        .attr('x', 900)
        .attr('y', function(d,i) { return 470 + i * 18; })
        .text(function(d) { return d; }); */
    return graph;
}