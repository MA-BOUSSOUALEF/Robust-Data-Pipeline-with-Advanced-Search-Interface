
### author : kritet ilyas

from typing import Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras
import numpy as np
from sentence_transformers import SentenceTransformer
from hashids import Hashids
from fastapi.responses import JSONResponse

from psycopg2.extras import RealDictCursor



app = FastAPI()


hashids = Hashids(salt="THIS_IS_MY_SECRET_12312514562", min_length=20)


def encode_number(number: int) -> str:
    return hashids.encode(number)


def decode_hash(hash_string: str) -> int:
    decoded = hashids.decode(hash_string)
    return decoded[0] if decoded else None


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = SentenceTransformer("BAAI/bge-large-en")


def dictfetchall(cursor):
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_db_connection():
    """ Connexion PostgreSQL """
    return psycopg2.connect(
        dbname="cartorecherche",
        user="amine",
        password="Aminereal2002@",
        host="localhost",
        port="5432",
        cursor_factory=RealDictCursor,
    )


@app.get("/autocomplete_competence/")
def autocomplete_competence(
    prefix: str,
    domaine: str = Query(None),
    panel: str = Query(None),
    sous_panel: str = Query(None)
):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)

    query = """
        SELECT DISTINCT CS_Mot_Cle_Fr 
        FROM D_Competences_Scientifiques cs
        LEFT JOIN J_CS_HCERES j ON cs.CS_Num = j.J_CS_Num
        LEFT JOIN Ref_Nomenclature_HCERES h ON j.J_HCERES_Sous_Panel = h.HCERES_Sous_Panel_Fr
        WHERE CS_Mot_Cle_Fr ILIKE %s
    """

    params = [f"%{prefix}%"]

    if domaine:
        query += " AND h.HCERES_Domaine_Fr = %s"
        params.append(domaine)
    if panel:
        query += " AND h.HCERES_Panel_Fr = %s"
        params.append(panel)
    if sous_panel:
        query += " AND h.HCERES_Sous_Panel_Fr = %s"
        params.append(sous_panel)

    query += " ORDER BY CS_Mot_Cle_Fr LIMIT 10"

    cur.execute(query, params)
    suggestions = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return {"suggestions": suggestions}


@app.get("/autocomplete_domaine/")
def autocomplete_domaine(prefix: str = ""):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)

    cur.execute("""
        SELECT DISTINCT HCERES_Domaine_Fr 
        FROM Ref_Nomenclature_HCERES
        ORDER BY HCERES_Domaine_Fr
    """, ())

    suggestions = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return {"suggestions": suggestions}


@app.get("/autocomplete_panel/")
def autocomplete_panel(domaine: str):
    conn = get_db_connection()
    cur =conn.cursor(cursor_factory=psycopg2.extensions.cursor)

    print(domaine)

    cur.execute("""
        SELECT DISTINCT HCERES_Panel_Fr 
        FROM Ref_Nomenclature_HCERES
        WHERE HCERES_Domaine_Fr = %s
        ORDER BY HCERES_Panel_Fr
    """, (domaine,))
    suggestions = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()

    return {"suggestions": suggestions}


@app.get("/autocomplete_sous_panel/")
def autocomplete_sous_panel(panel: str):
    conn = get_db_connection()
    cur =conn.cursor(cursor_factory=psycopg2.extensions.cursor)

    cur.execute("""
        SELECT DISTINCT HCERES_Sous_Panel_Fr 
        FROM Ref_Nomenclature_HCERES
        WHERE HCERES_Panel_Fr = %s
        ORDER BY HCERES_Sous_Panel_Fr
        LIMIT 10;
    """, (panel,))

    suggestions = [row[0] for row in cur.fetchall()]

    cur.close()
    conn.close()
    return {"suggestions": suggestions}


