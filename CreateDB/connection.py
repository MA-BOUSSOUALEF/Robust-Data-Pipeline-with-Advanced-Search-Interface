import psycopg2
from psycopg2.extras import execute_values
import os
import pandas as pd
# Informations de connexion à PostgreSQL
hostname = '172.25.112.1'
database = 'cartorecherche_ut3_projet_etudiant_db'
username = 'postgres'
pwd = 'Aminereal2002@'
port_id = 5432
# Étape 3 : Création des tables dans PostgreSQL
def create_tables(conn):
    try:
        # Liste des commandes SQL pour créer les tables et les relations
        with open("CreationDatabase.sql", "r") as file:
          sql_commands = file.read()
        # Exécution de chaque commande dans une transaction
        with conn.cursor() as cursor:
            for command in sql_commands.split(";"):
                command = command.strip()  # Supprimer les espaces inutiles
                if command:  # Ignorer les lignes vides
                    cursor.execute(command)
            conn.commit()
            print("Toutes les commandes SQL ont été exécutées avec succès !")
            
    except Exception as e:
        print(f"Erreur lors de la création des tables : {e}")
        conn.rollback()
    finally:
      if conn:
        conn.close()
# Étape 4 : Charger les données dans PostgreSQL
def loaD_data_to_postgres(data, conn, table_name):
    with conn.cursor() as cur:
        keys = data[0].keys()
        columns = ', '.join(keys)
        values = [[row[key] for key in keys] for row in data]
        query = f"INSERT INTO {table_name} ({columns}) VALUES %s"
        execute_values(cur, query, values)
        conn.commit()
        print(f"Données chargées dans la table {table_name}.")

# Pipeline principal
def process_excel_directory(directory_path,conn):
    # Loop through each file in the directory
    for filename in os.listdir(directory_path):
            excel_file = os.path.join(directory_path, filename)
            # Assuming table name is same as the Excel file name without extension
            table_name = os.path.splitext(filename)[0]  # Remove extension to get table name
            if os.path.exists(excel_file):
                print(f"{table_name}")
                # Read the Excel file into a DataFrame
                excel_df = pd.reaD_excel(excel_file)
                # Insert data into PostgreSQL
                insert_data_to_postgresql(excel_df, table_name,conn)
            else:
                print(f"File {excel_file} does not exist.")

TABLE_ORDER = [
    # Tables Ref en premier
    "Ref_Composantes_Instituts", "Ref_Directoires", "Ref_Localisations", 
    "Ref_Poles_UT", "D_Structures", "D_Sous_Structures",
    "D_Competences_Scientifiques", "Ref_CT_Domaines", "Ref_CT_Sous_Domaines", 
    "D_Competences_Techniques", "J_CT_Domaine", "Ref_Plateformes", 
    "J_CT_Plateforme", "Ref_CT_Technologies",

    # Tables D ensuite
    "J_CT_Techno", "Ref_Infrastructures_Europeennes", "J_PF_Infra_Europ", 
    

    # Tables J en dernier
    "Ref_Infrastructures_Nationales", "J_PF_Infra_Nationale", "J_Sous_Struct_Localisation", "J_Struct_CT", 
    "Ref_Federations","J_Struct_Fede", "Ref_Tutelles", "J_Struct_Tutelle", 
    "Ref_Type_Sous_Structuration", "Ref_Nomenclature_HCERES","J_CS_HCERES","D_TES"
]

# Fonction pour insérer les données dans PostgreSQL
def insert_data_to_postgresql(dataframe, table_name, conn):
    try:
        with conn.cursor() as cursor:
            # Générer les colonnes
            columns = ', '.join(dataframe.columns)
            query = f"INSERT INTO cartorecherche_ut3_projet_etudiant_db.{table_name} ({columns}) VALUES %s"
            
            # Transformer les données en une liste de tuples
            values = [tuple(row) for row in dataframe.itertuples(index=False, name=None)]
            # Utiliser execute_values pour l'insertion
            execute_values(cursor, query, values)

            conn.commit()
            print(f"Données insérées dans la table '{table_name}' avec succès !")
    except Exception as e:
        print(f"Erreur lors de l'insertion des données dans la table '{table_name}': {e}")
        conn.rollback()
        
                
def main():
    conn = None
    try:
        # Connexion à la base de données
        conn = psycopg2.connect(
            host=hostname,
            dbname=database,
            user=username,
            password=pwd,
            port=port_id
        )
        print("Connexion réussie avec psycopg2 !")
        # Créer les tables
        # create_tables(conn)
        path="../Data_Projet"
        for table_name in TABLE_ORDER:
            # Trouver le fichier Excel correspondant
            excel_file = os.path.join(path, f"{table_name}.xlsx")
            print(excel_file)
            if os.path.exists(excel_file):
                print(f"Traitement du fichier : {excel_file}")
                # Lire le fichier Excel dans un DataFrame
                dataframe = pd.read_excel(excel_file)
                if table_name == "ref_infrastructures_europeennes" or table_name == "Ref_Nomenclature_HCERES":  
                 dataframe = dataframe.applymap(lambda x: x.strip() if isinstance(x, str) else x)
                 
                # Insérer les données dans la table PostgreSQL
                elif table_name == "D_TES":
                  # Renommer les colonnes spécifiques
                  dataframe = dataframe.rename(columns={
                      "Transition écologique?": "Transition_Ecologique",
                      "Transition sociétale?": "Transition_Societale"
                  })
                  
                insert_data_to_postgresql(dataframe, table_name, conn)
            else:
                print(f"Fichier Excel pour la table '{table_name}' non trouvé dans le répertoire.")

    except Exception as error:
        print(f"Erreur : {error}")
    finally:
        if conn:
            conn.close()
            print("Connexion fermée.")

if __name__ == "__main__":
    main()
