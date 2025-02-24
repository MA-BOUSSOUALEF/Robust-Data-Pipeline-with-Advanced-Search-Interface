const API_URL = "http://localhost:8000/api/";
/////////////////////////////////////////////////////////////////////////les filtres avec suggestion ///////////////////////////////////////////////////////////
let technoSelectionnee = "";
let domaineSelectionne = "";
let platformeSelectionnee = "";  
let num ="";


document.addEventListener("DOMContentLoaded", async function () {
    await chargerTousLesFiltres(); // Charger les données initiales

    // Ajout d'écouteurs pour filtrage dynamique
    document.getElementById("Techno-list").addEventListener("change", chargerTousLesFiltres);
    document.getElementById("domaine-list").addEventListener("change", chargerTousLesFiltres);
    document.getElementById("platforme-list").addEventListener("change", chargerTousLesFiltres);
});
  
/**
 * Charge toutes les données et applique les filtres si nécessaire.
 */
async function chargerTousLesFiltres() {
    try {
        // Récupération des valeurs sélectionnées
         technoSelectionnee = document.getElementById("Techno-list").value;
         domaineSelectionne = document.getElementById("domaine-list").value;
         platformeSelectionnee = document.getElementById("platforme-list").value;
         

        // Récupération des données depuis l'API
        const [platformes, domaines, technos] = await Promise.all([
            fetch(API_URL + "platforme").then(res => res.json()),
            fetch(API_URL + "Domaine").then(res => res.json()),
            fetch(API_URL + "techno").then(res => res.json())
        ]);

        // Filtrage intelligent des données
        let domainesFiltres = domaines;
        let platformesFiltres = platformes;
        let technosFiltres = technos;


        if (technoSelectionnee) {
          // tout les num de techno qui ont la techno selectionnée
          All_num_techno = technos.filter(t => t.j_ct_techno_fr === technoSelectionnee).map(t => t.j_ct_num); 
          alert(All_num_techno)
          domainesFiltres = domaines.filter(d => All_num_techno.includes(d.j_ct_num));
          alert(domainesFiltres)
          platformesFiltres = platformes.filter(p => All_num_techno.includes(p.j_ct_num));
          alert(platformesFiltres)
          num = All_num_techno;
        }
        if (domaineSelectionne) {
            // tout les num de domaine qui ont le domaine selectionné
            All_num_domaine = domaines.filter(d => d.j_ct_domaine === domaineSelectionne).map(d => d.j_ct_num);
            alert(All_num_domaine)
            technosFiltres = technos.filter(t =>All_num_domaine.includes(t.j_ct_num));
            alert(technosFiltres)
            platformesFiltres = platformes.filter(p => All_num_domaine.includes(p.j_ct_num));
            alert(platformesFiltres)
            num = All_num_domaine
        }
        if (platformeSelectionnee) {
            // tout les num de platforme qui ont la platforme selectionnée
            All_num_platforme = platformes.filter(p => p.j_pf_nom === platformeSelectionnee).map(p => p.j_ct_num);
            technosFiltres = technos.filter(t => All_num_platforme.includes(t.j_ct_num));
            domainesFiltres = domaines.filter(d => All_num_platforme.includes(d.j_ct_num));
            num = All_num_platforme
        }

        // Mise à jour des listes déroulantes
        remplirSelect("Techno-list", technosFiltres, "j_ct_num", "j_ct_techno_fr", "Sélectionnez une technologie");
        remplirSelect("domaine-list", domainesFiltres, "j_ct_num", "j_ct_domaine", "Sélectionnez un domaine");
        remplirSelect("platforme-list", platformesFiltres, "j_ct_num", "j_pf_nom", "Sélectionnez une plateforme");

    } catch (error) {
        console.error("Erreur lors du chargement des filtres :", error);
        alert("Impossible de charger les données !");
    }
}

/**
 * Remplit un `<select>` avec des données.
 * @param {string} id - ID du select
 * @param {Array} data - Données à afficher
 * @param {string} valueKey - Clé pour la valeur de l'option
 * @param {string} textKey - Clé pour le texte affiché
 * @param {string} defaultText - Texte par défaut
 */
