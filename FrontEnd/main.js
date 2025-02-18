const API_URL = "http://localhost:8000/api/";
 
// charger les sous domaines 
async function chargerSousDomaines() {
    try {
        const response = await fetch(API_URL + "Sous_Domaine");
        if (!response.ok) throw new Error("Erreur lors de la récupération des domaines");

        const domaines = await response.json();

        const select = document.getElementById("ss_domaine-list");
        if (!select) {
            console.error("Élément #domaine-list introuvable dans le DOM");
            return; 
        }
        // Réinitialiser le contenu
        select.innerHTML = '<option value="">Sélectionnez un sous domaine</option>';
        if (!Array.isArray(domaines) || domaines.length === 0) {
            console.warn("Aucun sous domaine reçu depuis l'API.");
            return;
        }
        // Ajouter les options en vérifiant les valeurs
        domaines.forEach(domaine => {

            if (!domaine.ct_ss_domaine) {
                console.warn("Donnée incorrecte détectée :", domaine);
                return;
            }
            const option = document.createElement("option");
            option.value = domaine.ct_ss_domaine ;
            option.textContent = domaine.ct_ss_domaine;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Erreur lors du chargement des domaines :", error);
        alert("Impossible de charger les domaines !");
    }
}

//charger les domaines 
async function chargerDomaines() {
  try {
      const response = await fetch(API_URL + "Domaine");
      if (!response.ok) throw new Error("Erreur lors de la récupération des domaines");

      const domaines = await response.json();

      const select = document.getElementById("domaine-list");
      if (!select) {
          console.error("Élément #domaine-list introuvable dans le DOM");
          return;
      }
      // Réinitialiser le contenu
      select.innerHTML = '<option value="">Sélectionnez un domaine</option>';
      if (!Array.isArray(domaines) || domaines.length === 0) {
          console.warn("Aucun domaine reçu depuis l'API.");
          return;
      }
      // Ajouter les options en vérifiant les valeurs
      domaines.forEach(domaine => {

          if (!domaine.j_ct_domaine) {
              console.warn("Donnée incorrecte détectée :", domaine);
              return;
          }
          const option = document.createElement("option");
          option.value = domaine.j_ct_domaine ;
          option.textContent = domaine.j_ct_domaine;
          select.appendChild(option);
      });

  } catch (error) {
      console.error("Erreur lors du chargement des domaines :", error);
      alert("Impossible de charger les domaines !");
  }
}

//charger les technologies 
async function chargerTechno() {
  console.log('techno')
  try {
      const response = await fetch(API_URL + "techno");
      if (!response.ok) throw new Error("Erreur lors de la récupération des Technos");

      const technos = await response.json();

      const select = document.getElementById("Techno-list");
      if (!select) {
          console.error("Élément #Techno-list introuvable dans le DOM");
          return;
      }
      // Réinitialiser le contenu
      select.innerHTML = '<option value="">Sélectionnez une Techno </option>';
      if (!Array.isArray(technos) || technos.length === 0) {
          console.warn("Aucun Techno reçu depuis l'API.");
          return;
      }
      // Ajouter les options en vérifiant les valeurs
      technos.forEach(techno => {

          if (!techno.j_ct_techno_fr) {
              console.warn("Donnée incorrecte détectée :", techno);
              return;
          }
          const option = document.createElement("option");
          option.value = techno.j_ct_techno_fr ;
          option.textContent = techno.j_ct_techno_fr;
          select.appendChild(option);
      });

  } catch (error) {
      console.error("Erreur lors du chargement des technos :", error);
      alert("Impossible de charger les technos !");
  }
}

// Charger les technos au chargement de la page
document.addEventListener("DOMContentLoaded", chargerTechno);
// Charger les domaines au chargement de la page
document.addEventListener("DOMContentLoaded", chargerDomaines);
// Charger les Sous domaines au chargement de la page
document.addEventListener("DOMContentLoaded", chargerSousDomaines);




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
// Charger la description de la compétence
async function chargerDescription() {
  try {
    const query = document.getElementById("search-input").value.trim();
    if (!query) {
      console.warn("Le champ de recherche est vide.");
      return;
    }
    console.log(query);
    const techo_reponse = await fetch(API_URL + "J_techno");
    const response = await fetch(API_URL + "competence");
    const domaine_response = await fetch(API_URL + "J_domaine");
    const platforme_response = await fetch(API_URL + "platform");
    if (!response.ok) throw new Error("Erreur lors de la récupération des compétences");
     
    const competences = await response.json();
    const techno = await techo_reponse.json();
    const domaine = await domaine_response.json();
    const platforme = await platforme_response.json();


    const description = document.getElementById("description");
    const platforme_text = document.getElementById("platform"); 
    const techno_text = document.getElementById("techno");
    const domaine_text = document.getElementById("domaine");
    const ss_domaine = document.getElementById("sous_domaine");
    const plateau = document.getElementById("plateau");

    if (!description || !platforme_text || !techno_text || !domaine_text || !ss_domaine || !plateau) {
      alert("Un ou plusieurs éléments DOM sont introuvables.");
    }

    // Trouver la compétence correspondant à l'intitulé recherché
    const competenceTrouvee = competences.find(c => c.ct_intitule_court_fr === query);
    const technoTrouvee = techno.find(t => t.j_ct_num === competenceTrouvee.ct_num);
    const domaineTrouvee = domaine.find(d => d.j_ct_num === competenceTrouvee.ct_num);
    const platformeTrouvee = platforme.find(p => p.j_ct_num === competenceTrouvee.ct_num);
   
    if (!competenceTrouvee) {
          description.value = "Aucune description disponible.";
      
        }
    else 
        {
          description.value = competenceTrouvee.ct_description_fr ;
        }
    if (!technoTrouvee) {
          techno_text.value = "Aucune techno disponible." ;
        }
    else 
        {
          techno_text.value = technoTrouvee.j_ct_techno_fr
        }
    if (!domaineTrouvee) {
          domaine_text.value = "Aucun domaine disponible." ;
        }
    else 
        {
          domaine_text.value = domaineTrouvee.j_ct_domaine ;
        }
    if (!platformeTrouvee) {
          platforme_text.value = "Aucune plateforme disponible." ;
        }
    else 
        {
          platforme_text.value = platformeTrouvee.j_pf_nom ;
        }

    ss_domaine.textContent  = competenceTrouvee.ct_ss_domaine ;
    plateau.textContent  = competenceTrouvee.ct_plateau ;


  } catch (error) {
    console.error("Erreur lors du chargement des competences :", error);
    alert("Impossible de charger les competences !");
  }
}
// Charger la description au clic sur le bouton
document.getElementById("recherche").addEventListener("click", chargerDescription);


// Charger techno et domaine au clic sur le bouton