@app.get("/search_competence/")
def search_competence(
    query: str,
    mode: str = Query("text", enum=["text", "semantic"]),
    domaine: Optional[str] = None,
    panel: Optional[str] = None,
    sous_panel: Optional[str] = None
):
  
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)

    where_clauses = []
    params = []

    if mode == "text":
        where_clauses.append("cs.CS_Mot_Cle_Fr ILIKE %s")
        params.append(f"%{query}%")
    else:
    
        pass

    if domaine:
        where_clauses.append("h.HCERES_Domaine_Fr = %s")
        params.append(domaine)
    if panel:
        where_clauses.append("h.HCERES_Panel_Fr = %s")
        params.append(panel)
    if sous_panel:
        where_clauses.append("h.HCERES_Sous_Panel_Fr = %s")
        params.append(sous_panel)

    where_sql = " AND ".join(where_clauses)
    if where_sql:
        where_sql = "WHERE " + where_sql
    else:
        where_sql = "" 

    if mode == "text":
        query_sql = f"""
            SELECT cs.CS_Num, cs.CS_Mot_Cle_Fr, cs.CS_Mot_Cle_En, cs.cs_ss_struct_num
            FROM D_Competences_Scientifiques cs
            LEFT JOIN J_CS_HCERES j ON cs.CS_Num = j.J_CS_Num
            LEFT JOIN Ref_Nomenclature_HCERES h ON j.J_HCERES_Sous_Panel = h.HCERES_Sous_Panel_Fr
            {where_sql}
            ORDER BY cs.CS_Mot_Cle_Fr
        """
        cur.execute(query_sql, tuple(params))
        competencies = cur.fetchall()

    else:
      
        query_embedding = model.encode(query).tolist()

      

        query_sql = f"""
            SELECT cs.CS_Num, cs.CS_Mot_Cle_Fr, cs.CS_Mot_Cle_En, cs.cs_ss_struct_num,
                   cs.embedding <=> %s::vector AS similarity
            FROM D_Competences_Scientifiques cs
            LEFT JOIN J_CS_HCERES j ON cs.CS_Num = j.J_CS_Num
            LEFT JOIN Ref_Nomenclature_HCERES h ON j.J_HCERES_Sous_Panel = h.HCERES_Sous_Panel_Fr
            {where_sql}
            ORDER BY similarity ASC
            LIMIT 50;  -- you can limit as you wish
        """


        cur.execute(query_sql, tuple([query_embedding] + params))
        competencies = cur.fetchall()

        print(competencies)

    # ------------------------- Build the results -------------------------
    results = []

    ss_struct_exits = []

    for competence in competencies:
       
        if mode == "semantic":
            competence_id, competence_FR, competence_EN, ss_struct_num, similarity = competence
        else:
            competence_id, competence_FR, competence_EN, ss_struct_num = competence[:4]
            similarity = None

        if ss_struct_num not in ss_struct_exits:
            ss_struct_exits.append(ss_struct_num)
        else:
            continue

        cur.execute("""
            SELECT J_HCERES_Sous_Panel 
            FROM J_CS_HCERES 
            WHERE J_CS_Num = %s;
        """, (competence_id,))
        hceres_code = cur.fetchone()

        domaine_fr, panel_fr, sous_panel_fr = None, None, None
        if hceres_code:
            cur.execute("""
                SELECT HCERES_Domaine_Fr, HCERES_Panel_Fr, HCERES_Sous_Panel_Fr 
                FROM Ref_Nomenclature_HCERES 
                WHERE HCERES_Sous_Panel_Fr = %s;
            """, (hceres_code[0],))
            hceres_info = cur.fetchone()
            if hceres_info:
                domaine_fr, panel_fr, sous_panel_fr = hceres_info

        cur.execute("""
            SELECT ss_struct_structure, ss_struct_num, ss_struct_acronyme, ss_struct_nom_fr,ss_struct_url_fr
            FROM D_Sous_Structures 
            WHERE ss_struct_num = %s;
        """, (ss_struct_num,))
        sous_structure = cur.fetchone()  

        structure = None
        if sous_structure:
            cur.execute("""
                SELECT struct_acronyme, struct_nom_fr, struct_nom_en, struct_url ,struct_num
                FROM D_Structures 
                WHERE struct_num = %s;
            """, (sous_structure[0],))
            structure = cur.fetchone()  

        cur.execute("""
            SELECT CS_Mot_Cle_Fr, CS_Mot_Cle_En 
            FROM D_Competences_Scientifiques 
            WHERE cs_ss_struct_num = %s;
        """, (ss_struct_num,))
        key_words = cur.fetchall()  

        struct_num = encode_number(int(structure[4]))
        results.append({
            "competence": competence_FR,
            "similarity": similarity,
            "domaine": domaine_fr,
            "panel": panel_fr,
            "sous_panel": sous_panel_fr,
            "key_words": key_words,
            "sous_structure": sous_structure,
            "structure": structure,
            "struct_num": struct_num
        })

    cur.close()
    conn.close()

    return {"results": results}