function remplirSelect(id, data, valueKey, textKey, defaultText) {
    const select = document.getElementById(id);
    if (!select) return;

    select.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
    if (Array.isArray(data) && data.length > 0) {
        data.forEach(item => {
            if (item[valueKey] && item[textKey]) {
                const option = document.createElement("option");
                option.value = item[textKey];
                option.textContent = item[textKey];
                select.appendChild(option);
            }
        });
    }
}




//////////////////////////////////////////////////////////suggstions /////////////////////////////////////////////////////////////////////////////////////////////////
// obtenir les suggestions depuis l'API
const searchInput = document.getElementById("search-input");
const suggestionsList = document.getElementById("suggestions-list");
async function fetchSuggestions(query) {
  try {
    const response = await fetch(`http://localhost:8000/api/suggestions?query=${query}`);
    if (!response.ok) throw new Error("Erreur lors de la récupération des suggestions");

    const suggestions = await response.json();
    displaySuggestions(suggestions);  // Afficher les suggestions
  } catch (error) {
    console.error("Erreur :", error);
    suggestionsList.innerHTML = "<li class='text-red-500'>Erreur lors du chargement des suggestions</li>";
  }
}
// Fonction pour afficher les suggestions dans la liste
function displaySuggestions(suggestions) {
  suggestionsList.innerHTML = "";  // Vider la liste avant d'ajouter de nouvelles suggestions
  // if (suggestions.length === 0) {
  //   searchInput.value = searchInput.value.trim();
    
  // }
  suggestions.forEach(suggestion => {
    const li = document.createElement("li");
    li.classList.add("p-2", "cursor-pointer", "hover:bg-blue-100");
    li.textContent = suggestion;
    li.addEventListener("click", () => {
      searchInput.value = suggestion;  // Remplir l'input avec la suggestion
      suggestionsList.innerHTML = "";  // Effacer la liste après la sélection
    });
    suggestionsList.appendChild(li);
  });
}
// Écouter les entrées de l'utilisateur et appeler l'API
searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  if (query.length > 2) {  // Lancer la recherche si la longueur est supérieure à 2 caractères
    fetchSuggestions(query);
  } else {
    suggestionsList.innerHTML = "";  // Effacer la liste si la recherche est vide
  }
});




///////////////////////////////////////////////////////////////////////remplissage des champs//////////////////////////////////////////////

// // Charger la description de la compétence
// async function chargerDescription() {
//   try {
//     const query = document.getElementById("search-input").value.trim();
//     if (!query && !technoSelectionnee && !domaineSelectionne && !platformeSelectionnee) {
//       console.warn("Le champ de recherche est vide.");
//       alert("Veuillez entrer un intitulé de compétence.");
//       return;
//     }

//     // Vérification et récupération des données API
//     const techo_reponse = await fetch(API_URL + "J_techno");
//     if (!techo_reponse.ok) throw new Error("Erreur lors de la récupération des technologies");

//     const response = await fetch(API_URL + "competence");
//     if (!response.ok) throw new Error("Erreur lors de la récupération des compétences");

//     const domaine_response = await fetch(API_URL + "J_domaine");
//     if (!domaine_response.ok) throw new Error("Erreur lors de la récupération des domaines");

//     const platforme_response = await fetch(API_URL + "platform");
//     if (!platforme_response.ok) throw new Error("Erreur lors de la récupération des plateformes");

//     // Parsing des réponses JSON
//     const competences = await response.json();
//     const techno = await techo_reponse.json();
//     const domaine = await domaine_response.json();
//     const platforme = await platforme_response.json();

//     // Vérification des éléments DOM
//     const description = document.getElementById("description");
//     const platforme_text = document.getElementById("platform"); 
//     const techno_text = document.getElementById("techno");
//     const domaine_text = document.getElementById("domaine");
//     const ss_domaine = document.getElementById("sous_domaine");
//     const plateau = document.getElementById("plateau");
//     const url_text = document.getElementById("url");
//     const intitul = document.getElementById("intitul");
//     const intutli_titre = document.getElementById("search-resultats");

