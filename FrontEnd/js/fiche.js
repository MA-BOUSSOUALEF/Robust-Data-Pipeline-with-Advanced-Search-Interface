<<<<<<< HEAD
const ficheSelect = document.getElementById('ficheSelect');
const structureDiv = document.getElementById('fiche-structure');
const scientifiqueDiv = document.getElementById('fiche-scientifique');
const techniqueDiv = document.getElementById('fiche-technique');
const printBtn = document.getElementById('printBtn');
const exportBtn = document.getElementById('exportPdfBtn');

function afficherFiche(type) {
  structureDiv.classList.add('hidden');
  scientifiqueDiv.classList.add('hidden');
  techniqueDiv.classList.add('hidden');
  if (type === 'structure') structureDiv.classList.remove('hidden');
  else if (type === 'scientifique') scientifiqueDiv.classList.remove('hidden');
  else if (type === 'technique') techniqueDiv.classList.remove('hidden');
}

ficheSelect.addEventListener('change', () => {
  afficherFiche(ficheSelect.value);
  sessionStorage.setItem("filter", JSON.stringify({ key: ficheSelect.value }));
});
afficherFiche(JSON.parse(sessionStorage.getItem("filter"))?.key || 'structure');
if (JSON.parse(sessionStorage.getItem("filter"))?.key) {
  document.getElementById(JSON.parse(sessionStorage.getItem("filter"))?.key).setAttribute('selected', 'true');
}

function showAllSections() {
  structureDiv.classList.remove('hidden');
  scientifiqueDiv.classList.remove('hidden');
  techniqueDiv.classList.remove('hidden');
}

function saveVisibilityState() {
  return {
    structure: !structureDiv.classList.contains('hidden'),
    scientifique: !scientifiqueDiv.classList.contains('hidden'),
    technique: !techniqueDiv.classList.contains('hidden')
  };
}

function restoreVisibilityState(state) {
  if (!state.structure) structureDiv.classList.add('hidden');
  if (!state.scientifique) scientifiqueDiv.classList.add('hidden');
  if (!state.technique) techniqueDiv.classList.add('hidden');
}

printBtn.addEventListener('click', () => {
  const state = saveVisibilityState();
  showAllSections();
  const elementToPrint = document.getElementById("container-principal");
  printPartial(elementToPrint);
  setTimeout(() => {
    restoreVisibilityState(state);
  }, 1000);
});

exportBtn.addEventListener('click', () => {
  const state = saveVisibilityState();
  showAllSections();
  const container = document.getElementById("container-principal");
  container.classList.add("export");
  const options = {
    filename: 'fiches.pdf',
    margin: [10, 15, 10, 15],
    pagebreak: { mode: ['css'] },
    html2canvas: { scale: 2 }
  };
  html2pdf().set(options).from(container).save().then(() => {
    container.classList.remove("export");
    restoreVisibilityState(state);
  });
});

function printPartial(element) {
  const printContent = element.cloneNode(true);
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = '';
  document.body.appendChild(printContent);
  window.print();
  document.body.innerHTML = originalContent;
  location.reload();
}

async function getAddress(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.address) {
      console.log("Adresse trouvée :", data.display_name);
      return data.display_name;
    } else {
      console.log("Aucune adresse trouvée.");
      return "Adresse non trouvée.";
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'adresse :", error);
  }
}

