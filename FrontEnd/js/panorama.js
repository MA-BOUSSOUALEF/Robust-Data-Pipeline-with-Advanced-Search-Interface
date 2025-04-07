let selectedAcronymes = new Set();
let selectedUnites = new Set();
let selectedDirectoires = new Set();

function truncateText(text, maxWords) {
    if (!text) return '';
    const words = text.split(/\s+/);
    return (words.length > maxWords)
        ? words.slice(0, maxWords).join(" ") + "…"
        : text;
}

const nomenMapping = {
    'j_hceres_sous_panel': 'Sous-panel',
    'hceres_panel_fr': 'Panel',
    'hceres_domaine_fr': 'Domaine'
};

const orgMapping = {
    'struct_acronyme': 'Unité(s)',
    'struct_poleut': 'Pôle(s) COMUE',
    'struct_directoire': 'Directoire(s)'
};

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const struct_num = urlParams.get('code');
    const maxWordsParam = urlParams.get('maxWords');

    let response;
    if (!struct_num) {
        response = await fetch(`http://127.0.0.1:8000/reqpanorama/`);
    } else {
        response = await fetch(`http://127.0.0.1:8000/reqpanoramabystruct?struct_num=${struct_num}`);
    }
    const jsonData = await response.json();
    let originalData = jsonData.data;


    const allSousStructures = Array.from(new Set(originalData.map(d => d.struct_acronyme)));
    const allUnites = Array.from(new Set(originalData.map(d => d.struct_poleut)));
    const allDirectoires = Array.from(new Set(originalData.map(d => d.struct_directoire)));


    console.log(allSousStructures);

    selectedAcronymes = new Set(allSousStructures);
    selectedUnites = new Set(allUnites);
    selectedDirectoires = new Set(allDirectoires);

    const nomenSelect = document.getElementById('nomenSelect');
    const orgSelect = document.getElementById('orgSelect');
    const orgCheckboxesContainer = document.getElementById('orgCheckboxes');
    const tooltip = document.getElementById('tooltip');

    const selectAllBtn = document.getElementById('selectAll');
    const deselectAllBtn = document.getElementById('deselectAll');

    function updateOrgCheckboxes(orgField) {
        orgCheckboxesContainer.innerHTML = '';
        let orgList;
        if (orgField === 'struct_acronyme') {
            orgList = allSousStructures;
        } else if (orgField === 'struct_poleut') {
            orgList = allUnites;
        } else {
            orgList = allDirectoires;
        }

        orgList.forEach(org => {
            const checkboxId = `org-${org.replace(/\s+/g, '-')}`;
            const wrapper = document.createElement('div');
            wrapper.classList.add('flex', 'items-center', 'mr-4');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.value = org;
            if (orgField === 'struct_acronyme') {
                checkbox.checked = selectedAcronymes.has(org);
            } else if (orgField === 'struct_poleut') {
                checkbox.checked = selectedUnites.has(org);
            } else {
                checkbox.checked = selectedDirectoires.has(org);
            }
            checkbox.classList.add('mr-1');

            checkbox.addEventListener('change', () => {
                if (orgField === 'struct_acronyme') {
                    checkbox.checked
                        ? selectedAcronymes.add(org)
                        : selectedAcronymes.delete(org);
                } else if (orgField === 'struct_poleut') {
                    checkbox.checked
                        ? selectedUnites.add(org)
                        : selectedUnites.delete(org);
                } else {
                    checkbox.checked
                        ? selectedDirectoires.add(org)
                        : selectedDirectoires.delete(org);
                }
                drawChart(nomenSelect.value, orgField);
            });

            const label = document.createElement('label');
            label.htmlFor = checkboxId;
            label.textContent = org;
            label.classList.add('text-gray-700', 'font-semibold');

            wrapper.appendChild(checkbox);
            wrapper.appendChild(label);
            orgCheckboxesContainer.appendChild(wrapper);
        });
    }

    function drawChart(nomenField, orgField) {
        d3.select("#chart").select("svg").remove();

        updateOrgCheckboxes(orgField);

        let selectedSet;
        if (orgField === 'struct_acronyme') {
            selectedSet = selectedAcronymes;
        } else if (orgField === 'struct_poleut') {
            selectedSet = selectedUnites;
        } else {
            selectedSet = selectedDirectoires;
        }

        const grouped = d3.rollup(
            originalData,
            v => d3.sum(v, d => d.comptedej_hceres_sous_panel),
            d => d[nomenField],
            d => d[orgField]
        );

        let chartData = Array.from(grouped, ([nomenValue, orgMap]) => ({
            nomenValue,
            values: Array.from(orgMap, ([orgValue, val]) => ({ orgValue, val }))
        }));

        



        chartData.forEach(d => {
            d.values = d.values.filter(v => selectedSet.has(v.orgValue));
        });
        chartData = chartData.filter(d => d.values.length > 0);
        const checkboxes = document.querySelectorAll('#orgCheckboxes input[type="checkbox"]');
        let sum = 0;

        checkboxes.forEach(checkbox => {
            if (checkbox.checked == true) {
                sum++;
            }
        });

        let barHeight =  5* sum;

        if(struct_num){
            document.getElementById("filter-unite").style.display = "none";
        }
     

        const dynamicHeight = chartData.length * barHeight + 200;

        const containerWidth = document.getElementById("chart").clientWidth;
        const width = containerWidth;
        const height = Math.max(dynamicHeight, 400);
        const margin = { top: 60, right: 200, bottom: 70, left: 500 };

        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const maxVal = d3.max(chartData, d => d3.max(d.values, v => v.val)) || 0;

        const x = d3.scaleLinear()
            .domain([0, 1]) 
            .range([margin.left, width - margin.right]);

        const y0 = d3.scaleBand()
            .domain(chartData.map(d => d.nomenValue))
            .range([margin.top, height - margin.bottom])
            .paddingInner(0.1);

        const selectedOrgArray = Array.from(selectedSet).sort();
        const availableSubHeight = y0.bandwidth();
        const defaultSubHeight = availableSubHeight / selectedOrgArray.length;
        const desiredMaxSubBand = 40;
        const subBandHeight = Math.min(defaultSubHeight, desiredMaxSubBand);
        const totalSubRange = subBandHeight * selectedOrgArray.length;
        const y1 = d3.scaleBand()
            .domain(selectedOrgArray)
            .range([(availableSubHeight - totalSubRange) / 2, (availableSubHeight + totalSubRange) / 2])
            .padding(0.05);

        const effectiveBarHeight = y1.bandwidth();

        const groups = svg.selectAll(".group")
            .data(chartData)
            .join("g")
            .attr("class", "group")
            .attr("transform", d => `translate(0, ${y0(d.nomenValue)})`);

        groups.selectAll("rect")
            .data(d => d.values)
            .join("rect")
            .attr("x", x(0))
            .attr("y", d => y1(d.orgValue) + ((y1.bandwidth() - effectiveBarHeight) / 2))
            .attr("width", d => {
                if (!maxVal) return 0;
                const fraction = Math.min((d.val / maxVal) *3 , 1);

                const barWidth = x(fraction) - x(0);
                return barWidth < 5 ? 5 : barWidth; 
            })
            .attr("height", effectiveBarHeight)
            .attr("fill", d => {
                const colorScale = d3.scaleOrdinal()
                    .domain(selectedOrgArray)
                    .range(d3.schemeSet2);
                return colorScale(d.orgValue);
            })
            .style("cursor", "pointer")
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("height", effectiveBarHeight * 1.5)
                    .attr("y", y1(d.orgValue) + ((y1.bandwidth() - effectiveBarHeight) / 2) - (effectiveBarHeight * 0.5));

                tooltip.classList.remove("hidden");
                tooltip.style.opacity = 1;
                tooltip.style.left = (event.pageX + 10) + "px";
                tooltip.style.top = (event.pageY - 20) + "px";

                const pct = maxVal ? ((d.val / maxVal) * 100).toFixed(1) : 0;
                tooltip.innerHTML = `
          <strong>${d.orgValue}</strong><br>
          Valeur: ${d.val}<br>
          Pourcentage: ${pct}%
        `;
            })
            .on("mouseout", function (event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("height", effectiveBarHeight)
                    .attr("y", d => y1(d.orgValue) + ((y1.bandwidth() - effectiveBarHeight) / 2));

                tooltip.style.opacity = 0;
                tooltip.classList.add("hidden");
            });

      

        const maxWords = maxWordsParam ? parseInt(maxWordsParam) : (nomenField === "j_hceres_sous_panel" ? 20 : 30);
        const yAxis = svg.append("g")
            .attr("transform", `translate(${margin.left},0)`)
            .call(d3.axisLeft(y0).tickFormat(d => truncateText(d, 13)));

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
            .text(`Panorama des compétences scientifiques`);

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom / 2 + 15)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .text("Répartition des compétences scientifiques des Unités de recherche dans la nomenclature HCERES")

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom / 2 + 35)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("margin", "12px")
            .text("(NB : une compétence peut relever d'un ou plusieurs sous-panels/panels/domaines)")

        const legend = svg.append("g")
            .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);
        const uniqueSelectedOrgs = Array.from(selectedSet);
        uniqueSelectedOrgs.forEach((org, i) => {
            const lg = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            lg.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", (() => {
                    const colorScale = d3.scaleOrdinal()
                        .domain(uniqueSelectedOrgs)
                        .range(d3.schemeSet2);
                    return colorScale(org);
                })())
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

    nomenSelect.addEventListener('change', () => {
        drawChart(nomenSelect.value, orgSelect.value);
    });

    orgSelect.addEventListener('change', () => {
        updateOrgCheckboxes(orgSelect.value);
        drawChart(nomenSelect.value, orgSelect.value);
    });

    selectAllBtn?.addEventListener('click', function () {
        const orgField = orgSelect.value;
        const checkboxes = document.querySelectorAll('#orgCheckboxes input[type="checkbox"]');

        if (orgField === 'struct_acronyme') {
            selectedAcronymes = new Set(allSousStructures);
        } else if (orgField === 'struct_poleut') {
            selectedUnites = new Set(allUnites);
        } else {
            selectedDirectoires = new Set(allDirectoires);
        }
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        drawChart(nomenSelect.value, orgField);
    });

    deselectAllBtn?.addEventListener('click', function () {
        const orgField = orgSelect.value;
        const checkboxes = document.querySelectorAll('#orgCheckboxes input[type="checkbox"]');

        if (orgField === 'struct_acronyme') {
            selectedAcronymes.clear();
        } else if (orgField === 'struct_poleut') {
            selectedUnites.clear();
        } else {
            selectedDirectoires.clear();
        }
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        drawChart(nomenSelect.value, orgField);
    });

    if (!struct_num) {
        const panoBtn = document.getElementById("panoramaButton");
        if (panoBtn) {
            panoBtn.style.display = "none";
        }
    }
});