//     if (!description || !platforme_text || !techno_text || !domaine_text || !ss_domaine || !plateau || !url_text || !intitul || !intutli_titre) {
//       alert("Un ou plusieurs éléments DOM sont introuvables.");
//       return;
//     }

//     // Trouver la compétence correspondant à l'intitulé recherché
//     let competenceTrouvee = ""; 
    
//     if (query) {
//       competenceTrouvee = competences.find(c => c.ct_intitule_court_fr === query);
//     }
//     else {
//       competenceTrouvee = competences.find(c => c.ct_num === num);
//     }



//     if (!competenceTrouvee) {
//       description.value = "Aucune description disponible.";
//       techno_text.value = "Aucune techno disponible.";
//       domaine_text.value = "Aucun domaine disponible.";
//       platforme_text.value = "Aucune plateforme disponible.";
//       return;
//     }

//     // Filtrage des résultats
//     const technoTrouvee = techno.filter(t => t.j_ct_num === competenceTrouvee.ct_num);
//     const domainesTrouves = domaine.filter(d => d.j_ct_num === competenceTrouvee.ct_num);
//     const platformeTrouvee = platforme.filter(p => p.j_ct_num === competenceTrouvee.ct_num);

//     // Mise à jour du DOM
//     description.value = competenceTrouvee.ct_description_fr || "Aucune description disponible.";
//     techno_text.value = technoTrouvee.length ? technoTrouvee.map(d => d.j_ct_techno_fr).join("\n") : "Aucune techno disponible.";
//     domaine_text.value = domainesTrouves.length ? domainesTrouves.map(d => d.j_ct_domaine).join("\n") : "Aucun domaine disponible.";
//     platforme_text.value = platformeTrouvee.length ? platformeTrouvee.map(d => d.j_pf_nom).join("\n") : "Aucune plateforme disponible.";

//     ss_domaine.textContent = competenceTrouvee.ct_ss_domaine;
//     plateau.textContent = competenceTrouvee.ct_plateau;
//     url_text.textContent = competenceTrouvee.ct_url;
//     intitul.textContent = competenceTrouvee.ct_intitule_court_fr;

//     let titreCompetence = encodeURIComponent(competenceTrouvee.ct_intitule_court_fr);
//     intutli_titre.innerHTML = `
//     ${competenceTrouvee.ct_intitule_court_fr} -- 
//     <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
//       CAGT (Centre d'Anthropobiologie et de Génomique de Toulouse)
//     </a> -- 
//     <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
//       Voir la fiche CAGT
//     </a> -- 
//     <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
//       Voir le panorama scientifique CAGT
//     </a> 
//   `;

//   } catch (error) {
//     console.error("Erreur lors du chargement des compétences :", error);
//     alert("Impossible de charger les compétences !");
//   }
// }

// // Charger la description au clic sur le bouton
// document.getElementById("recherche").addEventListener("click", chargerDescription);


// // Charger techno et domaine au clic sur le bouton


// async function chargerDescription() {
//   try {
//     const query = document.getElementById("search-input").value.trim();
//     if (!query && !technoSelectionnee && !domaineSelectionne && !platformeSelectionnee) {
//       console.warn("Le champ de recherche est vide.");
//       alert("Veuillez entrer un intitulé de compétence.");
//       return;
//     }

//     // Récupération des données depuis l'API
//     const [technoData, competenceData, domaineData, platformeData] = await Promise.all([
//       fetch(API_URL + "J_techno").then(res => res.json()),
//       fetch(API_URL + "competence").then(res => res.json()),
//       fetch(API_URL + "J_domaine").then(res => res.json()),
//       fetch(API_URL + "platform").then(res => res.json())
//     ]);

//     const resultatsContainer = document.getElementById("resultats");
//     resultatsContainer.innerHTML = ""; // Nettoyage du conteneur avant l'ajout des nouveaux résultats