@app.get("/tutelles/")
def get_tutelles(code: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT 
            D_Structures.Struct_Acronyme,
            Ref_Tutelles.*,
            J_Struct_Tutelle.*
        FROM D_Structures
        LEFT JOIN J_Struct_Tutelle ON D_Structures.struct_num = J_Struct_Tutelle.J_Struct_Num
        LEFT JOIN Ref_Tutelles ON J_Struct_Tutelle.J_Tutelle_Acronyme = Ref_Tutelles.Tutelle_Acronyme
        WHERE D_Structures.struct_num = %s
    """, (str(decode_hash(code)),))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/federations/")
def get_federations(code: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT 
            D_Structures.Struct_Acronyme,
            Ref_Federations.*
        FROM D_Structures
        LEFT JOIN J_Struct_Fede ON D_Structures.struct_num = J_Struct_Fede.J_Struct_Num
        LEFT JOIN Ref_Federations ON J_Struct_Fede.J_Fede_Acronyme = Ref_Federations.Fede_Acronyme
        WHERE D_Structures.struct_num = %s
    """, (str(decode_hash(code)),))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/sous_structures/")
def get_sous_structures(code: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT d_sous_structures.*
        FROM D_Structures
        LEFT JOIN d_sous_structures ON D_Structures.struct_num = d_sous_structures.ss_struct_structure       
        WHERE D_Structures.struct_num = %s
    """, (str(decode_hash(code)),))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}
    

#    LEFT JOIN j_sous_struct_localisation on d_sous_structures.ss_struct_num = j_sous_struct_localisation.j_ss_struct_num


@app.get("/details/")
def get_details(code: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT 
            D_Structures.*,
            ref_directoires.*,
            Ref_Poles_UT.*,
            Ref_Composantes_Instituts.*,
            Ref_Type_Sous_Structuration.*
        FROM D_Structures
        LEFT JOIN ref_directoires ON D_Structures.struct_directoire = ref_directoires.Directoire_Acronyme
        LEFT JOIN Ref_Poles_UT ON D_Structures.Struct_PoleUT = Ref_Poles_UT.PoleUT_Acronyme
        LEFT JOIN Ref_Composantes_Instituts ON D_Structures.Struct_Composante_Institut = Ref_Composantes_Instituts.Composante_ou_Institut
        LEFT JOIN Ref_Type_Sous_Structuration ON D_Structures.Struct_Sous_Structuration = Ref_Type_Sous_Structuration.Type_Ss_Struct

        WHERE D_Structures.struct_num = %s
    """, (str(decode_hash(code)),))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/keywords/")
