
### author : kritet ilyas

from typing import Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras
import numpy as np
from sentence_transformers import SentenceTransformer
from hashids import Hashids

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
        user="postgres",
        password="Ilyas.99",
        host="localhost",
        port="5432"
    )


@app.get("/autocomplete_competence/")
def autocomplete_competence(
    prefix: str,
    domaine: str = Query(None),
    panel: str = Query(None),
    sous_panel: str = Query(None)
):
    conn = get_db_connection()
    cur = conn.cursor()

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
    cur = conn.cursor()

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
    cur = conn.cursor()

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
    cur = conn.cursor()

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
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

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
            LIMIT 10;  -- you can limit as you wish
        """
        cur.execute(query_sql, tuple([query_embedding] + params))
        competencies = cur.fetchall()

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
    cur = conn.cursor()
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
    cur = conn.cursor()
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
    cur = conn.cursor()
    cur.execute("""
        SELECT d_sous_structures.*,j_sous_struct_localisation.*
        FROM D_Structures
        INNER JOIN d_sous_structures ON D_Structures.struct_num = d_sous_structures.ss_struct_structure
        LEFT JOIN j_sous_struct_localisation on d_sous_structures.ss_struct_num = j_sous_struct_localisation.j_ss_struct_num
        WHERE D_Structures.struct_num = %s
    """, (str(decode_hash(code)),))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/details/")
def get_details(code: str = Query(...)):
    conn = get_db_connection()
    cur = conn.cursor()
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
    cur = conn.cursor()
    cur.execute("""
        SELECT d_competences_scientifiques.* 
        FROM d_sous_structures LEFT JOIN d_competences_scientifiques ON d_sous_structures.ss_struct_num =d_competences_scientifiques.cs_ss_struct_num
        WHERE ss_struct_num = %s
    """, (ss_struct_num,))
    data = dictfetchall(cur)
    cur.close()
    conn.close()
    return {"data": data}


@app.get("/reqpanorama/")
def get_details():
    conn = get_db_connection()
    cur = conn.cursor()
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
    cur = conn.cursor()
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
    cur.close()
    conn.close()
    return {"data": data}