//     let competencesTrouvees = [];

//     if (query) {
//       const competence = competenceData.find(c => c.ct_intitule_court_fr === query);
//       if (competence) competencesTrouvees.push(competence);
//     } else if (num.length > 0) {
//       competencesTrouvees = competenceData.filter(c => num.includes(c.ct_num));
//     }

//     if (competencesTrouvees.length === 0) {
//       resultatsContainer.innerHTML = "<p class='text-red-500 font-bold'>Aucune compétence trouvée.</p>";
//       return;
//     }

//     competencesTrouvees.forEach(competence => {
//       const technoTrouvee = technoData.filter(t => t.j_ct_num === competence.ct_num);
//       const domainesTrouves = domaineData.filter(d => d.j_ct_num === competence.ct_num);
//       const platformeTrouvee = platformeData.filter(p => p.j_ct_num === competence.ct_num);

//       const technoText = technoTrouvee.length ? technoTrouvee.map(t => t.j_ct_techno_fr).join("\n") : "Aucune techno disponible.";
//       const domaineText = domainesTrouves.length ? domainesTrouves.map(d => d.j_ct_domaine).join("\n") : "Aucun domaine disponible.";
//       const platformeText = platformeTrouvee.length ? platformeTrouvee.map(p => p.j_pf_nom).join("\n") : "Aucune plateforme disponible.";

//       let titreCompetence = encodeURIComponent(competence.ct_intitule_court_fr);

//       const detailsElement = document.createElement("details");
//       detailsElement.className = "border p-2 w-1/2 rounded-lg shadow-md bg-gray-100";
//       detailsElement.innerHTML = `
//         <summary class="cursor-pointer text-blue-600 font-bold text-lg">
//           ${competence.ct_intitule_court_fr} --
//           <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
//             CAGT
//           </a> --
//           <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
//             Voir la fiche CAGT
//           </a> --
//           <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
//             Voir le panorama scientifique CAGT
//           </a>
//         </summary>
        // <fieldset class="w-full min-h-[420px] p-4 pt-6 border rounded-lg bg-white shadow-md relative">
        //   <legend class="text-black-500 p-2 rounded font-bold">Fiche Compétence Technique</legend>

        //   <div class="flex items-center gap-2">
        //     <legend class="w-48 bg-blue-200 text-black p-2 rounded font-bold">Intitulé court</legend>
        //     <span class="bg-white p-2 border rounded">${competence.ct_intitule_court_fr}</span>
        //   </div>
        //   <br/>

        //   <div class="flex items-center gap-2">
        //     <legend class="w-48 bg-blue-200 text-black p-2 rounded font-bold">URL</legend>
        //     <span class="bg-white p-2 border rounded">${competence.ct_url || "Non disponible"}</span>
        //   </div>
        //   <br/>

        //   <legend class="w-full bg-blue-200 text-black p-2 rounded">Description :</legend>
        //   <textarea class="w-full h-64 p-2 border rounded-lg bg-gray-200 text-gray-700 
        //     focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-y-auto" readonly>${competence.ct_description_fr || "Aucune description disponible."}</textarea>

        //   <legend class="text-blue-500 p-2 rounded underline font-bold">Rattachement(s) de la compétence technique :</legend>
        
        //   <legend class="w-full bg-gray-400 text-black p-2 rounded">Plateforme(s) :</legend>
        //   <textarea class="w-full h-20 p-2 border rounded-lg bg-gray-200 text-gray-700 
        //     focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
        //     style="white-space: pre-wrap; word-wrap: break-word;" readonly>${platformeText}</textarea>

        //   <div class="flex items-center gap-2">
        //     <legend class="w-48 bg-blue-200 text-black p-2 rounded">Plateau :</legend>
        //     <span class="bg-white p-2 border rounded">${competence.ct_plateau || "Non disponible"}</span>
        //   </div>

        //   <legend class="text-blue-500 p-2 rounded underline font-bold">Classification de la compétence technique :</legend>

        //   <div class="flex items-center gap-2">
        //     <legend class="w-1/2 bg-gray-400 text-black p-2 rounded">Domaine(s) :</legend>
        //     <legend class="w-1/2 bg-gray-400 text-black p-2 rounded">Technologie(s) :</legend>
        //   </div>

        //   <div class="flex items-center gap-2">
        //     <textarea class="w-1/2 h-32 p-2 border rounded-lg bg-gray-200 text-gray-700 
        //       focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
        //       style="white-space: pre-wrap; word-wrap: break-word;" readonly>${domaineText}</textarea>

        //     <textarea class="w-1/2 h-32 p-2 border rounded-lg bg-gray-200 text-gray-700 
        //       focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
        //       style="white-space: pre-wrap; word-wrap: break-word;" readonly>${technoText}</textarea>
        //   </div>

        //   <br/>

        //   <div class="flex items-center gap-2">
        //     <legend class="w-38 bg-blue-200 text-black p-2 rounded">Sous-domaine :</legend>
        //     <span class="bg-white p-2 border rounded">${competence.ct_ss_domaine || "Non disponible"}</span>
        //   </div>
        // </fieldset>