def get_details(ss_struct_num: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT d_competences_scientifiques.* 
        FROM d_sous_structures LEFT JOIN d_competences_scientifiques ON d_sous_structures.ss_struct_num =d_competences_scientifiques.cs_ss_struct_num
        WHERE ss_struct_num = %s
    """, (ss_struct_num,))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/directories/")
def get_directories():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cur.execute("SELECT directoire_acronyme,directoire_nom FROM ref_directoires;")
    directories = dictfetchall(cur)
    cur.close()

    data = []
    for directory in directories:
        # Use the directoire_acronyme value from the current row.
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute("""
            SELECT struct_nom_fr ,struct_num
            FROM ref_directoires 
            INNER JOIN d_structures 
              ON d_structures.struct_directoire = ref_directoires.directoire_acronyme 
            WHERE ref_directoires.directoire_acronyme = %s
        """, (directory["directoire_acronyme"],))
        laboratoires = dictfetchall(cur)
     
        for labo in laboratoires:
            labo["struct_num"] = encode_number(int(labo["struct_num"]))     
        
        data.append({
            "directoire": directory,
            "laboratoires": laboratoires
        })
        cur.close()

    conn.close()
    return {"data": data}


@app.get("/reqpanorama/")
def get_details():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT
    D_Structures.Struct_Acronyme,
    D_Structures.Struct_Directoire,
    D_Structures.Struct_PoleUT,
    J_CS_HCERES.J_HCERES_Sous_Panel,
    Ref_Nomenclature_HCERES.HCERES_Panel_Fr,
    Ref_Nomenclature_HCERES.HCERES_Domaine_Fr,
    Count(J_CS_HCERES.J_HCERES_Sous_Panel) AS CompteDeJ_HCERES_Sous_Panel
FROM Ref_Nomenclature_HCERES
INNER JOIN (D_Structures
INNER JOIN (D_Sous_Structures
INNER JOIN (D_Competences_Scientifiques
INNER JOIN J_CS_HCERES
    ON D_Competences_Scientifiques.CS_Num = J_CS_HCERES.J_CS_Num)
    ON D_Sous_Structures.Ss_Struct_Num = D_Competences_Scientifiques.CS_Ss_Struct_Num)
    ON D_Structures.Struct_Num = D_Sous_Structures.Ss_Struct_Structure)
    ON Ref_Nomenclature_HCERES.HCERES_Sous_Panel_Fr = J_CS_HCERES.J_HCERES_Sous_Panel
GROUP BY
    D_Structures.Struct_Acronyme,
    D_Structures.Struct_Directoire,
    D_Structures.Struct_PoleUT,
    J_CS_HCERES.J_HCERES_Sous_Panel,
    Ref_Nomenclature_HCERES.HCERES_Panel_Fr,
    Ref_Nomenclature_HCERES.HCERES_Domaine_Fr;
    

    """, ())
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/reqpanoramabystruct/")
def get_details(struct_num: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extensions.cursor)
    cur.execute("""
        SELECT
    D_Structures.Struct_Acronyme,
    D_Structures.Struct_Directoire,
    D_Structures.Struct_PoleUT,
    J_CS_HCERES.J_HCERES_Sous_Panel,
    Ref_Nomenclature_HCERES.HCERES_Panel_Fr,
    Ref_Nomenclature_HCERES.HCERES_Domaine_Fr,
    Count(J_CS_HCERES.J_HCERES_Sous_Panel) AS CompteDeJ_HCERES_Sous_Panel
FROM Ref_Nomenclature_HCERES
INNER JOIN (D_Structures
INNER JOIN (D_Sous_Structures
INNER JOIN (D_Competences_Scientifiques
INNER JOIN J_CS_HCERES
    ON D_Competences_Scientifiques.CS_Num = J_CS_HCERES.J_CS_Num)
    ON D_Sous_Structures.Ss_Struct_Num = D_Competences_Scientifiques.CS_Ss_Struct_Num)
    ON D_Structures.Struct_Num = D_Sous_Structures.Ss_Struct_Structure)
    ON Ref_Nomenclature_HCERES.HCERES_Sous_Panel_Fr = J_CS_HCERES.J_HCERES_Sous_Panel
    WHERE D_Structures.struct_num = %s
GROUP BY
    D_Structures.Struct_Acronyme,
    D_Structures.Struct_Directoire,
    D_Structures.Struct_PoleUT,
    J_CS_HCERES.J_HCERES_Sous_Panel,
    Ref_Nomenclature_HCERES.HCERES_Panel_Fr,
    Ref_Nomenclature_HCERES.HCERES_Domaine_Fr;
    

    """, (str(decode_hash(struct_num)),))
    data = dictfetchall(cur)

    print(data)
    cur.close()
    conn.close()
    return {"data": data}


