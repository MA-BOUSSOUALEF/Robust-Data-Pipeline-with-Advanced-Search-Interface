import csv
import psycopg2
from psycopg2.extras import execute_values
import matplotlib.pyplot as plt
from datetime import datetime
         
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
def load_data_to_postgres(data, conn, table_name):
    with conn.cursor() as cur:
        keys = data[0].keys()
        columns = ', '.join(keys)
        values = [[row[key] for key in keys] for row in data]
        query = f"INSERT INTO {table_name} ({columns}) VALUES %s"
        execute_values(cur, query, values)
        conn.commit()
        print(f"Données chargées dans la table {table_name}.")

# Pipeline principal
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
        create_tables(conn)
    except Exception as error:
        print(f"Erreur : {error}")
    finally:
        if conn:
            conn.close()
            print("Connexion fermée.")

if __name__ == "__main__":
    main()