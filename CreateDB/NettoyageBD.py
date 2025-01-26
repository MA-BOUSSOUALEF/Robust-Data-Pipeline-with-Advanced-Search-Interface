import pandas as pd 

def clean_data(data):
    # Supprimer les lignes avec des valeurs manquantes
    data = data.dropna()
    # Supprimer les lignes dupliquées
    data = data.drop_duplicates()
    return data
