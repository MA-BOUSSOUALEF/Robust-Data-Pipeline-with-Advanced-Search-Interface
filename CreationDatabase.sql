  
            SET check_function_bodies = off;
            CREATE SCHEMA IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db;
            SET search_path TO cartorecherche_ut3_projet_etudiant_db;
            
            
            CREATE TABLE IF NOT EXISTS Ref_composantes_instituts (
                Composante_ou_Institut VARCHAR(255) PRIMARY KEY,
                Composante_ou_Institut_En VARCHAR(255)
            );

            CREATE INDEX IF NOT EXISTS idx_Ref_composantes_instituts_composante_ou_institut 
            ON Ref_composantes_instituts (Composante_ou_Institut) ;
            
            
            CREATE TABLE IF NOT EXISTS Ref_directoires (
                Directoire_Acronyme VARCHAR(255) PRIMARY KEY,
                Directoire_Nom VARCHAR(255),
                Directoire_Nom_En VARCHAR(255)
            );
            CREATE INDEX IF NOT EXISTS idx_Ref_directoires_directoire_acronyme 
            ON Ref_directoires (Directoire_Acronyme) ;
            
            
            CREATE TABLE IF NOT EXISTS Ref_localisations (
                Loc_Site VARCHAR(255) PRIMARY KEY
            );
            CREATE INDEX IF NOT EXISTS idx_Ref_localisations_loc_site 
            ON Ref_localisations (Loc_Site) ;
            
            
            CREATE TABLE IF NOT EXISTS Ref_poles_ut (
                PoleUT_Acronyme VARCHAR(255) PRIMARY KEY,
                PoleUT_Nom VARCHAR(255),
                PoleUT_Nom_En VARCHAR(255)
            );
            CREATE INDEX IF NOT EXISTS idx_Ref_poles_ut_poleut_acronyme 
            ON Ref_poles_ut (PoleUT_Acronyme) ;
            
            
            CREATE TABLE IF NOT EXISTS D_structures (
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
            
              
            CREATE TABLE IF NOT EXISTS D_sous_structures (
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
            
            
            ALTER TABLE D_structures ADD CONSTRAINT fk_struct_composante_institut
            FOREIGN KEY (Struct_Composante_Institut) REFERENCES Ref_composantes_instituts (Composante_ou_Institut)
            ON DELETE CASCADE ON UPDATE CASCADE ;

            ALTER TABLE D_structures ADD CONSTRAINT fk_struct_directoire
            FOREIGN KEY (Struct_Directoire) REFERENCES Ref_directoires (Directoire_Acronyme)
            ON DELETE CASCADE ON UPDATE CASCADE ;

            ALTER TABLE D_structures ADD CONSTRAINT fk_struct_localisation
            FOREIGN KEY (Struct_Localisation) REFERENCES Ref_localisations (Loc_Site)
            ON DELETE CASCADE ON UPDATE CASCADE ;

            ALTER TABLE D_structures ADD CONSTRAINT fk_struct_poleut
            FOREIGN KEY (Struct_PoleUT) REFERENCES Ref_poles_ut (PoleUT_Acronyme)
            ON DELETE CASCADE ON UPDATE CASCADE ;
            
            ALTER TABLE D_sous_structures ADD CONSTRAINT fk_sous_struct_structure
            FOREIGN KEY (Ss_Struct_Structure) REFERENCES D_structures (Struct_Num)
            ON DELETE CASCADE ON UPDATE CASCADE ;
            
            CREATE TABLE IF NOT EXISTS D_competences_scientifiques (
                CS_Num VARCHAR(255) Primary Key,
                CS_Mot_Cle_Fr VARCHAR(255),
                CS_Mot_Cle_En VARCHAR(255),
                CS_Ss_Struct_Num VARCHAR(255)
            );

            ALTER TABLE D_competences_scientifiques ADD CONSTRAINT fk_competences_ss_struct
            FOREIGN KEY (CS_Ss_Struct_Num) REFERENCES D_sous_structures (Ss_Struct_Num)
            ON DELETE CASCADE ON UPDATE CASCADE;
            
            CREATE TABLE IF NOT EXISTS Ref_ct_domaines (
                CT_Domaine_Fr VARCHAR(255),
                CT_Domaine_En VARCHAR(255),
                PRIMARY KEY (CT_Domaine_Fr)
            );
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.Ref_ct_sous_domaines (
              CT_Ss_Domaine_Fr VARCHAR(255) Primary Key,
              CT_Ss_Domaine_En VARCHAR(255) NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_Ref_ct_sous_domaines_CT_Ss_Domaine_Fr 
            ON cartorecherche_ut3_projet_etudiant_db.Ref_ct_sous_domaines (CT_Ss_Domaine_Fr);
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (
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
            CONSTRAINT pk_D_competences_techniques PRIMARY KEY (CT_Num)
            );
            
            
            CREATE INDEX IF NOT EXISTS idx_D_competences_techniques_CT_Num 
            ON cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Num);

            CREATE INDEX IF NOT EXISTS fk_D_competences_techniques_CT_Ss_Struct_Num 
            ON cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Ss_Struct_Num);

            CREATE INDEX IF NOT EXISTS fk_D_competences_techniques_CT_Ss_Domaine 
            ON cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Ss_Domaine);
            
            
            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.D_competences_techniques 
            ADD CONSTRAINT fk_D_competences_techniques_CT_Ss_Domaine
            FOREIGN KEY (CT_Ss_Domaine)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_ct_sous_domaines (CT_Ss_Domaine_Fr)
            ON DELETE CASCADE
            ON UPDATE CASCADE ;

            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.D_competences_techniques 
            ADD CONSTRAINT fk_D_competences_techniques_CT_Ss_Struct_Num
            FOREIGN KEY (CT_Ss_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_sous_structures (Ss_Struct_Num) 
            ON DELETE CASCADE
            ON UPDATE CASCADE;
            
            
            CREATE TABLE IF NOT EXISTS J_ct_domaine (
            J_CT_Num VARCHAR(255),
            J_CT_Domaine VARCHAR(255),
            CONSTRAINT fk_J_CT_Domaine_J_CT_Domaine
            FOREIGN KEY (J_CT_Domaine)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_ct_domaines (CT_Domaine_Fr)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_CT_Domaine_J_CT_Num
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_plateformes (
            PF_Nom VARCHAR(255),
            PF_Nom_En VARCHAR(255),
            PF_Label_s VARCHAR(255),
            PF_URL VARCHAR(255),
            PF_URL_En VARCHAR(255),
            PRIMARY KEY (PF_Nom)
            );
            
            
            CREATE TABLE IF NOT EXISTS J_ct_plateforme (
            J_CT_Num VARCHAR(255),
            J_PF_Nom VARCHAR(255),
            CONSTRAINT fk_J_CT_Plateforme_J_CT_Num
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_CT_Plateforme_J_PF_Nom
            FOREIGN KEY (J_PF_Nom)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_plateformes (PF_Nom)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_ct_technologies (
            CT_Techno_Fr VARCHAR(255),
            CT_Techno_En VARCHAR(255),
            PRIMARY KEY (CT_Techno_Fr)
            );
            
            
            CREATE TABLE IF NOT EXISTS J_ct_techno (
            J_CT_Num VARCHAR(255),
            J_CT_Techno_Fr VARCHAR(255),
            CONSTRAINT fk_J_CT_Techno_J_CT_Num
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_CT_Techno_J_CT_Techno_Fr
            FOREIGN KEY (J_CT_Techno_Fr)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_ct_technologies (CT_Techno_Fr)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_infrastructures_europeennes (
            Infra_Europ_Acronyme VARCHAR(50) NOT NULL,
            Infra_Europ_Nom VARCHAR(255),
            Infra_Europ_Nom_en VARCHAR(255),
            PRIMARY KEY (Infra_Europ_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS J_pf_infra_europ (
            J_PF_Nom VARCHAR(255) NOT NULL,
            J_Infra_Europ_Acronyme VARCHAR(10) NOT NULL,
            PRIMARY KEY (J_PF_Nom, J_Infra_Europ_Acronyme),
            CONSTRAINT fk_J_PF_Infra_Europ_J_PF_Nom
            FOREIGN KEY (J_PF_Nom)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_plateformes (PF_Nom)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_pf_infra_europ_Ref_infrastructures_europeennes1
            FOREIGN KEY (J_Infra_Europ_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_infrastructures_europeennes (Infra_Europ_Acronyme)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_infrastructures_nationales (
            Infra_Nationale_Acronyme VARCHAR(255),
            Infra_Nationale_Nom VARCHAR(255),
            Infra_Nationale_Nom_En VARCHAR(255),
            PRIMARY KEY (Infra_Nationale_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS J_pf_infra_nationale (
            J_PF_Nom VARCHAR(255),
            J_Infra_Nat_Acronyme VARCHAR(255),
            PRIMARY KEY (J_PF_Nom, J_Infra_Nat_Acronyme),
            CONSTRAINT fk_J_PF_Infra_Nationale_J_PF_Nom
            FOREIGN KEY (J_PF_Nom)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_plateformes (PF_Nom)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_pf_infra_nationale_Ref_infrastructures_nationales1
            FOREIGN KEY (J_Infra_Nat_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_infrastructures_nationales (Infra_Nationale_Acronyme)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
            );
            
            
            CREATE TABLE IF NOT EXISTS J_sous_struct_localisation (
            j_ss_struct_num VARCHAR(255),
            j_localisation VARCHAR(255),
            PRIMARY KEY (j_ss_struct_num, j_localisation),
            CONSTRAINT fk_J_sous_struct_localisation_D_sous_structures
            FOREIGN KEY (j_ss_struct_num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_sous_structures (Ss_Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_sous_struct_localisation_Ref_localisations
            FOREIGN KEY (j_localisation)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_localisations (Loc_Site)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS J_struct_ct (
            J_Struct_Num VARCHAR(255),
            J_CT_Num VARCHAR(255),
            PRIMARY KEY (J_Struct_Num, J_CT_Num),
            CONSTRAINT fk_J_struct_ct_D_structures
            FOREIGN KEY (J_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_structures (Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_struct_ct_D_competences_techniques
            FOREIGN KEY (J_CT_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_competences_techniques (CT_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_federations (
            Fede_Nom VARCHAR(255),
            Fede_Acronyme VARCHAR(255),
            fede_nom_en VARCHAR(255),
            PRIMARY KEY (Fede_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS J_Struct_Fede (
            J_Struct_Num VARCHAR(255),
            J_Fede_Acronyme VARCHAR(255),
            PRIMARY KEY (J_Struct_Num, J_Fede_Acronyme),
            CONSTRAINT fk_J_Struct_Fede_D_structures
            FOREIGN KEY (J_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_structures (Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_Struct_Fede_Ref_federations
            FOREIGN KEY (J_Fede_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_federations (Fede_Acronyme)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_tutelles (
            Tutelle_Acronyme VARCHAR(255),
            Tutelle_Nom VARCHAR(255),
            tutelle_nom_en VARCHAR(255),
            PRIMARY KEY (Tutelle_Acronyme)
            );
            
            
            CREATE TABLE IF NOT EXISTS J_struct_tutelle (
            J_Struct_Num VARCHAR(255),
            J_Tutelle_Acronyme VARCHAR(255),
            tutelle_gestionnaire_o_n VARCHAR(25),
            PRIMARY KEY (J_Struct_Num, J_Tutelle_Acronyme),
            CONSTRAINT fk_J_struct_tutelle_D_structures
            FOREIGN KEY (J_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_structures (Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
            CONSTRAINT fk_J_struct_tutelle_Ref_tutelles
            FOREIGN KEY (J_Tutelle_Acronyme)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_tutelles (Tutelle_Acronyme)
            ON DELETE CASCADE
            ON UPDATE CASCADE
            );
            
            
            CREATE TABLE IF NOT EXISTS Ref_type_sous_structuration (
            Type_Ss_Struct VARCHAR(255),
            Type_Ss_Struct_En VARCHAR(255),
            PRIMARY KEY (Type_Ss_Struct)
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
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.J_cs_hceres (
            J_CS_Num VARCHAR(255) NOT NULL,
            J_HCERES_Sous_Panel VARCHAR(255) NOT NULL,
            PRIMARY KEY (J_CS_Num, J_HCERES_Sous_Panel)
            );
            
            
            CREATE INDEX IF NOT EXISTS fk_J_CS_HCERES_J_CS_Num 
            ON cartorecherche_ut3_projet_etudiant_db.J_cs_hceres (J_CS_Num);

            CREATE INDEX IF NOT EXISTS fk_J_cs_hceres_Ref_Nomenclature_HCERES1_idx 
            ON cartorecherche_ut3_projet_etudiant_db.J_cs_hceres (J_HCERES_Sous_Panel);
            
            
            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.J_cs_hceres
            ADD CONSTRAINT fk_J_CS_HCERES_J_CS_Num
            FOREIGN KEY (J_CS_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_competences_scientifiques (CS_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE;

            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.J_cs_hceres
            ADD CONSTRAINT fk_J_cs_hceres_Ref_Nomenclature_HCERES1
            FOREIGN KEY (J_HCERES_Sous_Panel)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.Ref_Nomenclature_HCERES (HCERES_Sous_Panel_Fr)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION;
            
            
            CREATE TABLE IF NOT EXISTS cartorecherche_ut3_projet_etudiant_db.D_tes (
            TES_Num INT NULL DEFAULT NULL,
            TES_Fr TEXT NULL DEFAULT NULL,
            TES_En VARCHAR(255) NULL DEFAULT NULL,
            TES_Ss_Struct_Num VARCHAR(255) NULL DEFAULT NULL,
            Transition_Ecologique VARCHAR(255) NULL DEFAULT NULL,
            Transition_Societale VARCHAR(255) NULL DEFAULT NULL
            );
            
            
            CREATE INDEX IF NOT EXISTS fk_D_TES_TES_Ss_Struct_Num 
            ON cartorecherche_ut3_projet_etudiant_db.D_tes (TES_Ss_Struct_Num);
            
            
            ALTER TABLE cartorecherche_ut3_projet_etudiant_db.D_tes
            ADD CONSTRAINT fk_D_TES_TES_Ss_Struct_Num
            FOREIGN KEY (TES_Ss_Struct_Num)
            REFERENCES cartorecherche_ut3_projet_etudiant_db.D_sous_structures (Ss_Struct_Num)
            ON DELETE CASCADE
            ON UPDATE CASCADE;


