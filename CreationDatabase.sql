  
            SET check_function_bodies = off;
            CREATE SCHEMA IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db;
            SET search_path TO cartorecherche_ut3_projet_etudiant_db;
            
            
            CREATE TABLE IF NOT EXISTS ref_composantes_instituts (
                Composante_ou_Institut VARCHAR(255) PRIMARY KEY,
                Composante_ou_Institut_En VARCHAR(255)
            );

            CREATE INDEX IF NOT EXISTS idx_ref_composantes_instituts_composante_ou_institut 
            ON ref_composantes_instituts (Composante_ou_Institut) ;
            
            
            CREATE TABLE IF NOT EXISTS ref_directoires (
                Directoire_Acronyme VARCHAR(255) PRIMARY KEY,
                Directoire_Nom VARCHAR(255),
                Directoire_Nom_En VARCHAR(255)
            );
            CREATE INDEX IF NOT EXISTS idx_ref_directoires_directoire_acronyme 
            ON ref_directoires (Directoire_Acronyme) ;
            
            
            CREATE TABLE IF NOT EXISTS ref_localisations (
                Loc_Site VARCHAR(255) PRIMARY KEY
            );
            CREATE INDEX IF NOT EXISTS idx_ref_localisations_loc_site 
            ON ref_localisations (Loc_Site) ;
            
            
            CREATE TABLE IF NOT EXISTS ref_poles_ut (
                PoleUT_Acronyme VARCHAR(255) PRIMARY KEY,
                PoleUT_Nom VARCHAR(255),
                PoleUT_Nom_En VARCHAR(255)
            );
            CREATE INDEX IF NOT EXISTS idx_ref_poles_ut_poleut_acronyme 
            ON ref_poles_ut (PoleUT_Acronyme) ;
            
            
            CREATE TABLE IF NOT EXISTS d_structures (
                Struct_Num VARCHAR(255) PRIMARY KEY,
                Struct_Labellisation VARCHAR(255),
                Struct_Id_RNSR VARCHAR(255),
                Struct_IdI_HAL VARCHAR(255),
                Struct_Acronyme VARCHAR(255),
                Struct_Nom_Fr VARCHAR(255),
                Struct_Nom_En VARCHAR(255),
                Struct_Directoire VARCHAR(255),
                Struct_PoleUT VARCHAR(255),
                Struct_Direction VARCHAR(255),
                Struct_Composante_Institut VARCHAR(255),
                Struct_Autres_Rattachements TEXT,
                Struct_Adresse VARCHAR(255),
                Struct_Latitude VARCHAR(255),
                Struct_Longitude VARCHAR(255),
                Struct_Localisation VARCHAR(255),
                Struct_URL VARCHAR(255),
                Struct_URL_En VARCHAR(255),
                Struct_Sous_Structuration VARCHAR(255),
                Struct_Effectif_Perm_HCERES2019 VARCHAR(255),
                Struct_Effectif_Perm VARCHAR(255),
                Struct_Date_Effectif_Perm VARCHAR(255),
                Struct_Presentation_Fr TEXT,
                Struct_Presentation_En TEXT
            );
            
              
            CREATE TABLE IF NOT EXISTS d_sous_structures (
                Ss_Struct_Num VARCHAR(255) PRIMARY KEY,
                Ss_Struct_Structure VARCHAR(255),
                Ss_Struct_Acronyme VARCHAR(255),
                Ss_Struct_Nom_Fr VARCHAR(255),
                Ss_Struct_Nom_En VARCHAR(255),
                Ss_Struct_Responsable_s VARCHAR(255),
                Ss_Struct_Texte_Fr TEXT,
                Ss_Struct_Texte_En TEXT,
                Ss_Struct_URL_Fr VARCHAR(255),
                Ss_Struct_URL_En VARCHAR(255),
                Ss_Struct_Effectif_Perm VARCHAR(255),
                Ss_Struct_Date_Effectif_Perm VARCHAR(255)
            ) ;
            
            
            ALTER TABLE d_structures ADD CONSTRAINT fk_struct_composante_institut
            FOREIGN KEY (Struct_Composante_Institut) REFERENCES ref_composantes_instituts (Composante_ou_Institut)
            ON DELETE CASCADE ON UPDATE CASCADE ;

            ALTER TABLE d_structures ADD CONSTRAINT fk_struct_directoire
            FOREIGN KEY (Struct_Directoire) REFERENCES ref_directoires (Directoire_Acronyme)
            ON DELETE CASCADE ON UPDATE CASCADE ;

            ALTER TABLE d_structures ADD CONSTRAINT fk_struct_localisation
            FOREIGN KEY (Struct_Localisation) REFERENCES ref_localisations (Loc_Site)
            ON DELETE CASCADE ON UPDATE CASCADE ;

            ALTER TABLE d_structures ADD CONSTRAINT fk_struct_poleut
            FOREIGN KEY (Struct_PoleUT) REFERENCES ref_poles_ut (PoleUT_Acronyme)
            ON DELETE CASCADE ON UPDATE CASCADE ;
            
            
            ALTER TABLE d_sous_structures ADD CONSTRAINT fk_sous_struct_structure
            FOREIGN KEY (Ss_Struct_Structure) REFERENCES d_structures (Struct_Num)
            ON DELETE CASCADE ON UPDATE CASCADE ;
            
            
            CREATE TABLE IF NOT EXISTS d_competences_scientifiques (
                CS_Num VARCHAR(255) Primary Key,
                CS_Mot_Cle_Fr VARCHAR(255),
                CS_Mot_Cle_En VARCHAR(255),
                CS_Ss_Struct_Num VARCHAR(255)
            );

            ALTER TABLE d_competences_scientifiques ADD CONSTRAINT fk_competences_ss_struct
            FOREIGN KEY (CS_Ss_Struct_Num) REFERENCES d_sous_structures (Ss_Struct_Num)
            ON DELETE CASCADE ON UPDATE CASCADE;
            
            
            CREATE TABLE IF NOT EXISTS ref_ct_domaines (
                CT_Domaine_Fr VARCHAR(255),
                CT_Domaine_En VARCHAR(255),
                PRIMARY KEY (CT_Domaine_Fr)
            );
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.ref_ct_sous_domaines (
              CT_Ss_Domaine_Fr VARCHAR(255) Primary Key,
              CT_Ss_Domaine_En VARCHAR(255) NULL
            );
            
            
            CREATE INDEX IF NOT EXISTS idx_ref_ct_sous_domaines_CT_Ss_Domaine_Fr 
            ON cartorecherche_ut3_projet_etudiant_db.ref_ct_sous_domaines (CT_Ss_Domaine_Fr);
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (
            CT_Num VARCHAR(255) NULL,
            CT_Intitule_Court_FR VARCHAR(255) NULL,
            CT_Intitule_Court_En VARCHAR(255) NULL,
            CT_Description_Fr TEXT NULL,
            CT_Description_En TEXT NULL,
            CT_Plateau VARCHAR(255) NULL,
            CT_Ss_Struct_Num VARCHAR(255) NULL,
            CT_Ss_Domaine VARCHAR(255) NULL,
            CT_URL VARCHAR(255) NULL,
            CT_URL_En VARCHAR(255) NULL,
            CONSTRAINT pk_d_competences_techniques PRIMARY KEY (CT_Num)
            );
            
            
            CREATE INDEX IF NOT EXISTS idx_d_competences_techniques_CT_Num 
            ON cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Num);

            CREATE INDEX IF NOT EXISTS fk_d_competences_techniques_CT_Ss_Struct_Num 
            ON cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Ss_Struct_Num);

            CREATE INDEX IF NOT EXISTS fk_d_competences_techniques_CT_Ss_Domaine 
            ON cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Ss_Domaine);
            
            
            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.d_competences_techniques 
            ADD CONSTRAINT fk_d_competences_techniques_CT_Ss_Domaine
            FOREIGN KEY (CT_Ss_Domaine)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_ct_sous_domaines (CT_Ss_Domaine_Fr)
            ON DELETE CASCADE
            ON UPDATE CASCADE ;

            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.d_competences_techniques 
            ADD CONSTRAINT fk_d_competences_techniques_CT_Ss_Struct_Num
            FOREIGN KEY (CT_Ss_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_sous_structures (Ss_Struct_Num) 
            ON DELETE CASCADE
            ON UPDATE CASCADE;
            
            
            CREATE TABLE IF NOT EXISTS j_ct_domaine (
            J_CT_Num VARCHAR(255),
            J_CT_Domaine VARCHAR(255),
            CONSTRAINT fk_J_CT_Domaine_J_CT_Domaine
            FOREIGN KEY (J_CT_Domaine)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_ct_domaines (CT_Domaine_Fr)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_CT_Domaine_J_CT_Num
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_plateformes (
            PF_Nom VARCHAR(255),
            PF_Nom_En VARCHAR(255),
            PF_Label_s VARCHAR(255),
            PF_URL VARCHAR(255),
            PF_URL_En VARCHAR(255),
            PRIMARY KEY (PF_Nom)
            );
            
            
            CREATE TABLE IF NOT EXISTS j_ct_plateforme (
            J_CT_Num VARCHAR(255),
            J_PF_Nom VARCHAR(255),
            CONSTRAINT fk_J_CT_Plateforme_J_CT_Num
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_CT_Plateforme_J_PF_Nom
            FOREIGN KEY (J_PF_Nom)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_plateformes (PF_Nom)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_ct_technologies (
            CT_Techno_Fr VARCHAR(255),
            CT_Techno_En VARCHAR(255),
            PRIMARY KEY (CT_Techno_Fr)
            );
            
            
            CREATE TABLE IF NOT EXISTS j_ct_techno (
            J_CT_Num VARCHAR(255),
            J_CT_Techno_Fr VARCHAR(255),
            CONSTRAINT fk_J_CT_Techno_J_CT_Num
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_CT_Techno_J_CT_Techno_Fr
            FOREIGN KEY (J_CT_Techno_Fr)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_ct_technologies (CT_Techno_Fr)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_infrastructures_europeennes (
            Infra_Europ_Acronyme VARCHAR(10) NOT NULL,
            Infra_Europ_Nom VARCHAR(255),
            PRIMARY KEY (Infra_Europ_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS j_pf_infra_europ (
            J_PF_Nom VARCHAR(255) NOT NULL,
            J_Infra_Europ_Acronyme VARCHAR(10) NOT NULL,
            PRIMARY KEY (J_PF_Nom, J_Infra_Europ_Acronyme),
            CONSTRAINT fk_J_PF_Infra_Europ_J_PF_Nom
            FOREIGN KEY (J_PF_Nom)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_plateformes (PF_Nom)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_j_pf_infra_europ_ref_infrastructures_europeennes1
            FOREIGN KEY (J_Infra_Europ_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_infrastructures_europeennes (Infra_Europ_Acronyme)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_infrastructures_nationales (
            Infra_Nationale_Acronyme VARCHAR(255),
            Infra_Nationale_Nom VARCHAR(255),
            Infra_Nationale_Nom_En VARCHAR(255),
            PRIMARY KEY (Infra_Nationale_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS j_pf_infra_nationale (
            J_PF_Nom VARCHAR(255),
            J_Infra_Nationale_Acronyme VARCHAR(255),
            PRIMARY KEY (J_PF_Nom, J_Infra_Nationale_Acronyme),
            CONSTRAINT fk_J_PF_Infra_Nationale_J_PF_Nom
            FOREIGN KEY (J_PF_Nom)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_plateformes (PF_Nom)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_j_pf_infra_nationale_ref_infrastructures_nationales1
            FOREIGN KEY (J_Infra_Nationale_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_infrastructures_nationales (Infra_Nationale_Acronyme)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
            );
            
            
            CREATE TABLE IF NOT EXISTS j_sous_struct_localisation (
            J_Sous_Struct_Num VARCHAR(255),
            J_Loc_Site VARCHAR(255),
            PRIMARY KEY (J_Sous_Struct_Num, J_Loc_Site),
            CONSTRAINT fk_j_sous_struct_localisation_d_sous_structures
            FOREIGN KEY (J_Sous_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_sous_structures (Ss_Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_j_sous_struct_localisation_ref_localisations
            FOREIGN KEY (J_Loc_Site)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_localisations (Loc_Site)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS j_struct_ct (
            J_Struct_Num VARCHAR(255),
            J_CT_Num VARCHAR(255),
            PRIMARY KEY (J_Struct_Num, J_CT_Num),
            CONSTRAINT fk_j_struct_ct_d_structures
            FOREIGN KEY (J_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_structures (Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_j_struct_ct_d_competences_techniques
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_federations (
            Fede_Nom VARCHAR(255),
            Fede_Acronyme VARCHAR(255),
            PRIMARY KEY (Fede_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS j_fede_struct (
            J_Struct_Num VARCHAR(255),
            J_Fede_Acronyme VARCHAR(255),
            PRIMARY KEY (J_Struct_Num, J_Fede_Acronyme),
            CONSTRAINT fk_j_fede_struct_d_structures
            FOREIGN KEY (J_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_structures (Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_j_fede_struct_ref_federations
            FOREIGN KEY (J_Fede_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_federations (Fede_Acronyme)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_tutelles (
            Tutelle_Acronyme VARCHAR(255),
            Tutelle_Nom VARCHAR(255),
            PRIMARY KEY (Tutelle_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS j_struct_tutelle (
            J_Struct_Num VARCHAR(255),
            J_Tutelle_Acronyme VARCHAR(255),
            PRIMARY KEY (J_Struct_Num, J_Tutelle_Acronyme),
            CONSTRAINT fk_j_struct_tutelle_d_structures
            FOREIGN KEY (J_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_structures (Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_j_struct_tutelle_ref_tutelles
            FOREIGN KEY (J_Tutelle_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.ref_tutelles (Tutelle_Acronyme)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS ref_type_sous_structuration (
            Type_Sous_Struct VARCHAR(255),
            PRIMARY KEY (Type_Sous_Struct)
            );
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.Ref_Nomenclature_HCERES (
            HCERES_Domaine_Fr VARCHAR(255) NULL,
            HCERES_Panel_Fr VARCHAR(255) NULL,
            HCERES_Sous_Panel_Fr VARCHAR(255) NOT NULL,
            HCERES_Domaine_En VARCHAR(255) NULL,
            HCERES_Panel_En VARCHAR(255) NULL,
            HCERES_Sous_Panel_En VARCHAR(255) NULL,
            PRIMARY KEY (HCERES_Sous_Panel_Fr)
            );
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.j_cs_hceres (
            J_CS_Num VARCHAR(255) NOT NULL,
            J_HCERES_Sous_Panel VARCHAR(255) NOT NULL,
            PRIMARY KEY (J_CS_Num, J_HCERES_Sous_Panel)
            );
            
            
            CREATE INDEX IF NOT EXISTS fk_J_CS_HCERES_J_CS_Num 
            ON cartorecherche_ut3_projet_etudiant_db.j_cs_hceres (J_CS_Num);

            CREATE INDEX IF NOT EXISTS fk_j_cs_hceres_Ref_Nomenclature_HCERES1_idx 
            ON cartorecherche_ut3_projet_etudiant_db.j_cs_hceres (J_HCERES_Sous_Panel);
            
            
            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.j_cs_hceres
            ADD CONSTRAINT fk_J_CS_HCERES_J_CS_Num
            FOREIGN KEY (J_CS_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_competences_scientifiques (CS_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE;

            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.j_cs_hceres
            ADD CONSTRAINT fk_j_cs_hceres_Ref_Nomenclature_HCERES1
            FOREIGN KEY (J_HCERES_Sous_Panel)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_Nomenclature_HCERES (HCERES_Sous_Panel_Fr)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.d_tes (
            TES_Num INT NULL DEFAULT NULL,
            TES_Fr TEXT NULL DEFAULT NULL,
            TES_En VARCHAR(255) NULL DEFAULT NULL,
            TES_Ss_Struct_Num VARCHAR(255) NULL DEFAULT NULL,
            "Transition écologique" VARCHAR(255) NULL DEFAULT NULL,
            "Transition sociétale" VARCHAR(255) NULL DEFAULT NULL
            );
            
            
            CREATE INDEX IF NOT EXISTS fk_D_TES_TES_Ss_Struct_Num 
            ON cartorecherche_ut3_projet_etudiant_db.d_tes (TES_Ss_Struct_Num);
            
            
            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.d_tes
            ADD CONSTRAINT fk_D_TES_TES_Ss_Struct_Num
            FOREIGN KEY (TES_Ss_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.d_sous_structures (Ss_Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE;
            