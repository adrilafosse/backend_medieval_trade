require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

async function initDB() {

    try {
        //await pool.query(`CREATE TABLE IF NOT EXISTS Metier (id_metier SERIAL PRIMARY KEY, nom text);`);
        //await pool.query(`CREATE TABLE IF NOT EXISTS Utilisateur (id_utilisateur SERIAL PRIMARY KEY, pseudo TEXT, mot_de_passe TEXT, niveau INT, fk_metier int, foreign key(fk_metier) references Metier(id_metier));`);
        //await pool.query(`CREATE TABLE IF NOT EXISTS Fabrication (id_fabrication SERIAL PRIMARY KEY, niveau INT, fk_metier int, fk_ressource int, foreign key(fk_metier) references Metier(id_metier), foreign key(fk_ressource) references Ressource(id_ressource));`);
        //await pool.query(`CREATE TABLE IF NOT EXISTS Ressource (id_ressource SERIAL PRIMARY KEY, nom text);`);
        //await pool.query(`CREATE TABLE IF NOT EXISTS Inventaire (id_inventaire SERIAL PRIMARY KEY, quantité int, fk_utilisateur int, fk_ressource int, foreign key(fk_utilisateur) references Utilisateur(id_utilisateur), foreign key (fk_ressource) references ressource(id_ressource));`);
        //await pool.query(`Insert into Metier (nom) values('Forgeron'), ('Nain'), ('Alchimiste');`);
        //await pool.query(`Insert into Metier (nom) values('Nain');`);
        //await pool.query(`Insert into Fabrication (niveau, fk_metier, fk_ressource) values(3,1,6), (2,1,7), (1,1,8), (3, 2, 9), (2, 2, 10), (1,2,11), (1,2,12), (2,3,13), (3,3,14), (1,3,15);`);
        //await pool.query(`Insert into Ressource (nom) values('bois'),('cristal de mana'), ('tissu'), ('acier'), ('pépite d''or'), ('bijoux'), ('armure'), ('pioche'), ('écailles de dragon'), ('minerais rares'), ('lingot d''or'), ('torche'), ('pierres précieuses') , ('armure magique'), ('potion')`);
        //await pool.query(`Insert into Inventaire (quantité, fk_utilisateur, fk_ressource) values(100, 1, 1), (100, 1, 2), (100, 1, 3), (100, 1, 4), (100, 1, 5) ,(0, 1, 6),(0, 1, 7),(0, 1, 8),(0, 1, 9),(0, 1, 10),(0, 1, 11),(0, 1, 12),(0, 1, 13),(0, 1, 14),(0, 1, 15);`);
        //await pool.query(`CREATE TABLE IF NOT EXISTS Cout_fabrication (id_cout_fabrication SERIAL PRIMARY KEY,quantite int,fk_fabrication int, fk_ressource int, foreign key(fk_fabrication) references Fabrication(id_fabrication), foreign key(fk_ressource) references Ressource(id_ressource));`);
        //await pool.query(`Insert into cout_fabrication (quantite, fk_fabrication, fk_ressource) values(1 , 3, 1), (3, 3, 4), (1, 6, 4), (3, 6, 5), (1,10, 3), (3,10,2), (1,7,1), (1,7,2), (2,2,9), (1,2,3), (2,2,4), (2,5,8), (1,5,1),(1,5,2),(2,8,1),(1,8,10),(1,1,11),(1,1,13),(2,4,15),(1,4,14),(2,9,5),(2,9,6),(1,9,7);`);
        //await pool.query(`CREATE TABLE IF NOT EXISTS Vente (id_vente SERIAL PRIMARY KEY, prix float, quantite int, statut boolean, fk_utilisateur int, fk_inventaire int, foreign key(fk_utilisateur) references utilisateur(id_utilisateur), foreign key (fk_inventaire) references inventaire(id_inventaire));`);
        //await pool.query(`Drop table Metier, utilisateur, inventaire, fabrication,Cout_fabrication, vente`);
        //await pool.query(`DELETE FROM inventaire`);
        //await pool.query(`DELETE FROM Fabrication`);
        //await pool.query(`Insert into Ressource (nom) values('kamas')`);
        //await pool.query(`update inventaire set quantité = 2500 where fk_utilisateur = 8 and fk_ressource = 16`);
        //await pool.query(`update utilisateur set niveau = 1 where id_utilisateur = 8`);
        //await pool.query(`alter table vente add column fk_ressource int`);
        //await pool.query(`Insert into Ressource (nom) values('Kamas')`)
        console.log('✅ Base de données initialisée avec succès !');
    } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation :', err.message);
    } finally {
        await pool.end();
    }
}

initDB();

async function testDb() {
    try {
        const resultat = await pool.query(`Select * from Fabrication`);
        console.log('✅ resultat =', resultat.rows);
    } catch (err) {
        console.error('❌ Erreur:', err.message);
    } finally {
        await pool.end();
    }
}
//testDb()