const GRAPH_WIDTH = 1300;
const GRAPH_HEIGHT = 620;
const GRAPH_PADDING = 100;
const parseMonth = d3.timeParse('%m');
const formatMonth = d3.timeFormat('%B');
const formatNum = d3.format(".3f")

fetch('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
.then(res => res.json())
.then(data => {
    const BAR_WIDTH = (GRAPH_WIDTH - GRAPH_PADDING * 2) / data.monthlyVariance.length * 12 - 1;
    const BAR_HEIGHT = (GRAPH_HEIGHT - GRAPH_PADDING - 10) / 12 - 1;
    const MIN_YEAR = d3.min(data.monthlyVariance, d => d.year);
    const MAX_YEAR = d3.max(data.monthlyVariance, d => d.year);
    const BASE_TEMP = data.baseTemperature;
    const MIN_TEMP = d3.min(data.monthlyVariance, d => d.variance) + BASE_TEMP;
    const MAX_TEMP = d3.max(data.monthlyVariance, d => d.variance) + BASE_TEMP;
    // 11 colours for heat map selected to make near term warming more obvious
    const TEMP_COLOR_SCALE = ['#000099', '#0000FF', '#0080FF', '#66B2FF', '#99FFFF', '#33FF33', '#FFEA00', '#EC9706', '#FC6A03', '#FF0000', '#990000'];

    // graph description
    d3.select('.svgContainer')
    .append('div')
    .attr('id', 'description')
    .html(`Between ${MIN_YEAR} and ${MAX_YEAR}, the global land surface base temperature was ${formatNum(BASE_TEMP)}°C.`); 

    // set up svg canvas
    const heatMap = d3.select('.svgContainer')
    .append('svg')
    .attr('width', GRAPH_WIDTH)
    .attr('height', GRAPH_HEIGHT);

    // initialize tooltip div
    const tooltip = d3.select('.svgContainer')
    .append('div')
    .style('position', 'absolute')
    .attr('id', 'tooltip')
    .html('init')
    .style('opacity', 0);
    
    // years are discrete enough to use a continuous scale
    const xScale = d3.scaleLinear()
    .domain([MIN_YEAR, MAX_YEAR])
    .range([GRAPH_PADDING, GRAPH_WIDTH - GRAPH_PADDING]);

    // months are similarly discrete enough
    const yScale = d3.scaleLinear()
    .domain([0,11]) // would use 1-12 for months if not to pass test
    .range([10, GRAPH_HEIGHT - GRAPH_PADDING - BAR_HEIGHT]); // minus bar height, as bar grows down from 'y' attr by bar height

    // for coloring in heat values for each month
    const heatScale = d3.scaleQuantize()
    .domain([MIN_TEMP, MAX_TEMP])
    .range(TEMP_COLOR_SCALE)

    // build graph
    heatMap.selectAll('rect')
    .data(data.monthlyVariance)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month - 1)) // reduction here to pass test
    .attr('width', BAR_WIDTH)
    .attr('height', BAR_HEIGHT)
    .attr('fill', d => heatScale(d.variance + BASE_TEMP))
    .attr('data-year', d => d.year)
    .attr('data-month', d => d.month - 1) // reduction here to pass test
    .attr('data-temp', d => d.variance + BASE_TEMP)
    // add tooltip functionality
    .on('mouseover', function (e, d) {
        d3.select(this)
        .style('outline', '0.5px solid');
        tooltip.style('opacity', 1)
        .html(`${formatMonth(parseMonth(d.month))} ${d.year}: ${formatNum(d.variance + BASE_TEMP)}°C<br>
        ${
            d.variance > 0 ?
            `<span style='color: red'>${d.variance}°C above baseline</span>` :
            d.variance === 0 ?
            `<span style='color: green'>${d.variance}°C - at baseline</span>` :
            `<span style='color: blue'>${-d.variance}°C below baseline</span>`
        }`)
        .attr('data-year', d.year)
        .style('left', e.clientX + 16 + 'px')
        .style('top', e.clientY - 16 + 'px')
    }).on('mouseout', function (d, i) {
        d3.select(this)
        .style('outline', 'none');
        tooltip.style('opacity', 0)
        .style('top', 0);
    });

    const xAxis = d3.axisBottom(xScale).ticks(20, '.4'); // four figures for year
    const yAxis = d3.axisLeft(yScale)
    .tickFormat(x => formatMonth(parseMonth(x + 1))); // addition here to reverse test-passing reduction
    heatMap.append('g')
    .attr('transform', `translate (0, ${GRAPH_HEIGHT - GRAPH_PADDING})`)
    .attr('id', 'x-axis')
    .call(xAxis);
    heatMap.append('g')
    .attr('transform', `translate (${GRAPH_PADDING}, ${BAR_HEIGHT / 2})`) // y-translation here to center ticks against bars
    .attr('id', 'y-axis')
    .call(yAxis);

    heatMap.append('text')
    .attr('class', 'x axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', GRAPH_WIDTH / 2)
    .attr('y', GRAPH_HEIGHT - GRAPH_PADDING / 3 * 2)
    .text('Year');
    heatMap.append('text')
    .attr('class', 'y axis-label')
    .attr('text-anchor', 'middle')
    .attr('x', (GRAPH_PADDING - GRAPH_HEIGHT) / 2)
    .attr('y', GRAPH_PADDING / 3)
    .attr('transform', 'rotate(-90)')
    .text('Month');

    // build legend
    const legend = heatMap.append('g')
    .attr('x', GRAPH_PADDING * 2)
    .attr('y', GRAPH_HEIGHT - GRAPH_PADDING / 2)
    .attr('width', GRAPH_WIDTH / 2)
    .attr('height', BAR_HEIGHT)
    .attr('id', 'legend');

    legend.selectAll('rect')
    .data(heatScale.range())
    .enter()
    .append('rect')
    .attr('x', (d, i) => GRAPH_PADDING * 2 + i * BAR_HEIGHT * 2)
    .attr('y', GRAPH_HEIGHT - GRAPH_PADDING / 2)
    .attr('width', BAR_HEIGHT * 2)
    .attr('height', BAR_HEIGHT / 2)
    .attr('fill', d => d);

    // hacky stuff here to ensure scale values line up properly with color rectangles
    const legendScale = d3.scaleOrdinal()
    .domain([MIN_TEMP, ...TEMP_COLOR_SCALE.map((x, i) => MIN_TEMP + (i + 1) * ((MAX_TEMP - MIN_TEMP) / TEMP_COLOR_SCALE.length))])
    .range([0, ...TEMP_COLOR_SCALE.map((x, i) => (i + 1) * BAR_HEIGHT * 2)]);
    const legendAxis = d3.axisBottom(legendScale).tickFormat(formatNum);
    legend.append('g')
    .attr('transform', `translate (${GRAPH_PADDING * 2}, ${GRAPH_HEIGHT - GRAPH_PADDING / 2 + BAR_HEIGHT / 2})`)
    .attr('id', 'legend-axis')
    .call(legendAxis)
    .selectAll('text')
    .text(function() { return `${this.innerHTML}°C` });

    legend.append('text')
    .text('Temperature Range')
    .attr('id', 'legend-caption')
    .attr('y', GRAPH_HEIGHT - GRAPH_PADDING / 3)
    .attr('x', GRAPH_PADDING / 3 * 2);
})