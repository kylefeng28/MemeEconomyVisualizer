var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

// TODO: zoom, pan
// Zoom
svg.call(d3.zoom().on("zoom", function () {
	// svg.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
}));

// TODO more colors
var color = d3.scaleOrdinal(d3.schemeCategory20);

// Force directed graph simulation
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink().id((d) => d.id))
	.force("gravity", d3.forceManyBody().strength(1)) // d.mass?
	.force("collide", d3.forceCollide((d) => d.radius))
	.force("center", d3.forceCenter(width / 2, height / 2));

// Tooltip
var tooltip = d3.select("body")
	.append("div")
	.style("position", "absolute")
	.style("z-index", "10")
	.style("visibility", "hidden");

// Fetch data from JSON
// function getData() {
	d3.json("http://hgreer.com/meme/stocks", function (error, json) {
		if (error) throw error;

		// Scrape JSON
		var data = scrapeJSON(json);

		/*
		// Create link
		var link = svg.append("g")
		.attr("class", "links")
		.selectAll("line")
		.data(graph.links)
		.enter().append("line")
		.attr("stroke-width", (d) => Math.sqrt(d.value));
		 */

		// Create node
		var node = svg.append("g")
			.attr("class", "nodes")
			.selectAll("circle")
			.data(data)
			.enter().append("circle");

		node.each(((d) => {
				d.color = color(d.name);
				d.color_hover = color(d.name+1); // change it a bit TODO
				d.radius = d.count;
		}));

		// Title (on hover)
		node.append("title")
			.text((d) => d.name);

		// Size and color
		node.attr("r", (d) => d.radius )
			.attr("fill", (d) => d.color);

		// Mouse events
		node.call(d3.drag()
				.on("start", ondragstart)
				.on("drag", ondrag)
				.on("end", ondragend))
		.on("mouseover", onmouseover)
		.on("mouseout", onmouseout)
		.on("mousemove", onmousemove)
		.on("click", onclick);

		simulation
			.nodes(data)
			.on("tick", ontick);

		/* simulation.force("link")
		   .links(graph.links);
		 */

		function ontick() {
			// Update values
			/*
			   link
			   .attr("x1", (d) => d.source.x)
			   .attr("y1", (d) => d.source.y)
			   .attr("x2", (d) => d.target.x)
			   .attr("y2", (d) => d.target.y);
			 */

			node
				.attr("cx", (d) => d.x)
				.attr("cy", (d) => d.y);
		}
	});

//	return data;
// }

function updateData() {
	d3.json("http://hgreer.com/meme/stocks", function (error, json) {
		if (error) throw error;

		// Scrape data
		var data = scrapeJSON(json);

		// Update nodes
		var node = svg.select("g")
			.selectAll("circle")
			.data(data)
			.enter().append("circle");

		console.log(node)

		updateNode(node);
		node.each((d) => {
			console.log(d.radius)
		})

		simulation.nodes(data);

		// TODO update nodes, and new ones as needed
	});
}

/* Events */
function ondragstart(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

function ondrag(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
	moveTooltip(d);
}

function ondragend(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

function onmouseover(d) {
	d3.select(this).transition()
		.attr("stroke", (d) => d.color_hover)
		.attr("stroke-width", 10)
		.attr("r", (d) => d.radius * 1.2);
	showTooltip(d);
}

function onmouseout(d) {
	d3.select(this).transition()
		.attr("stroke", (d) => d.color)
		.attr("stroke-width", 0)
		.attr("r", (d) => d.radius);
	hideTooltip();
}

function onmousemove(d) {
	moveTooltip(d);
}

function onclick(d) {
	// Buy on left click, sell on right click
	// Prevent right click context menu (TODO: does not work)
	// d3.event.preventDefault();
	var cmd = prompt("Buy or sell?").toLowerCase();
	switch (cmd) {
		case "buy": buyMeme(d.name); break;
		case "sell": sellMeme(d.name); break;
	}
	return false;
}

/* Helpers */
// Scrape JSON into a list of stocks of { name, count }
function scrapeJSON(json) {
	var data = [];
	Object.entries(json).forEach(([key, value]) => {
		var stock = { name: key, count: value };
		data.push(stock);
	});
	return data;
}

function updateNode(node) {
	node.each(((d) => {
			d.color = color(d.name);
			d.color_hover = color(d.name+1); // change it a bit TODO
			d.radius = d.count;
	}));

	// Title (on hover)
	node.append("title")
		.text((d) => d.name);

	// Size and color
	node.attr("r", (d) => d.radius )
		.attr("fill", (d) => d.color);

	// Mouse events
	node.call(d3.drag()
			.on("start", ondragstart)
			.on("drag", ondrag)
			.on("end", ondragend))
	.on("mouseover", onmouseover)
	.on("mouseout", onmouseout)
	.on("mousemove", onmousemove)
	.on("click", onclick);
};

function showTooltip(d) {
	tooltip.style("visibility", "visible");
	tooltip.html("<b>"+d.name+"</b><br>"+d.count);
}

function moveTooltip(d) {
	// TODO put directly above node
	tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");
}

function hideTooltip() {
	tooltip.style("visibility", "hidden");
}

/* Business logic */
var iframe = d3.select("body").append("iframe").node();

// Buy meme
function buyMeme(meme) {
	var get_url = "http://hgreer.com/meme/buy?meme="+meme;
	iframe.src = get_url;
	alert("Bought meme: " + meme);
}

// Sell meme
function sellMeme(meme) {
	var get_url = "http://hgreer.com/meme/sell?meme="+meme;
	iframe.src = get_url;
	alert("Sold meme: " + meme);
}
