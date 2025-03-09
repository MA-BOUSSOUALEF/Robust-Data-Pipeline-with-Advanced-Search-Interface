### author : kritet ilyas

import psycopg2
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-large-en")

conn = psycopg2.connect(
    dbname="cartorecherche",
    user="postgres",
    password="Ilyas.99",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

cur.execute("SELECT CS_Mot_Cle_Fr, cs_num FROM D_Competences_Scientifiques;")
rows = cur.fetchall()

for text, competence_id in rows:
    embedding = model.encode(text).tolist()  
    cur.execute("""
        UPDATE D_Competences_Scientifiques 
        SET embedding = %s 
        WHERE cs_num = %s;
    """, (embedding, competence_id))

conn.commit()
cur.close()
conn.close()

