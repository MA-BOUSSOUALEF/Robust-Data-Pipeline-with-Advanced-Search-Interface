from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os
from fastapi.responses import JSONResponse

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
#Connection To DB 
def get_db_connection():
    try:
        conn = psycopg2.connect (
        host=os.getenv("DB_HOST"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT"),
        cursor_factory=RealDictCursor,
        )
        return conn
    except Exception as e:
        print(f"Erreur lors de la connexion à la base de données : {e}")
        return None


# Api de Sous Domaine From D_Competences_Technique oui
@app.get("/api/Sous_Domaine")
def get_Ct_ss_Domaine():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table ="cartorecherche_ut3_projet_etudiant_db."
        cursor = conn.cursor()
        cursor.execute(f"SELECT DISTINCT ct_ss_domaine FROM {table}d_competences_techniques WHERE  ct_ss_domaine NOT ILIKE 'NaN'")
        domaine = cursor.fetchall() 
        return domaine
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()  
 
 # Api de Plateau From D_Competences_Technique non
@app.get("/api/Plateau")
def get_Plateau():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table ="cartorecherche_ut3_projet_etudiant_db."
        cursor = conn.cursor()
        cursor.execute(f"SELECT DISTINCT ct_plateau FROM {table}d_competences_techniques WHERE  ct_plateau NOT ILIKE 'NaN'")
        plateau = cursor.fetchall() 
        return plateau
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()
 

# Api de Domaine From Table J_Ct_Domaine oui
@app.get("/api/Domaine")
def get_Domaine():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table ="cartorecherche_ut3_projet_etudiant_db."
        cursor = conn.cursor()
        cursor.execute(f"SELECT DISTINCT j_ct_domaine FROM {table}j_ct_domaine WHERE j_ct_domaine NOT ILIKE 'NaN'")  
        domaine = cursor.fetchall() 
        return domaine
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close() 
        
        
# Api de techno From Table J_Ct_Techno oui
@app.get("/api/techno")
def get_techno():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table ="cartorecherche_ut3_projet_etudiant_db."
        cursor = conn.cursor()
        cursor.execute(f"SELECT DISTINCT j_ct_techno_fr FROM {table}j_ct_techno")  
        techno = cursor.fetchall() 
        return techno
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()

#Api de Competence From Table D_Competences_Techniques oui
@app.get("/api/competence")
def get_techno():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table ="cartorecherche_ut3_projet_etudiant_db."
        cursor = conn.cursor()
        cursor.execute(f"SELECT  ct_num , ct_intitule_court_fr , ct_description_fr , ct_plateau , ct_ss_domaine  FROM cartorecherche_ut3_projet_etudiant_db.d_competences_techniques")  
        techno = cursor.fetchall() 
        return techno
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()



# Api de Suggestion Ct_Intitule_Court_Fr From Table D_Competences_Techniques oui
@app.get("/api/suggestions")
def get_suggestions(query: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        query = f"%{query}%" 
        cursor.execute("SELECT  ct_num , ct_intitule_court_fr FROM cartorecherche_ut3_projet_etudiant_db.d_competences_techniques WHERE ct_intitule_court_fr ILIKE %s LIMIT 5", (query,))  # Recherche insensible à la casse
        suggestions = cursor.fetchall()
        return JSONResponse(content=[s['ct_intitule_court_fr'] for s in suggestions]) 
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()


########################################################################## les filtres ############################################################################################################


# Api detection de ct_num a partir de ct_intitule_court_fr  non
@app.get("/api/ct_num_intitule")
def get_ct_num_ct_intitule(ct_intitule_court_fr: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT ct_num FROM cartorecherche_ut3_projet_etudiant_db.d_competences_techniques WHERE ct_intitule_court_fr = %s", (ct_intitule_court_fr,))
        ct_num = cursor.fetchone()
        return JSONResponse(content=ct_num)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()

# Api detection de ct_num a partir de j_ct_techno non
# http://localhost:8000/api/ct_num_techno?j_ct_techno_fr=Imagerie%203D
@app.get("/api/ct_num_techno")
def get_ct_num_techno(j_ct_techno_fr: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT j_ct_num FROM cartorecherche_ut3_projet_etudiant_db.j_ct_techno WHERE j_ct_techno_fr = %s", (j_ct_techno_fr,))
        ct_num = cursor.fetchone()
        return JSONResponse(content=ct_num)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()


# Api detection de ct_num a partir de j_ct_domaine non
#http://localhost:8000/api/ct_num_domaine?j_ct_domaine=Biologie%20et%20sant%C3%A9
@app.get("/api/ct_num_domaine")
def get_ct_num_domaine(j_ct_domaine: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT j_ct_num FROM cartorecherche_ut3_projet_etudiant_db.j_ct_domaine WHERE j_ct_domaine = %s", (j_ct_domaine,))
        ct_num = cursor.fetchone()
        return JSONResponse(content=ct_num)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()

# Api detection de ct_num a partir de ct_ss_domaine non
#http://localhost:8000/api/ct_num_sous_domaine?ct_ss_domaine=Univers
@app.get("/api/ct_num_sous_domaine")
def get_ct_num_ss_domaine(ct_ss_domaine: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT ct_num FROM cartorecherche_ut3_projet_etudiant_db.d_competences_techniques WHERE ct_ss_domaine = %s", (ct_ss_domaine,))
        ct_num = cursor.fetchone()
        return JSONResponse(content=ct_num)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()
        
        
 


########################################################################## Affichage ############################################################################################################

#http://localhost:8000/api/competence?intitule=Radioactivit%C3%A9%20-%20LAFARA 
# Api detection de descreption a partir de ct_num  oui
@app.get("/api/descreption")
def get_Descreption(ct_num: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT ct_description_fr FROM cartorecherche_ut3_projet_etudiant_db.d_competences_techniques WHERE ct_num = %s", (ct_num,))
        descreption = cursor.fetchone()
        return JSONResponse(content=descreption)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()


# Api detection de techno a partir de ct_num non
@app.get("/api/J_techno")
def get_Technologie_ct_num():
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT j_ct_num , j_ct_techno_fr  FROM cartorecherche_ut3_projet_etudiant_db.j_ct_techno")
        J_techno = cursor.fetchall()
        return JSONResponse(content=J_techno)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()
        
# Api detection de domaine a partir de ct_num non
@app.get("/api/J_domaine")
def get_Domaine_ct_num():
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT j_ct_num , j_ct_domaine  FROM cartorecherche_ut3_projet_etudiant_db.j_ct_domaine ")
        J_domaine = cursor.fetchall()
        return JSONResponse(content=J_domaine)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()
        
# Api detection de platform a partir de ct_num non
@app.get("/api/platform")
def get_Platform_ct_num():
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT j_ct_num , j_pf_nom FROM cartorecherche_ut3_projet_etudiant_db.j_ct_plateforme ")
        platform = cursor.fetchall()
        return JSONResponse(content=platform)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        conn.close()


