async function loadStructure() {
  const urlParams = new URLSearchParams(window.location.search);
  const struct_num = urlParams.get('code');
  if (!struct_num) {
    document.getElementById("structure-wrap").innerHTML =
      "<p class='text-center text-red-500'>Paramètre 'code' manquant dans l'URL.</p>";
    return;
  }
  const detailsUrl = `http://127.0.0.1:8000/details/?code=${struct_num}`;
  const tutellesUrl = `http://127.0.0.1:8000/tutelles/?code=${struct_num}`;
  const federationsUrl = `http://127.0.0.1:8000/federations/?code=${struct_num}`;
  const sousStructuresUrl = `http://127.0.0.1:8000/sous_structures/?code=${struct_num}`;
  Promise.all([
    fetch(detailsUrl).then(res => res.json()),
    fetch(tutellesUrl).then(res => res.json()),
    fetch(federationsUrl).then(res => res.json()),
    fetch(sousStructuresUrl).then(res => res.json())
  ]).then(async ([detailsData, tutellesData, federationsData, sousStructuresData]) => {
    if (!(detailsData.data && detailsData.data.length > 0)) {
      document.getElementById("structure-wrap").innerHTML =
        "<p class='text-center text-gray-500'>Aucune donnée trouvée pour la structure.</p>";
      return;
    }
    let d = detailsData.data[0];
    let federationsHtml = "";
    if (federationsData.data && federationsData.data.length > 0) {
      federationsHtml = federationsData.data
        .map(fed => `<tr><td class="px-2 py-1 border-b border-gray-300">${fed.fede_acronyme || "N/A"}</td></tr>`)
        .join('');
    }
    let tutellesHtml = "";
    if (tutellesData.data && tutellesData.data.length > 0) {
      tutellesHtml = tutellesData.data
        .map(t => `<tr class="border-b border-gray-300">
                      <td class="px-2 py-1 border-r border-gray-300">${t.tutelle_acronyme || "N/A"}</td>
                      <td class="px-2 py-1">${t.tutelle_gestionnaire_o_n || "N/A"}</td>
                    </tr>`)
        .join('');
    }

     // <div class="mb-6">
        // <h2 class="text-lg font-bold text-gray-800 bg-blue-100 inline-block px-2 py-1 rounded">
         // Texte de présentation de la structure (en)
        //</h2>
       // <p class="mt-2 text-gray-700 leading-relaxed">${d.struct_presentation_en || ""}</p>
        // </div>
    //
    const address = await getAddress(d.struct_latitude, d.struct_longitude);
    let html = `
      <div class="pb-2 border-b-4 border-blue-700 mb-4">
        <h1 class="text-2xl font-bold text-gray-800">Fiche structure - ${d.struct_acronyme}</h1>
        <p class="text-xl text-blue-700 font-semibold">
          ${d.struct_acronyme}
          <span class="text-gray-600 font-normal block">
            ${d.struct_nom_fr}
          </span>
        </p>
        <p class="text-sm text-gray-500 italic">
          ${d.struct_nom_en || "None"}
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="space-y-1">
          <p><span class="font-semibold text-gray-700">Labellisation :</span> <span class="text-gray-800">${d.struct_labellisation || ""}</span></p>
          <p><span class="font-semibold text-gray-700">Identifiant RNSR :</span> <span class="text-gray-800">${d.struct_id_rnsr || ""}</span></p>
          <p><span class="font-semibold text-gray-700">Direction :</span> <span class="text-gray-800">${d.struct_direction || ""}</span></p>
        </div>
        <div class="space-y-1">
          <p><span class="font-semibold text-gray-700">Pôle UT :</span> <span class="text-gray-800">${d.poleut_acronyme || ""}</span></p>
          <p><span class="font-semibold text-gray-700">Directoire :</span> <span class="text-gray-800">${d.struct_directoire || ""}</span></p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-gray-50 p-4 rounded space-y-4 text-sm">
          <div>
            <h2 class="font-semibold text-gray-800 mb-2">Fédération(s)</h2>
            <table class="w-full border border-gray-300">
              <tbody>
                ${federationsHtml}
              </tbody>
            </table>
          </div>
          <div>
            <table class="w-full border border-gray-300">
              <thead class="bg-blue-200 text-gray-700">
                <tr>
                  <th class="px-2 py-1 border-r border-gray-300 text-left">Tutelle(s)</th>
                  <th class="px-2 py-1 text-left">Tutelle gestionnaire ?</th>
                </tr>
              </thead>
              <tbody>
                ${tutellesHtml}
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded text-sm space-y-2 text-gray-800">
          <p><span class="font-semibold">Composante ou Institut :</span> ${d.composante_ou_institut || ""}</p>
          <p><span class="font-semibold">Localisation :</span> ${d.struct_localisation || ""}</p>
          <p><span class="font-semibold">Adresse :</span><br />${d.struct_adresse}</p>
          <p><span class="font-semibold">URL :</span> <a href="${d.struct_url ? d.struct_url.replace("#", '') : "#"}" target="_blank" class="text-blue-600 underline">${d.struct_url ? d.struct_url.replace("#", '') : ""}</a></p>
          <p><span class="font-semibold">Effectif (permanents) HCERES 2019 :</span> ${d.struct_effectif_perm_hceres2019 || ""}</p>
        </div>
      </div>
      <div class="mb-6">
        <h2 class="text-lg font-bold text-gray-800 bg-blue-100 inline-block px-2 py-1 rounded">
          Autres rattachements
        </h2>
        <ul class="list-disc list-inside mt-2 text-gray-700 space-y-1">
          ${d.struct_autres_rattachements ? d.struct_autres_rattachements.split(";").map(item => `<li>${item}</li>`).join('') : ""}
        </ul>
      </div>
      <div class="mb-6">
        <h2 class="text-lg font-bold text-gray-800 bg-blue-100 inline-block px-2 py-1 rounded">
          Texte de présentation de la structure (fr)
        </h2>
        <p class="mt-2 text-gray-700 leading-relaxed">${d.struct_presentation_fr || ""}</p>
      </div>
  
      <div class="mt-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Équipes</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-blue-200 text-gray-800 uppercase">
                <th class="px-3 py-2 border border-gray-300 text-left">Acronyme</th>
                <th class="px-3 py-2 border border-gray-300 text-left">Nom en français</th>
                <th class="px-3 py-2 border border-gray-300 text-left">Nom en anglais</th>
                <th class="px-3 py-2 border border-gray-300 text-left">Direction</th>
              </tr>
            </thead>
            <tbody>
              ${sousStructuresData.data ? sousStructuresData.data.map(eq => `
                <tr class="bg-white">
                  <td class="px-3 py-2 border border-gray-300"><strong>${eq.ss_struct_acronyme}</strong></td>
                  <td class="px-3 py-2 border border-gray-300">${eq.ss_struct_nom_fr}</td>
                  <td class="px-3 py-2 border border-gray-300">${eq.ss_struct_nom_en}</td>
                  <td class="px-3 py-2 border border-gray-300">${eq.ss_struct_responsable_s}</td>
                </tr>
              `).join('') : ""}
              <tr class="bg-gray-50 italic">
                <td colspan="4" class="px-3 py-2 border border-gray-300 text-sm">
                  ${d.struct_acronyme} (Structure) : ${d.struct_nom_fr} <br />
                  Direction Générale : <strong>${d.struct_direction}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById("structure-wrap").innerHTML = html;
    var sciences_html = '';
    var fetchPromises = [];
    sousStructuresData.data.forEach(element => {
      let fetchPromise = fetch(`http://127.0.0.1:8000/keywords/?ss_struct_num=${element.ss_struct_num}`)
        .then(res => res.json())
        .then(data => {
          let keywords = data.data.map(keyword => `
            <li>${keyword.cs_mot_cle_fr}</li>
          `).join('');
          sciences_html += `
            <div class="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 fiche-spacing fiche-section">
              <div class="border-b-4 border-blue-700 pb-2">
                <h1 class="text-2xl font-bold text-gray-900">Fiche compétences scientifiques</h1>
                <p class="text-blue-700 font-semibold">${d.struct_acronyme} <span class="text-gray-600"> | Sous-structuration: ${d.struct_sous_structuration}</span></p>
              </div>
              <div class="mt-4">
                <p class="text-gray-700"><span class="font-semibold">Acronyme de la sous-structure :</span> <span class="text-gray-900">${element.ss_struct_acronyme}</span></p>
                <p class="text-gray-700"><span class="font-semibold">Nom de la sous-structure :</span> <span class="text-blue-700 font-semibold">${element.ss_struct_nom_fr}</span></p>
                <p class="text-gray-700"><span class="font-semibold">Nom en anglais :</span> <span class="text-gray-900">${element.ss_struct_nom_fr}</span></p>
                <p class="text-gray-700"><span class="font-semibold">URL :</span> <a href="${element.ss_struct_url_fr ? element.ss_struct_url_fr.replace("#", "") : "#"}" target="_blank" class="text-blue-600 underline">${element.ss_struct_url_fr ? element.ss_struct_url_fr.replace("#", "") : ""}</a></p>
              </div>
              <div class="mt-4">
                <p class="text-gray-700"><span class="font-semibold">Localisation :</span> ${element.j_localisation}</p>
              </div>
              <div class="mt-4">
                <h2 class="text-lg font-semibold text-gray-900 bg-blue-100 px-4 py-2 rounded-md">Texte à mots-clés</h2>
                <p class="text-gray-700 mt-2 text-sm leading-relaxed">
                  ${element.ss_struct_texte_fr}
                </p>
              </div>
              <div class="mt-4">
                <h2 class="text-lg font-semibold text-gray-900 bg-blue-100 px-4 py-2 rounded-md">Mot(s)-clé(s)</h2>
                <ul class="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  ${keywords}
                </ul>
              </div>
            </div>
            <div class="mb-6"></div>
          `;
        });
      fetchPromises.push(fetchPromise);
    });
    Promise.all(fetchPromises).then(() => {
      document.getElementById("sciences-wrap").innerHTML = sciences_html;
    });
  }).catch(error => {
    console.error("Error loading structure data:", error);
    document.getElementById("structure-wrap").innerHTML =
      "<p class='text-center text-red-500'>Erreur lors du chargement des données.</p>";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  loadStructure();
=======
const ficheSelect = document.getElementById('ficheSelect');
const structureDiv = document.getElementById('fiche-structure');
const scientifiqueDiv = document.getElementById('fiche-scientifique');
const techniqueDiv = document.getElementById('fiche-technique');
const printBtn = document.getElementById('printBtn');
const exportBtn = document.getElementById('exportPdfBtn');

function afficherFiche(type) {
  structureDiv.classList.add('hidden');
  scientifiqueDiv.classList.add('hidden');
  techniqueDiv.classList.add('hidden');
  if (type === 'structure') structureDiv.classList.remove('hidden');
  else if (type === 'scientifique') scientifiqueDiv.classList.remove('hidden');
  else if (type === 'technique') techniqueDiv.classList.remove('hidden');
}

ficheSelect.addEventListener('change', () => {
  afficherFiche(ficheSelect.value);
  sessionStorage.setItem("filter", JSON.stringify({ key: ficheSelect.value }));
});
afficherFiche(JSON.parse(sessionStorage.getItem("filter"))?.key || 'structure');
if (JSON.parse(sessionStorage.getItem("filter"))?.key) {
  document.getElementById(JSON.parse(sessionStorage.getItem("filter"))?.key).setAttribute('selected', 'true');
}

function showAllSections() {
  structureDiv.classList.remove('hidden');
  scientifiqueDiv.classList.remove('hidden');
  techniqueDiv.classList.remove('hidden');
}

function saveVisibilityState() {
  return {
    structure: !structureDiv.classList.contains('hidden'),
    scientifique: !scientifiqueDiv.classList.contains('hidden'),
    technique: !techniqueDiv.classList.contains('hidden')
  };
}

function restoreVisibilityState(state) {
  if (!state.structure) structureDiv.classList.add('hidden');
  if (!state.scientifique) scientifiqueDiv.classList.add('hidden');
  if (!state.technique) techniqueDiv.classList.add('hidden');
}

printBtn.addEventListener('click', () => {
  const state = saveVisibilityState();
  showAllSections();
  const elementToPrint = document.getElementById("container-principal");
  printPartial(elementToPrint);
  setTimeout(() => {
    restoreVisibilityState(state);
  }, 1000);
});

exportBtn.addEventListener('click', () => {
  const state = saveVisibilityState();
  showAllSections();
  const container = document.getElementById("container-principal");
  container.classList.add("export");
  const options = {
    filename: 'fiches.pdf',
    margin: [10, 15, 10, 15],
    pagebreak: { mode: ['css'] },
    html2canvas: { scale: 2 }
  };
  html2pdf().set(options).from(container).save().then(() => {
    container.classList.remove("export");
    restoreVisibilityState(state);
  });
});

function printPartial(element) {
  const printContent = element.cloneNode(true);
  const originalContent = document.body.innerHTML;
  document.body.innerHTML = '';
  document.body.appendChild(printContent);
  window.print();
  document.body.innerHTML = originalContent;
  location.reload();
}

async function getAddress(latitude, longitude) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.address) {
      console.log("Adresse trouvée :", data.display_name);
      return data.display_name;
    } else {
      console.log("Aucune adresse trouvée.");
      return "Adresse non trouvée.";
    }
  } catch (error) {
    console.error("Erreur lors de la récupération de l'adresse :", error);
  }
}

