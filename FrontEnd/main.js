const API_URL = "http://localhost:8000/api/d_tes";

// Fonction pour récupérer les d_tes depuis l'API
async function fetchD_Tes() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erreur lors de la récupération des d_tes");

    const d_tes = await response.json();
    displayD_Tes(d_tes); // Appelle la fonction pour afficher les utilisateurs
  } catch (error) {
    console.error("Erreur :", error);
    alert("Impossible de charger les d_tes !");
  }
}

// Fonction pour afficher les utilisateurs dans la page HTML
function displayD_Tes(d_tes) {
  const d_tesList = document.getElementById("d_tes-list");
  d_tesList.innerHTML = ""; // Vide la liste avant d'ajouter les utilisateurs

  d_tes.forEach(user => {
    const li = document.createElement("li");
    li.textContent = `${user.tes_num} (${user.tes_fr})`;
    d_tesList.appendChild(li);
  });
}

// Ajouter un événement sur le bouton pour charger les utilisateurs
document.getElementById("load-users").addEventListener("click", fetchD_Tes);