//       `;

//       resultatsContainer.appendChild(detailsElement);
//     });

//   } catch (error) {
//     console.error("Erreur lors du chargement des compétences :", error);
//     alert("Impossible de charger les compétences !");
//   }
// }
async function chargerDescription() {
  try {
    const query = document.getElementById("search-input").value.trim();
    if (!query && !technoSelectionnee && !domaineSelectionne && !platformeSelectionnee) {
      console.warn("Le champ de recherche est vide.");
      alert("Veuillez entrer un intitulé de compétence.");
      return;
    }

    // Récupération des données depuis l'API
    const [technoData, competenceData, domaineData, platformeData] = await Promise.all([
      fetch(API_URL + "J_techno").then(res => res.json()),
      fetch(API_URL + "competence").then(res => res.json()),
      fetch(API_URL + "J_domaine").then(res => res.json()),
      fetch(API_URL + "platform").then(res => res.json())
    ]);

    const resultatsContainer = document.getElementById("resultats");
    resultatsContainer.innerHTML = ""; // Nettoyage du conteneur avant l'ajout des nouveaux résultats

    let competencesTrouvees = [];

    if (query) {
      const competence = competenceData.find(c => c.ct_intitule_court_fr === query);
      if (competence) competencesTrouvees.push(competence);
    } else if (num.length > 0) {
      competencesTrouvees = competenceData.filter(c => num.includes(c.ct_num));
    }

    if (competencesTrouvees.length === 0) {
      resultatsContainer.innerHTML = "<p class='text-red-500 font-bold'>Aucune compétence trouvée.</p>";
      return;
    }

    let page = 0;
    const itemsPerPage = 4;

    function afficherPage() {
      resultatsContainer.innerHTML = "";
      const debut = page * itemsPerPage;
      const fin = debut + itemsPerPage;
      const competencesAffichees = competencesTrouvees.slice(debut, fin);

      competencesAffichees.forEach(competence => {
        const technoTrouvee = technoData.filter(t => t.j_ct_num === competence.ct_num);
        const domainesTrouves = domaineData.filter(d => d.j_ct_num === competence.ct_num);
        const platformeTrouvee = platformeData.filter(p => p.j_ct_num === competence.ct_num);

        const technoText = technoTrouvee.length ? technoTrouvee.map(t => t.j_ct_techno_fr).join("\n") : "Aucune techno disponible.";
        const domaineText = domainesTrouves.length ? domainesTrouves.map(d => d.j_ct_domaine).join("\n") : "Aucun domaine disponible.";
        const platformeText = platformeTrouvee.length ? platformeTrouvee.map(p => p.j_pf_nom).join("\n") : "Aucune plateforme disponible.";

        let titreCompetence = encodeURIComponent(competence.ct_intitule_court_fr);

        const detailsElement = document.createElement("details");
        detailsElement.className = "border p-2 w-1/2 rounded-lg shadow-md bg-gray-100";
        detailsElement.innerHTML = ` <br> <br>
          <summary class="cursor-pointer text-blue-600 font-bold text-lg">
            ${competence.ct_intitule_court_fr} --
            <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
              CAGT
            </a> --
            <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
              Voir la fiche CAGT
            </a> --
            <a href="panorama.html?titre=${titreCompetence}" target="_blank" class="text-blue-600 underline">
              Voir le panorama scientifique CAGT
            </a>
          </summary>
                <fieldset class="w-full min-h-[420px] p-4 pt-6 border rounded-lg bg-white shadow-md relative">
          <legend class="text-black-500 p-2 rounded font-bold">Fiche Compétence Technique</legend>

          <div class="flex items-center gap-2">
            <legend class="w-48 bg-blue-200 text-black p-2 rounded font-bold">Intitulé court</legend>
            <span class="bg-white p-2 border rounded">${competence.ct_intitule_court_fr}</span>
          </div>
          <br/>

          <div class="flex items-center gap-2">
            <legend class="w-48 bg-blue-200 text-black p-2 rounded font-bold">URL</legend>
            <span class="bg-white p-2 border rounded">${competence.ct_url || "Non disponible"}</span>
          </div>
          <br/>

          <legend class="w-full bg-blue-200 text-black p-2 rounded">Description :</legend>
          <textarea class="w-full h-64 p-2 border rounded-lg bg-gray-200 text-gray-700 
            focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-y-auto" readonly>${competence.ct_description_fr || "Aucune description disponible."}</textarea>

          <legend class="text-blue-500 p-2 rounded underline font-bold">Rattachement(s) de la compétence technique :</legend>
        
          <legend class="w-full bg-gray-400 text-black p-2 rounded">Plateforme(s) :</legend>
          <textarea class="w-full h-20 p-2 border rounded-lg bg-gray-200 text-gray-700 
            focus:ring-2 focus:ring-blue-400 focus:outline-none resize-none overflow-auto" 
            style="white-space: pre-wrap; word-wrap: break-word;" readonly>${platformeText}</textarea>

          <div class="flex items-center gap-2">
            <legend class="w-48 bg-blue-200 text-black p-2 rounded">Plateau :</legend>
            <span class="bg-white p-2 border rounded">${competence.ct_plateau || "Non disponible"}</span>
          </div>

          <legend class="text-blue-500 p-2 rounded underline font-bold">Classification de la compétence technique :</legend>

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

          <br/>

          <div class="flex items-center gap-2">
            <legend class="w-38 bg-blue-200 text-black p-2 rounded">Sous-domaine :</legend>
            <span class="bg-white p-2 border rounded">${competence.ct_ss_domaine || "Non disponible"}</span>
          </div>
        </fieldset>
        
        `;

        resultatsContainer.appendChild(detailsElement);
      });

      // Ajout des boutons de pagination
      const paginationContainer = document.createElement("div");
      paginationContainer.className = "flex justify-center gap-4 mt-4";

      if (page > 0) {
        const prevButton = document.createElement("button");
        prevButton.textContent = "Précédent";
        prevButton.className = "px-4 py-2 bg-blue-500 text-white rounded-lg";
        prevButton.onclick = () => {
          page--;
          afficherPage();
        };
        paginationContainer.appendChild(prevButton);
      }

      if (fin < competencesTrouvees.length) {
        const nextButton = document.createElement("button");
        nextButton.textContent = "Suivant";
        nextButton.className = "px-4 py-2 bg-blue-500 text-white rounded-lg";
        nextButton.onclick = () => {
          page++;
          afficherPage();
        };
        paginationContainer.appendChild(nextButton);
      }

      resultatsContainer.appendChild(paginationContainer);
    }

    afficherPage();

  } catch (error) {
    console.error("Erreur lors du chargement des compétences :", error);
    alert("Impossible de charger les compétences !");
  }
}

// Charger la description au clic sur le bouton
document.getElementById("recherche").addEventListener("click", chargerDescription);