# Api de Sous Domaine From D_Competences_Technique oui
@app.get("/api/platforme")
def get_Ct_ss_Domaine():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  j_pf_nom,j_ct_num FROM {table}j_ct_plateforme WHERE  j_pf_nom NOT ILIKE 'NaN'")
        domaine = cursor.fetchall() 
        return domaine
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()  
        
@app.get("/api/sous_domaines")
def get_Ct_ss_Domaine_not_distinct():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT ct_num , ct_ss_domaine  FROM d_competences_techniques WHERE  ct_ss_domaine NOT ILIKE 'NaN'")
        domaine = cursor.fetchall() 
        return domaine
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()        
        
  
        
@app.get("/api/platforme_sans_Doublons")
def get_Ct_ss_Domaine_sans_Doublons():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  DISTINCT j_pf_nom FROM {table}j_ct_plateforme WHERE  j_pf_nom NOT ILIKE 'NaN'")
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
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT DISTINCT ct_plateau  FROM {table}d_competences_techniques WHERE  ct_plateau NOT ILIKE 'NaN'")
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
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  j_ct_domaine ,j_ct_num FROM {table}j_ct_domaine WHERE j_ct_domaine NOT ILIKE 'NaN'")  
        domaine = cursor.fetchall() 
        return domaine
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close() 
        
@app.get("/api/Domaine_sans_Doublons")
def get_Domaine_sans_Doublons():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  DISTINCT j_ct_domaine  FROM {table}j_ct_domaine WHERE j_ct_domaine NOT ILIKE 'NaN'")  
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
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  j_ct_techno_fr ,j_ct_num FROM {table}j_ct_techno")  
        techno = cursor.fetchall() 
        return techno
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()
        
@app.get("/api/techno_sans_Doublons")
def get_techno_sans_Doublons():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  DISTINCT j_ct_techno_fr FROM {table}j_ct_techno")  
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
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT  ct_num , ct_intitule_court_fr , ct_description_fr , ct_plateau , ct_ss_domaine,ct_url,ct_ss_struct_num  FROM d_competences_techniques")  
        techno = cursor.fetchall() 
        return techno
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()

@app.get("/api/sousdomaineSansDoublons")
def get_sous_domaine():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table =""
        cursor = conn.cursor()
        cursor.execute(f"SELECT DISTINCT ct_ss_domaine  FROM d_competences_techniques")  
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
        cursor.execute("SELECT  ct_num , ct_intitule_court_fr FROM d_competences_techniques WHERE ct_intitule_court_fr ILIKE %s LIMIT 5", (query,))  # Recherche insensible à la casse
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
        cursor.execute("SELECT ct_num FROM d_competences_techniques WHERE ct_intitule_court_fr = %s", (ct_intitule_court_fr,))
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
        cursor.execute("SELECT j_ct_num FROM j_ct_techno WHERE j_ct_techno_fr = %s", (j_ct_techno_fr,))
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
        cursor.execute("SELECT j_ct_num FROM j_ct_domaine WHERE j_ct_domaine = %s", (j_ct_domaine,))
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
        cursor.execute("SELECT ct_num FROM d_competences_techniques WHERE ct_ss_domaine = %s", (ct_ss_domaine,))
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
        cursor.execute("SELECT ct_description_fr FROM d_competences_techniques WHERE ct_num = %s", (ct_num,))
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
        cursor.execute("SELECT j_ct_num , j_ct_techno_fr  FROM j_ct_techno")
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
        cursor.execute("SELECT j_ct_num , j_ct_domaine  FROM j_ct_domaine ")
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
        cursor.execute("SELECT j_ct_num , j_pf_nom FROM j_ct_plateforme ")
        platform = cursor.fetchall()
        return JSONResponse(content=platform)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        cursor.close()
        
        conn.close()



