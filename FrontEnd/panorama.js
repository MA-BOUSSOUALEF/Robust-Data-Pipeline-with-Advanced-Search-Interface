// Fonction pour récupérer les paramètres de l'URL 
// Récupérer le titre de la compétence
function getQueryParam(param) {
  let urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}
let titreCompetence = getQueryParam("titre");
if (titreCompetence) {
  document.getElementById("competenceTitre").textContent = titreCompetence;
}

