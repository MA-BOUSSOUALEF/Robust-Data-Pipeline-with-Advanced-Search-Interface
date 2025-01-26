from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    try:
        conn = psycopg2.connect (
        host = '172.25.112.1',
        dbname = 'cartorecherche_ut3_projet_etudiant_db',
        user = 'postgres',
        password = 'Aminereal2002@',
        port ='5432',
        cursor_factory=RealDictCursor,
        )
        return conn
    except Exception as e:
        print(f"Erreur lors de la connexion à la base de données : {e}")
        return None

@app.get("/api/d_tes")
def get_d_tes():
    conn = get_db_connection()
    if not conn:
        return {"error": "Impossible de se connecter à la base de données"}
    try:
        table ="cartorecherche_ut3_projet_etudiant_db."
        cursor = conn.cursor()
        cursor.execute(f"SELECT * FROM {table}d_tes")  
        users = cursor.fetchall() 
        return users
    except Exception as e:
        print(f"Erreur lors de la récupération des données : {e}")
        return {"error": str(e)}
    finally:
        conn.close()  

user = get_d_tes()