async function loadStructure() {
  const urlParams = new URLSearchParams(window.location.search);
  const struct_num = urlParams.get('code');
  if (!struct_num) {
    document.getElementById("structure-wrap").innerHTML =
      "<p class='text-center text-red-500'>Paramètre 'code' manquant dans l'URL.</p>";
    return;
  }

  const detailsUrl = `http://127.0.0.1:8000/details/?code=${struct_num}`;
  const tutellesUrl = `http://127.0.0.1:8000/tutelles/?code=${struct_num}`;
  const federationsUrl = `http://127.0.0.1:8000/federations/?code=${struct_num}`;
  const sousStructuresUrl = `http://127.0.0.1:8000/sous_structures/?code=${struct_num}`;
  Promise.all([
    fetch(detailsUrl).then(res => res.json()),
    fetch(tutellesUrl).then(res => res.json()),
    fetch(federationsUrl).then(res => res.json()),
    fetch(sousStructuresUrl).then(res => res.json())
  ]).then(async ([detailsData, tutellesData, federationsData, sousStructuresData]) => {
    if (!(detailsData.data && detailsData.data.length > 0)) {
      document.getElementById("structure-wrap").innerHTML =
        "<p class='text-center text-gray-500'>Aucune donnée trouvée pour la structure.</p>";
      return;
    }
    let d = detailsData.data[0];
    let federationsHtml = "";
    if (federationsData.data && federationsData.data.length > 0) {
      federationsHtml = federationsData.data
        .map(fed => `<tr><td class="px-2 py-1 border-b border-gray-300">${fed.fede_acronyme || "N/A"}</td></tr>`)
        .join('');
    }
    let tutellesHtml = "";
    if (tutellesData.data && tutellesData.data.length > 0) {
      tutellesHtml = tutellesData.data
        .map(t => `<tr class="border-b border-gray-300">
                      <td class="px-2 py-1 border-r border-gray-300">${t.tutelle_acronyme || "N/A"}</td>
                      <td class="px-2 py-1">${t.tutelle_gestionnaire_o_n || "N/A"}</td>
                    </tr>`)
        .join('');
    }
    const address = await getAddress(d.struct_latitude, d.struct_longitude);
    let html = `
      <div class="pb-2 border-b-4  border-blue-700 mb-4">
        <h1 class="text-2xl font-bold text-gray-800">Fiche structure - ${d.struct_acronyme}</h1>
        <p class="text-xl text-blue-700 font-semibold">
          ${d.struct_acronyme}
          <span class="text-gray-600 font-normal block">
            ${d.struct_nom_fr}
          </span>
        </p>
        <p class="text-sm text-gray-500 italic">
          ${d.struct_nom_en || "None"}
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ">
        <div class="space-y-1">
          <p><span class="font-semibold text-gray-700">Labellisation :</span> <span class="text-gray-800">${d.struct_labellisation || ""}</span></p>
          <p><span class="font-semibold text-gray-700">Identifiant RNSR :</span> <span class="text-gray-800">${d.struct_id_rnsr || ""}</span></p>
          <p><span class="font-semibold text-gray-700">Direction :</span> <span class="text-gray-800">${d.struct_direction || ""}</span></p>
        </div>
        <div class="space-y-1">
          <p><span class="font-semibold text-gray-700">Pôle UT :</span> <span class="text-gray-800">${d.poleut_acronyme || ""}</span></p>
          <p><span class="font-semibold text-gray-700">Directoire :</span> <span class="text-gray-800">${d.struct_directoire || ""}</span></p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-gray-50 p-4 rounded space-y-4 text-sm">
          <div>
            <h2 class="font-semibold text-gray-800 mb-2">Fédération(s)</h2>
            <table class="w-full border border-gray-300">
              <tbody>
                ${federationsHtml}
              </tbody>
            </table>
          </div>
          <div>
            <table class="w-full border border-gray-300">
              <thead class="bg-blue-200 text-gray-700">
                <tr>
                  <th class="px-2 py-1 border-r border-gray-300 text-left">Tutelle(s)</th>
                  <th class="px-2 py-1 text-left">Tutelle gestionnaire ?</th>
                </tr>
              </thead>
              <tbody>
                ${tutellesHtml}
              </tbody>
            </table>
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded text-sm space-y-2 text-gray-800">
          <p><span class="font-semibold">Composante ou Institut :</span> ${d.composante_ou_institut || ""}</p>
          <p><span class="font-semibold">Localisation :</span> ${d.struct_localisation || ""}</p>
          <p><span class="font-semibold">Adresse :</span><br />${address.replace("-", '<br>')}</p>
          <p><span class="font-semibold">URL :</span> <a href="${d.struct_url ? d.struct_url.replace("#", '') : "#"}" target="_blank" class="text-blue-600 underline">${d.struct_url ? d.struct_url.replace("#", '') : ""}</a></p>
          <p><span class="font-semibold">Effectif (permanents) HCERES 2019 :</span> ${d.struct_effectif_perm_hceres2019 || ""}</p>
        </div>
      </div>
      <div class="mb-6">
        <h2 class="text-lg font-bold text-gray-800 bg-blue-100 inline-block px-2 py-1 rounded">
          Autres rattachements
        </h2>
        <ul class="list-disc list-inside mt-2 text-gray-700 space-y-1">
          ${d.struct_autres_rattachements ? d.struct_autres_rattachements.split(";").map(item => `<li>${item}</li>`).join('') : ""}
        </ul>
      </div>
      <div class="mb-6">
        <h2 class="text-lg font-bold text-gray-800 bg-blue-100 inline-block px-2 py-1 rounded">
          Texte de présentation de la structure (fr)
        </h2>
        <p class="mt-2 text-gray-700 leading-relaxed">${d.struct_presentation_fr || ""}</p>
      </div>
      <div class="mb-6">
        <h2 class="text-lg font-bold text-gray-800 bg-blue-100 inline-block px-2 py-1 rounded">
          Texte de présentation de la structure (en)
        </h2>
        <p class="mt-2 text-gray-700 leading-relaxed">${d.struct_presentation_en || ""}</p>
      </div>
      <div class="mt-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Équipes</h2>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="bg-blue-200 text-gray-800 uppercase">
                <th class="px-3 py-2 border border-gray-300 text-left">Acronyme</th>
                <th class="px-3 py-2 border border-gray-300 text-left">Nom en français</th>
                <th class="px-3 py-2 border border-gray-300 text-left">Nom en anglais</th>
                <th class="px-3 py-2 border border-gray-300 text-left">Direction</th>
              </tr>
            </thead>
            <tbody>
              ${sousStructuresData.data ? sousStructuresData.data.map(eq => `
                <tr class="bg-white">
                  <td class="px-3 py-2 border border-gray-300"><strong>${eq.ss_struct_acronyme}</strong></td>
                  <td class="px-3 py-2 border border-gray-300">${eq.ss_struct_nom_fr}</td>
                  <td class="px-3 py-2 border border-gray-300">${eq.ss_struct_nom_en}</td>
                  <td class="px-3 py-2 border border-gray-300">${eq.ss_struct_responsable_s}</td>
                </tr>
              `).join('') : ""}
              <tr class="bg-gray-50 italic">
                <td colspan="4" class="px-3 py-2 border border-gray-300 text-sm">
                  ${d.struct_acronyme} (Structure) : ${d.struct_nom_fr} <br />
                  Direction Générale : <strong>${d.struct_direction}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    document.getElementById("structure-wrap").innerHTML = html;
    var sciences_html = '';
    var fetchPromises = [];
    var sous_structure_name="";
    sousStructuresData.data.forEach(element => {
      let fetchPromise = fetch(`http://127.0.0.1:8000/keywords/?ss_struct_num=${element.ss_struct_num}`)
        .then(res => res.json())
        .then(data => {
          let keywords = data.data.map(keyword => `
            <li>${keyword.cs_mot_cle_fr}</li>
          `).join('');
          sousStructure_name =d.struct_acronyme;
          sciences_html += `
            <div class="max-w-8xl mx-auto bg-gray-100 shadow-lg rounded-lg p-6 fiche-spacing fiche-section">
              <div class="border-b-4 border-blue-700 pb-2">
                <h1 class="text-2xl font-bold text-gray-900">Fiche compétences scientifiques</h1>
                <p class="text-blue-700 font-semibold">${d.struct_acronyme} <span class="text-gray-600"> | Sous-structuration: ${d.struct_sous_structuration}</span></p>
              </div>
              <div class="mt-4">
                <p class="text-gray-700"><span class="font-semibold">Acronyme de la sous-structure :</span> <span class="text-gray-900">${element.ss_struct_acronyme}</span></p>
                <p class="text-gray-700"><span class="font-semibold">Nom de la sous-structure :</span> <span class="text-blue-700 font-semibold">${element.ss_struct_nom_fr}</span></p>
                <p class="text-gray-700"><span class="font-semibold">Nom en anglais :</span> <span class="text-gray-900">${element.ss_struct_nom_fr}</span></p>
                <p class="text-gray-700"><span class="font-semibold">URL :</span> <a href="${element.ss_struct_url_fr ? element.ss_struct_url_fr.replace("#", "") : "#"}" target="_blank" class="text-blue-600 underline">${element.ss_struct_url_fr ? element.ss_struct_url_fr.replace("#", "") : ""}</a></p>
              </div>
              <div class="mt-4">
                <p class="text-gray-700"><span class="font-semibold">Localisation :</span> ${element.j_localisation}</p>
              </div>
              <div class="mt-4">
                <h2 class="text-lg font-semibold text-gray-900 bg-blue-100 px-4 py-2 rounded-md">Texte à mots-clés</h2>
                <p class="text-gray-700 mt-2 text-sm leading-relaxed">
                  ${element.ss_struct_texte_en}
                </p>
              </div>
              <div class="mt-4">
                <h2 class="text-lg font-semibold text-gray-900 bg-blue-100 px-4 py-2 rounded-md">Mot(s)-clé(s)</h2>
                <ul class="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  ${keywords}
                </ul>
              </div>
            </div>
            <div class="mb-6"></div>
          `;
        });
      fetchPromises.push(fetchPromise);
    });
    Promise.all(fetchPromises).then(() => {
      document.getElementById("sciences-wrap").innerHTML = sciences_html;
    });

    const API_URL = "http://localhost:8000/api/";
    const [technoData, competenceData, domaineData, platformeData] = await Promise.all([
      fetch(API_URL + "J_techno").then(res => res.json()),
      fetch(API_URL + "competence").then(res => res.json()),
      fetch(API_URL + "J_domaine").then(res => res.json()),
      fetch(API_URL + "platform").then(res => res.json())
    ]);
    const competencesAffichees = await fetch(`http://localhost:8000/api/cmpetence_structure?structure_num=${struct_num}`).then(res => res.json());
    var competenceHtml = '';
    competencesAffichees.forEach(async competence => {
  
      const technoTrouvee = technoData.filter(t => t.j_ct_num === competence.ct_num);
      const domainesTrouves = domaineData.filter(d => d.j_ct_num === competence.ct_num);
      const platformeTrouvee = platformeData.filter(p => p.j_ct_num === competence.ct_num);
      console.log("techno"+technoTrouvee);
      console.log("domaine"+domainesTrouves);
      console.log("platforme"+platformeTrouvee);
  
      const technoText = technoTrouvee.length ? technoTrouvee.map(t => t.j_ct_techno_fr).join("\n") : "Aucune techno disponible.";
      const domaineText = domainesTrouves.length ? domainesTrouves.map(d => d.j_ct_domaine).join("\n") : "Aucun domaine disponible.";
      const platformeText = platformeTrouvee.length ? platformeTrouvee.map(p => p.j_pf_nom).join("\n") : "Aucune plateforme disponible.";
  
      competenceHtml += ` 
      <br>
      </br>
      <div class="max-w-8xl mx-auto bg-gray-100 shadow-lg rounded-lg p-6 fiche-spacing fiche-section">
     
    <div class="pb-2 border-b-4 border-blue-700 mb-4">
    <h1 class="text-2xl font-bold text-gray-900">Fiche compétences Techniques :  ${sousStructure_name}</h1>
    <summary class="cursor-pointer text-blue-600 font-bold text-lg">
      <a href="${competence.ct_url.replace("#", '').replace("#", '')}" target="_blank" class="text-blue-600 underline">
        ${competence.ct_intitule_court_fr}</a> --
    </summary>
  </div>
  
  <fieldset class="w-full min-h-[420px] p-4 pt-6 border rounded-lg bg-white shadow-md relative">
    <legend class="text-black-500 p-2 rounded font-bold">Fiche Compétence Technique</legend>
  
    <!-- Intitulé court -->
    <div class="flex items-center gap-2">
      <legend class="w-48 bg-blue-200 text-black p-2 rounded font-bold">Intitulé court</legend>
      <span class="bg-white p-2 border rounded">${competence.ct_intitule_court_fr}</span>
    </div>
  
    <!-- URL -->
    <div class="flex items-center gap-2 mt-4">
      <legend class="w-48 bg-blue-200 text-black p-2 rounded font-bold">URL</legend>
      <span class="bg-white p-2 border rounded">${competence.ct_url.replace("#", '').replace("#", '') || "Non disponible"}</span>
    </div>
  
    <!-- Description -->
    <legend class="w-full bg-blue-200 text-black p-2 rounded mt-4">Description :</legend>
    <textarea class="w-full h-64 p-2 border rounded-lg bg-gray-200 text-gray-700 
      focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-y-auto" readonly>${competence.ct_description_fr || "Aucune description disponible."}</textarea>
  
    <!-- Plateforme(s) -->
    <legend class="text-blue-500 p-2 rounded underline font-bold mt-4">Rattachement(s) de la compétence technique :</legend>
    <legend class="w-full bg-gray-400 text-black p-2 rounded">Plateforme(s) :</legend>
    <textarea class="w-full h-20 p-2 border rounded-lg bg-gray-200 text-gray-700 
      focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
      style="white-space: pre-wrap; word-wrap: break-word;" readonly>${platformeText}</textarea>
  
    <!-- Plateau -->
    <div class="flex items-center gap-2 mt-4">
      <legend class="w-48 bg-blue-200 text-black p-2 rounded">Plateau :</legend>
      <span class="bg-white p-2 border rounded">${competence.ct_plateau || "Non disponible"}</span>
    </div>
  
    <!-- Domaine(s) et Technologie(s) -->
    <legend class="text-blue-500 p-2 rounded underline font-bold mt-4">Classification de la compétence technique :</legend>
    <div class="flex items-center gap-2">
      <legend class="w-1/2 bg-gray-400 text-black p-2 rounded">Domaine(s) :</legend>
      <legend class="w-1/2 bg-gray-400 text-black p-2 rounded">Technologie(s) :</legend>
    </div>
  
    <div class="flex items-center gap-2">
      <textarea class="w-1/2 h-32 p-2 border rounded-lg bg-gray-200 text-gray-700 
        focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
        style="white-space: pre-wrap; word-wrap: break-word;" readonly>${domaineText}</textarea>
  
      <textarea class="w-1/2 h-32 p-2 border rounded-lg bg-gray-200 text-gray-700 
        focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
        style="white-space: pre-wrap; word-wrap: break-word;" readonly>${technoText}</textarea>
    </div>
  
    <!-- Sous-domaine -->
    <div class="flex items-center gap-2 mt-4">
      <legend class="w-38 bg-blue-200 text-black p-2 rounded">Sous-domaine :</legend>
      <span class="bg-white p-2 border rounded">${competence.ct_ss_domaine || "Non disponible"}</span>
    </div>
  </fieldset>
  </div>
  
          
          `;
  
    });
    Promise.all(fetchPromises).then(() => {
      document.getElementById("tech-wrap").innerHTML = competenceHtml;
    });














  }).catch(error => {
    console.error("Error loading structure data:", error);
    document.getElementById("structure-wrap").innerHTML =
      "<p class='text-center text-red-500'>Erreur lors du chargement des données.</p>";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  loadStructure();
>>>>>>> a126cc6027a5ac1dbc7d0ca3de5346ac9e1f9348
});