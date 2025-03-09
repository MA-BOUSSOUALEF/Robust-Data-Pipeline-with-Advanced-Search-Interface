// author : kritet ilyas

function truncateText(text, maxWords) {
    if (!text) return '';
    const words = text.split(/\s+/);
    return (words.length > maxWords) ? words.slice(0, maxWords).join(" ") + "…" : text;
}

const nomenMapping = {
    'j_hceres_sous_panel': 'Sous-panel',
    'hceres_panel_fr': 'Panel',
    'hceres_domaine_fr': 'Domaine'
};

const orgMapping = {
    'struct_acronyme': 'Sous-structure',
    'struct_poleut': 'Unité',
    'struct_directoire': 'Directoire'
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const struct_num = urlParams.get('code');
    const maxWordsParam = urlParams.get('maxWords');

    let response, jsonData, originalData;
    if (!struct_num) {
        response = await fetch(`http://127.0.0.1:8000/reqpanorama/`);
    } else {
        response = await fetch(`http://127.0.0.1:8000/reqpanoramabystruct?struct_num=${struct_num}`);
    }

    jsonData = await response.json();
    originalData = jsonData.data;

    const allSousStructures = Array.from(new Set(originalData.map(d => d.struct_acronyme)));
    const allUnites = Array.from(new Set(originalData.map(d => d.struct_poleut)));
    const allDirectoires = Array.from(new Set(originalData.map(d => d.struct_directoire)));

    const nomenSelect = document.getElementById('nomenSelect');
    const orgSelect = document.getElementById('orgSelect');
    const tooltip = document.getElementById('tooltip');

    function drawChart(nomenField, orgField) {
        d3.select("#chart").select("svg").remove();

        const grouped = d3.rollup(
            originalData,
            v => d3.sum(v, d => d.comptedej_hceres_sous_panel),
            d => d[nomenField],
            d => d[orgField]
        );

        const chartData = Array.from(grouped, ([nomenValue, orgMap]) => ({
            nomenValue,
            values: Array.from(orgMap, ([orgValue, val]) => ({ orgValue, val }))
        }));

        let allOrgs;
        if (orgField === 'struct_acronyme') {
            allOrgs = allSousStructures;
        } else if (orgField === 'struct_poleut') {
            allOrgs = allUnites;
        } else {
            allOrgs = allDirectoires;
        }

        let barHeight = 30;
        if (!struct_num) {
            if (nomenField === 'j_hceres_sous_panel' && orgField === 'struct_acronyme') {
                barHeight = 120;
            }
            if (nomenField === 'hceres_panel_fr' && (orgField === 'struct_directoire' || orgField === 'struct_acronyme')) {
                barHeight = 200;
            }
            if (nomenField === 'hceres_domaine_fr' && orgField === 'struct_acronyme') {
                barHeight = 300;
            }
        } else {
            barHeight = 10;
        }

        const dynamicHeight = chartData.length * barHeight + 200;
        const containerWidth = document.getElementById("chart").clientWidth;
        const width = containerWidth;
        const height = Math.max(dynamicHeight, 400);
        const margin = { top: 60, right: 200, bottom: 70, left: 300 };

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const maxVal = d3.max(chartData, d => d3.max(d.values, v => v.val)) || 0;
        const x = d3.scaleLinear()
            .domain([0, maxVal]).nice()
            .range([margin.left, width - margin.right]);

        const y0 = d3.scaleBand()
            .domain(chartData.map(d => d.nomenValue))
            .range([margin.top, height - margin.bottom])
            .paddingInner(0.1);

        const y1 = d3.scaleBand()
            .domain(allOrgs)
            .range([0, y0.bandwidth()])
            .padding(0.05);

        const minBarWidth = 10;
        const maxBarHeight = 60;
        const effectiveBarHeight = Math.min(y1.bandwidth(), maxBarHeight);
        const offsetY = (y1.bandwidth() - effectiveBarHeight) / 2;

        const color = d3.scaleOrdinal()
            .domain(allOrgs)
            .range(d3.schemeSet2);

        const groups = svg.selectAll(".group")
            .data(chartData)
            .join("g")
            .attr("class", "group")
            .attr("transform", d => `translate(0, ${y0(d.nomenValue)})`);

        groups.selectAll("rect")
            .data(d => d.values)
            .join("rect")
            .attr("x", x(0))
            .attr("y", d => y1(d.orgValue) + offsetY)
            .attr("width", d => {
                let barWidth = x(d.val) - x(0);
                return barWidth < minBarWidth ? minBarWidth : barWidth;
            })
            .attr("height", effectiveBarHeight)
            .attr("fill", d => color(d.orgValue))
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("height", effectiveBarHeight * 1.5)
                    .attr("y", y1(d.orgValue) + offsetY - (effectiveBarHeight * 0.5));
                tooltip.classList.remove("hidden");
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.pageX + 10) + "px";
                tooltip.style.top = (event.pageY - 20) + "px";
                tooltip.innerHTML = `<strong>${d.orgValue}</strong><br>Value: ${d.val}<br>X Scale: ${Math.round(x(d.val))}px`;
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("height", effectiveBarHeight)
                    .attr("y", y1(d.orgValue) + offsetY);
                tooltip.style.opacity = 0;
                tooltip.classList.add("hidden");
            });

        svg.append("g")
            .attr("transform", `translate(0, ${height - margin.bottom})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .style("font-size", "10px")
            .style("fill", "#333");

        const maxWords = maxWordsParam ? parseInt(maxWordsParam) : (nomenField === "j_hceres_sous_panel" ? 10 : 5);
        const yAxis = svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y0).tickFormat(d => truncateText(d, 4)));
        yAxis.selectAll("text")
            .style("font-size", "10px")
            .style("fill", "#333")
            .style("cursor", "pointer")
            .append("title")
            .text(d => d);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", margin.top / 2)
            .attr("text-anchor", "middle")
            .attr("class", "text-xl font-bold text-gray-800")
            .text(`Panorama: ${nomenMapping[nomenField]} / ${orgMapping[orgField]}`);

        const legend = svg.append("g")
            .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
        allOrgs.forEach((org, i) => {
            const lg = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);
            lg.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", color(org))
                .attr("stroke", "#333")
                .attr("stroke-width", 0.5);
            lg.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .attr("class", "text-sm text-gray-700")
                .text(org);
        });
    }

    drawChart(nomenSelect.value, orgSelect.value);

    nomenSelect.addEventListener("change", () => {
        drawChart(nomenSelect.value, orgSelect.value);
    });
    orgSelect.addEventListener("change", () => {
        drawChart(nomenSelect.value, orgSelect.value);
    });

    if (!struct_num) {
        document.getElementById("panoramaButton").style.display = "none";
    }
});