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
  }).catch(error => {
    console.error("Error loading structure data:", error);
    document.getElementById("structure-wrap").innerHTML =
      "<p class='text-center text-red-500'>Erreur lors du chargement des données.</p>";
  });
}
document.addEventListener("DOMContentLoaded", () => {
  loadStructure();
});