# @app.get("/api/sous_Structure")
# def get_sous_Structure(j_ct_num: str):
#     conn = get_db_connection()
#     if not conn:
#         return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)
#     try:
#         cursor = conn.cursor()
#         cursor.execute("SELECT DISTINCT s.struct_acronyme FROM d_structures s INNER JOIN j_struct_ct jsn ON s.struct_num = jsn.j_struct_num WHERE  jsn.j_ct_num = %s", (j_ct_num,))
#         structure = cursor.fetchall()
#         return JSONResponse(content=structure)
#     except Exception as e:
#         return JSONResponse(content={"error": str(e)}, status_code=500)
#     finally:
#         cursor.close()
        
#         conn.close()


@app.get("/api/cmpetence_structure")
def get_cmpetence_structure(structure_num: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)

    try:
        cursor = conn.cursor()

        # Décoder le structure_num
        try:
            decoded_structure_num = str(decode_hash(structure_num))
        except Exception as e:
            return JSONResponse(content={"error": f"Erreur lors du décodage de struct_num: {str(e)}"}, status_code=400)

        # Exécuter la requête SQL avec le struct_num décodé
        cursor.execute(
            """
            SELECT  s.ct_num , s.ct_intitule_court_fr , s.ct_description_fr , s.ct_plateau , s.ct_ss_domaine, s.ct_url , s.ct_ss_struct_num 
            FROM d_competences_techniques s 
            INNER JOIN j_struct_ct jsn ON s.ct_num = jsn.j_ct_num
            WHERE jsn.j_struct_num = %s
            """, 
            (decoded_structure_num,)  # Utilisation de la valeur décodée
        )
        
        competences = cursor.fetchall()

        return JSONResponse(content=competences)  # Retourner les résultats sans encodage

    except Exception as e:
        return JSONResponse(content={"error": f"Erreur interne: {str(e)}"}, status_code=500)

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()







@app.get("/api/Structure_num")
def get_sous_structure(j_ct_num: str):
    conn = get_db_connection()
    if not conn:
        return JSONResponse(content={"error": "Impossible de se connecter à la base de données"}, status_code=500)

    try:
        cursor = conn.cursor()
        print(f"DEBUG - Valeur reçue j_ct_num: {j_ct_num}")  # Vérifier la valeur reçue

        cursor.execute(
            """
            SELECT s.struct_num, s.struct_acronyme ,s.struct_nom_fr
            FROM d_structures s 
            INNER JOIN j_struct_ct jsn ON s.struct_num = jsn.j_struct_num 
            WHERE jsn.j_ct_num = %s
            """, 
            (j_ct_num,)
        )
        structures = cursor.fetchall()

        if not structures:
            return JSONResponse(content={"error": "Aucune structure trouvée"}, status_code=404)

        encoded_structures = []
        for structure in structures:
            try:
                print(f"DEBUG - Structure récupérée: {structure}")  # Log des données récupérées
                
                struct_num = structure["struct_num"]  # Utilisation de RealDictRow

                # Vérifier si struct_num est NULL
                if struct_num is None:
                    return JSONResponse(content={"error": "struct_num est NULL"}, status_code=500)

                # Vérifier si struct_num est bien un entier avant l'encodage
                try:
                    struct_num = int(struct_num)  
                except ValueError:
                    return JSONResponse(content={"error": f"Valeur invalide pour struct_num: {struct_num}"}, status_code=500)

                print(f"DEBUG - struct_num avant encodage: {struct_num}")  # Vérifier la valeur avant encodage
                encoded_struct_num = encode_number(struct_num)  # Vérifier si encode_number fonctionne
                print(f"DEBUG - struct_num encodé: {encoded_struct_num}")  # Log de l'encodage

                encoded_structures.append({
                    "struct_num": encoded_struct_num,
                    "struct_acronyme": structure["struct_acronyme"],
                    "struct_nom_fr": structure["struct_nom_fr"]
                })
            except Exception as e:
                return JSONResponse(content={"error": f"Erreur lors de l'encodage de struct_num ({structure}): {str(e)}"}, status_code=500)

        return JSONResponse(content=encoded_structures)

    except Exception as e:
        return JSONResponse(content={"error": f"Erreur interne: {str(e)}"}, status_code=500)

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()