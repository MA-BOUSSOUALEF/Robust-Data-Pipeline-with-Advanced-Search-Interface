const API_URL = "http://localhost:8000/api/";

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
// Charger les Sous domaines au chargement de la page
document.addEventListener("DOMContentLoaded", chargerSousDomaines);







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
// Charger les domaines au chargement de la page
document.addEventListener("DOMContentLoaded", chargerDomaines);





async function chargerTechno() {
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


