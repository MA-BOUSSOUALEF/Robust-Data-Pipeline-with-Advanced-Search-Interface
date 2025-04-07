 let allResults = [];
 let currentPage = 1;
 const pageSize = 5;
 let isFetching = false;
 let selectedCompetenceValue = "";

 function debounce(func, delay) {
   let timer;
   return function(...args) {
     clearTimeout(timer);
     timer = setTimeout(() => func.apply(this, args), delay);
   };
 }

 document.addEventListener("DOMContentLoaded", () => {
   fetchOptions("http://localhost:8000/autocomplete_domaine/", "domaine");
   resetSelect("panel");
   resetSelect("sous_panel");
   addEventListeners();
 });

 function addEventListeners() {
   document.getElementById("toggle-mode").addEventListener("change", toggleMode);

   document.getElementById("domaine").addEventListener("change", async () => {
     const val = document.getElementById("domaine").value;
     if (!val) {
       resetSelect("panel");
       resetSelect("sous_panel");
       maybeSearch();
       return;
     }
     const url = `http://localhost:8000/autocomplete_panel/?domaine=${encodeURIComponent(val)}`;
     await fetchOptions(url, "panel");
     maybeSearch();
   });
   document.getElementById("panel").addEventListener("change", async () => {
     const val = document.getElementById("panel").value;
     if (!val) {
       resetSelect("sous_panel");
       maybeSearch();
       return;
     }
     const url = `http://localhost:8000/autocomplete_sous_panel/?panel=${encodeURIComponent(val)}`;
     await fetchOptions(url, "sous_panel");
     maybeSearch();
   });
   document.getElementById("sous_panel").addEventListener("change", async () => {
     maybeSearch();
   });

   const textInput = document.getElementById("competence-text");
   textInput.addEventListener("input", debounce(autocompleteCompetence, 300));

   document.getElementById("semantic-search-btn").addEventListener("click", searchCompetenceSemantic);

   const semanticInput = document.getElementById("competence-semantic");
   semanticInput.addEventListener("keydown", (e) => {
     if (e.key === "Enter") {
       e.preventDefault();
       searchCompetenceSemantic();
     }
   });
   semanticInput.addEventListener("input", () => {
     if (!semanticInput.value.trim()) {
       clearResults();
     }
   });

   document.getElementById("reset-filters").addEventListener("click", resetFilters);
   document.getElementById("prev-page-btn").addEventListener("click", () => changePage(currentPage - 1));
   document.getElementById("next-page-btn").addEventListener("click", () => changePage(currentPage + 1));

   document.getElementById("semantic-domaine").addEventListener("change", () => {
     updateSemanticPanel();
     applySemanticFilters();
   });
   document.getElementById("semantic-panel").addEventListener("change", () => {
     updateSemanticSousPanel();
     applySemanticFilters();
   });
   document.getElementById("semantic-sous-panel").addEventListener("change", () => {
     applySemanticFilters();
   });
 }

 function toggleMode() {
   const isSemantic = document.getElementById("toggle-mode").checked;
   document.getElementById("text-search").classList.toggle("hidden", isSemantic);
   document.getElementById("semantic-search").classList.toggle("hidden", !isSemantic);
   clearResults();
   maybeSearch();
   if (document.getElementById("competence-semantic").value !== '')
     searchCompetenceSemantic();
 }

 function setFiltersDisabled(disabled) {
   const selects = ["domaine", "panel", "sous_panel"];
   selects.forEach(id => {
     const el = document.getElementById(id);
     if (el) {
       el.disabled = disabled;
       if (disabled) el.classList.add("disabled");
       else el.classList.remove("disabled");
     }
   });
 }

 async function fetchOptions(url, elementId) {
   const selectElement = document.getElementById(elementId);
   try {
     showLoading(true);
     setFiltersDisabled(true);
     const response = await fetch(url);
     if (!response.ok) {
       throw new Error(`HTTP error! status: ${response.status}`);
     }
     const data = await response.json();
     const suggestions = data.suggestions || [];
     selectElement.innerHTML = `<option value="">-- Sélectionnez ${elementId} --</option>`;
     suggestions.forEach(item => {
       const option = document.createElement("option");
       option.value = item;
       option.textContent = item;
       selectElement.appendChild(option);
     });
   } catch (error) {
     console.error("Error fetching options:", error);
   } finally {
     showLoading(false);
     setFiltersDisabled(false);
   }
 }

 function resetSelect(elementId) {
   const selectElement = document.getElementById(elementId);
   selectElement.innerHTML = `<option value="">-- Sélectionnez ${elementId} --</option>`;
 }

 async function autocompleteCompetence() {
   const query = document.getElementById("competence-text").value.trim();
   const autocompleteContainer = document.getElementById("autocomplete-list");
   selectedCompetenceValue = "";
   if (!query) {
     autocompleteContainer.innerHTML = "";
     autocompleteContainer.classList.add("hidden");
     maybeSearch();
     return;
   }
   const domaineVal = document.getElementById("domaine").value;
   const panelVal = document.getElementById("panel").value;
   const sousPanelVal = document.getElementById("sous_panel").value;
   let url = `http://localhost:8000/autocomplete_competence/?prefix=${encodeURIComponent(query)}`;
   if (domaineVal) url += `&domaine=${encodeURIComponent(domaineVal)}`;
   if (panelVal) url += `&panel=${encodeURIComponent(panelVal)}`;
   if (sousPanelVal) url += `&sous_panel=${encodeURIComponent(sousPanelVal)}`;
   try {
     showLoading(true);
     setFiltersDisabled(true);
     const response = await fetch(url);
     if (!response.ok) {
       throw new Error(`Error fetching autocomplete: ${response.status}`);
     }
     const data = await response.json();
     const suggestions = data.suggestions || [];
     autocompleteContainer.innerHTML = "";
     if (!suggestions.length) {
       autocompleteContainer.innerHTML = `<div class="text-gray-500 px-2 py-1">Aucun résultat</div>`;
       autocompleteContainer.classList.remove("hidden");
       return;
     }
     suggestions.forEach(item => {
       const div = document.createElement("div");
       div.textContent = item;
       div.addEventListener("click", async () => {
         selectedCompetenceValue = item;
         document.getElementById("competence-text").value = item;
         autocompleteContainer.classList.add("hidden");
         maybeSearch();
       });
       autocompleteContainer.appendChild(div);
     });
     autocompleteContainer.classList.remove("hidden");
   } catch (error) {
     console.error(error);
   } finally {
     showLoading(false);
     setFiltersDisabled(false);
   }
 }

 function maybeSearch() {
   if (document.getElementById("toggle-mode").checked) return;
   const domaineVal = document.getElementById("domaine").value;
   const panelVal = document.getElementById("panel").value;
   const sousPanelVal = document.getElementById("sous_panel").value;
   const noFilters = !domaineVal && !panelVal && !sousPanelVal;
   const noText = !selectedCompetenceValue;
   if (noFilters && noText) {
     clearResults();
     return;
   }
   searchCompetenceText(selectedCompetenceValue);
 }

 async function searchCompetenceText(query) {
   const domaineVal = document.getElementById("domaine").value;
   const panelVal = document.getElementById("panel").value;
   const sousPanelVal = document.getElementById("sous_panel").value;
   let url = `http://localhost:8000/search_competence/?mode=text&query=${encodeURIComponent(query)}`;
   if (domaineVal) url += `&domaine=${encodeURIComponent(domaineVal)}`;
   if (panelVal) url += `&panel=${encodeURIComponent(panelVal)}`;
   if (sousPanelVal) url += `&sous_panel=${encodeURIComponent(sousPanelVal)}`;
   await fetchAndDisplayResults(url);
 }

 // Semantic search function (with cascading filters)
 async function searchCompetenceSemantic() {
   const semanticInput = document.getElementById("competence-semantic");
   const userInput = semanticInput.value.trim();
   if (!userInput) {
     alert("Veuillez entrer un texte pour la recherche sémantique.");
     return;
   }
   const url = `http://localhost:8000/search_competence/?query=${encodeURIComponent(userInput)}&mode=semantic`;
   await fetchAndDisplayResults(url);
   document.getElementById("semantic-filters").classList.remove("hidden");
   updateSemanticDomaine();
 }

 async function fetchAndDisplayResults(url) {
   clearResults();
   try {
     isFetching = true;
     showLoading(true);
     setFiltersDisabled(true);
     const response = await fetch(url);
     if (!response.ok) {
       throw new Error(`Error searching competence: ${response.status}`);
     }
     const data = await response.json();
     allResults = data.results || [];
     currentPage = 1;
     renderPage(allResults);
   } catch (error) {
     console.error(error);
   } finally {
     showLoading(false);
     setFiltersDisabled(false);
     isFetching = false;
   }
 }

 function renderPage(results = allResults) {
   const container = document.getElementById("results-container");
   container.innerHTML = "";
   if (!results.length) {
     container.textContent = "Aucun résultat trouvé.";
     document.getElementById("pagination-controls").classList.add("hidden");
     return;
   }
   const startIndex = (currentPage - 1) * pageSize;
   const endIndex = startIndex + pageSize;
   const pageItems = results.slice(startIndex, endIndex);
   pageItems.forEach((item, index) => {
     const lineDiv = document.createElement("div");
     lineDiv.className = "border rounded p-4 mb-4 bg-gray-50";
     const sousStructureData = item.sous_structure || [];
     const structureData = item.structure || [];
     const struct_num = item.struct_num || '';
     const typeSousStruct = sousStructureData[0] || "TypeSousStruct?";
     const acrSousStruct = sousStructureData[2] || "AcrSS?";
     const nameSousStruct = sousStructureData[3] || "NomSousStruct?";
     const acrStruct = structureData[0] || "AcrStruct?";
     const nameStruct = structureData[1] || "NomStruct?";
     let sousStructURL = (sousStructureData[4] || "#");
     let structURL = (structureData[3] || "#");
     sousStructURL = sousStructURL && sousStructURL !== '#' ? sousStructURL.replace("#", "") : '#';
     structURL = structURL && structURL !== '#' ? structURL.replace("#", "") : '#';
     lineDiv.innerHTML = `
       <div>
         <span class="chevron" data-index="${startIndex + index}">▼</span>
         <a class="text-blue-600 underline" href="${sousStructURL}" target="_blank">
           <strong> ${acrSousStruct} (${nameSousStruct})</strong>
         </a>
         –
         <a class="text-blue-600 underline" href="${structURL}" target="_blank">
           ${acrStruct} (${nameStruct})
         </a>
         –
         <a href="./fiche.html?code=${struct_num}" target="_blank" class="text-blue-600 underline">
           Voir la fiche ${acrStruct}
         </a>
         –
         <a href="./panorama.html?code=${struct_num}" target="_blank" class="text-blue-600 underline">
           Voir le panorama scientifique ${acrStruct}
         </a>
       </div>
       <div class="ml-6 mt-2 hidden keywords-container"></div>
     `;
     container.appendChild(lineDiv);
   });
   const totalPages = Math.ceil(results.length / pageSize);
   document.getElementById("pagination-controls").classList.remove("hidden");
   document.getElementById("page-info").textContent =
     `Page ${currentPage} / ${totalPages} (Total: ${results.length} résultats)`;
   document.getElementById("prev-page-btn").disabled = currentPage <= 1;
   document.getElementById("next-page-btn").disabled = currentPage >= totalPages;
   const chevrons = container.querySelectorAll(".chevron");
   chevrons.forEach(chevron => {
     chevron.addEventListener("click", () => toggleKeywords(chevron));
   });
 }

 function changePage(newPage) {
   const totalPages = Math.ceil(allResults.length / pageSize);
   if (newPage < 1 || newPage > totalPages) return;
   currentPage = newPage;
   renderPage(allResults);
 }

 function toggleKeywords(chevronEl) {
   const idx = parseInt(chevronEl.getAttribute("data-index"), 10);
   const parent = chevronEl.closest("div");
   const keywordsContainer = parent.nextElementSibling;
   if (!keywordsContainer.classList.contains("hidden")) {
     keywordsContainer.classList.add("hidden");
     chevronEl.classList.remove("open");
     return;
   }
   chevronEl.classList.add("open");
   keywordsContainer.classList.remove("hidden");
   const item = allResults[idx];
   const keyWords = item.key_words || [];
   if (!keyWords.length) {
     keywordsContainer.innerHTML = "<div class='text-gray-500 text-sm'>Aucun mot-clé.</div>";
     return;
   }
   const lines = keyWords.map(kw => {
     const [fr] = kw;
     return `<li>${fr}</li>`;
   }).join("");
   keywordsContainer.innerHTML = `
     <ul class="list-disc pl-6 text-sm">
       ${lines}
     </ul>
   `;
 }

 function resetFilters() {
   document.getElementById("competence-text").value = "";
   selectedCompetenceValue = "";
   document.getElementById("competence-semantic").value = "";
   resetSelect("domaine");
   resetSelect("panel");
   resetSelect("sous_panel");
   fetchOptions("http://localhost:8000/autocomplete_domaine/", "domaine");
   const autocompleteContainer = document.getElementById("autocomplete-list");
   autocompleteContainer.innerHTML = "";
   autocompleteContainer.classList.add("hidden");
   document.getElementById("toggle-mode").checked = false;
   toggleMode();
   clearResults();
 }

 // Clear results container
 function clearResults() {
   allResults = [];
   currentPage = 1;
   document.getElementById("results-container").innerHTML = "";
   document.getElementById("pagination-controls").classList.add("hidden");
 }

 // Show or hide loading indicator
 function showLoading(isLoading) {
   const loader = document.getElementById("loading-indicator");
   loader.style.display = isLoading ? "block" : "none";
 }


 function updateSemanticDomaine() {
   const domaineSet = new Set();
   allResults.forEach(result => {
     if (result.domaine) domaineSet.add(result.domaine);
   });
   const semanticDomaineSelect = document.getElementById("semantic-domaine");
   semanticDomaineSelect.innerHTML = `<option value="">Tous les domaines</option>`;
   domaineSet.forEach(val => {
     const option = document.createElement("option");
     option.value = val;
     option.textContent = val;
     semanticDomaineSelect.appendChild(option);
   });
   resetSemanticPanel();
   resetSemanticSousPanel();
 }

 function resetSemanticPanel() {
   const semanticPanelSelect = document.getElementById("semantic-panel");
   semanticPanelSelect.innerHTML = `<option value="">Tous les panels</option>`;
 }

 function resetSemanticSousPanel() {
   const semanticSousPanelSelect = document.getElementById("semantic-sous-panel");
   semanticSousPanelSelect.innerHTML = `<option value="">Tous les sous-panels</option>`;
 }

 function updateSemanticPanel() {
   const selectedDomaine = document.getElementById("semantic-domaine").value;
   const panelSet = new Set();
   allResults.forEach(result => {
     if (selectedDomaine && result.domaine !== selectedDomaine) return;
     if (result.panel) panelSet.add(result.panel);
   });
   const semanticPanelSelect = document.getElementById("semantic-panel");
   semanticPanelSelect.innerHTML = `<option value="">Tous les panels</option>`;
   panelSet.forEach(val => {
     const option = document.createElement("option");
     option.value = val;
     option.textContent = val;
     semanticPanelSelect.appendChild(option);
   });
   resetSemanticSousPanel();
 }

 function updateSemanticSousPanel() {
   const selectedDomaine = document.getElementById("semantic-domaine").value;
   const selectedPanel = document.getElementById("semantic-panel").value;
   const sousPanelSet = new Set();
   allResults.forEach(result => {
     if (selectedDomaine && result.domaine !== selectedDomaine) return;
     if (selectedPanel && result.panel !== selectedPanel) return;
     if (result.sous_panel) sousPanelSet.add(result.sous_panel);
   });
   const semanticSousPanelSelect = document.getElementById("semantic-sous-panel");
   semanticSousPanelSelect.innerHTML = `<option value="">Tous les sous-panels</option>`;
   sousPanelSet.forEach(val => {
     const option = document.createElement("option");
     option.value = val;
     option.textContent = val;
     semanticSousPanelSelect.appendChild(option);
   });
 }

 function applySemanticFilters() {
   const selectedDomaine = document.getElementById("semantic-domaine").value;
   const selectedPanel = document.getElementById("semantic-panel").value;
   const selectedSousPanel = document.getElementById("semantic-sous-panel").value;
   let filteredResults = allResults;
   if (selectedDomaine) {
     filteredResults = filteredResults.filter(result => result.domaine === selectedDomaine);
   }
   if (selectedPanel) {
     filteredResults = filteredResults.filter(result => result.panel === selectedPanel);
   }
   if (selectedSousPanel) {
     filteredResults = filteredResults.filter(result => result.sous_panel === selectedSousPanel);
   }
   currentPage = 1;
   renderPage(filteredResults);
 }