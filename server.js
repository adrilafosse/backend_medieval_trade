const express = require('express');
const cors = require("cors");
const { Pool } = require("pg");
require('dotenv').config();
const argon2 = require('argon2');

const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is running on port ${PORT}`);
});

const app = express();
app.use(cors({
    origin: 'https://frontend-medieval-trade-345909199633.europe-west1.run.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false }
});

//connexion
app.post("/connexion", async(req, res) => {
    const { pseudo, mot_de_passe } = req.body;
    try {
        const resultat = await pool.query("Select u.id_utilisateur,u.pseudo,u.fk_metier,u.niveau,m.nom from utilisateur u join metier m on u.fk_metier=m.id_metier where u.pseudo = $1 and u.mot_de_passe=$2", [pseudo, mot_de_passe]);
        if (resultat.rows.length > 0) {
            //si connexion reussi
            return res.status(200).json({ message: "connexion réussie", resultat: resultat.rows[0] });
        } else {
            //sinon mot de passe ou pseudo incorrect
            return res.status(400).json({ message: "mot de passe ou pseudo incorrect" });
        }
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur connexion");
    }
});

//inscription
app.post("/inscription", async(req, res) => {
    const { pseudo, mot_de_passe, id_metier } = req.body;
    try {
        const resultat = await pool.query("Select id_utilisateur from utilisateur where pseudo = $1", [pseudo]);
        if (resultat.rows.lenght > 0) {
            //si l'utilisateur existe déjà
            return res.status(400).json({ message: "l'utilisateur existe déjà" });
        } else {
            //sinon on crée un nouvel utilisateur
            const resultatSQL = await pool.query("Insert into utilisateur(pseudo, mot_de_passe,niveau, fk_metier) values ($1, $2,$3, $4) RETURNING id_utilisateur", [pseudo, mot_de_passe, 1, id_metier]);
            await pool.query("Insert into Inventaire (quantité, fk_utilisateur, fk_ressource) values(10, $1, 1), (10, $1, 2), (10, $1, 3), (10, $1, 4), (10, $1, 5) ,(0, $1, 6),(0, $1, 7),(0, $1, 8),(0, $1, 9),(0, $1, 10),(0, $1, 11),(0, $1, 12),(0, $1, 13),(0, $1, 14),(0, $1, 15),(100,$1,16)", [resultatSQL.rows[0].id_utilisateur]);
            res.status(201).json({ message: "utilisateur crée avec succès", resultat: resultatSQL.rows[0] });
        }
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur inscription");
    }
});

//afficher fabrication possible
app.post("/fabrication_possible", async(req, res) => {
    const { fk_metier, niveau, id_utilisateur } = req.body;
    try {
        const resultat = await pool.query("SELECT f.id_fabrication, r.nom AS produit, c.quantite, r2.nom ,i.quantité AS quantite_possedee FROM fabrication f JOIN ressource r ON f.fk_ressource = r.id_ressource JOIN cout_fabrication c ON f.id_fabrication = c.fk_fabrication JOIN ressource r2 ON r2.id_ressource = c.fk_ressource LEFT JOIN inventaire i ON i.fk_ressource = r2.id_ressource AND i.fk_utilisateur = $3 WHERE f.niveau <= $1 AND f.fk_metier = $2;", [niveau, fk_metier, id_utilisateur]);
        return res.status(200).json({ message: "fabrication possible récupéré avec succes", resultat: resultat.rows });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur fabrication_possible");
    }
});

//Afficher cout fabrication d’un produit
app.post("/cout_fabrication", async(req, res) => {
    const { id_fabrication, id_utilisateur } = req.body;
    try {
        const resultat = await pool.query(" Select c.fk_fabrication, c.quantite, r.nom, r.id_ressource, i.quantité as quantité_possédé from cout_fabrication c join ressource r on c.fk_ressource = r.id_ressource join inventaire i on i.fk_ressource = r.id_ressource where c.fk_fabrication = $1 and i.fk_utilisateur =$2", [id_fabrication, id_utilisateur]);
        return res.status(200).json({ message: "cout fabrication récupéré avec succes", resultat: resultat.rows });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur cout fabrication");
    }
});

//Inventaire
app.post("/inventaire", async(req, res) => {
    const { id_utilisateur } = req.body;
    try {
        const resultat = await pool.query(" Select i.fk_ressource, r.nom, i.quantité, i.id_inventaire from inventaire i join ressource r on  i.fk_ressource = r.id_ressource where fk_utilisateur = $1 and i.quantité != 0 ", [id_utilisateur]);
        return res.status(200).json({ message: "inventaire récupéré avec succes", resultat: resultat.rows });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur inventaire");
    }
});

//fabrication un produit
app.post("/fabrication", async(req, res) => {
    const { id_utilisateur, id_fabrication, quantite } = req.body;
    try {
        //Recuperation des ressources necessaires et de l'inventaire
        const resultat = await pool.query("Select c.fk_fabrication,f.fk_ressource as ressource_a_produire, r2.nom as produit, c.quantite as quantite_requis, r.nom ,i.id_inventaire, i.quantité as quantite_possede, i.fk_ressource from cout_fabrication c join ressource r on c.fk_ressource = r.id_ressource join inventaire i on i.fk_ressource = r.id_ressource join fabrication f on f.id_fabrication = c.fk_fabrication join ressource r2 on f.fk_ressource= r2.id_ressource where i.fk_utilisateur = $1 and f.id_fabrication = $2", [id_utilisateur, id_fabrication])
        let bool = true;
        //verification qu'on possede assez de ressources
        for (let i = 0; i < resultat.rows.length; i++) {
            if (resultat.rows[i].quantite_requis * quantite <= resultat.rows[i].quantite_possede && bool == true) {
                bool = true;
            } else {
                bool = false;
            }
        }
        if (bool == true) {
            //est ce que on possede deja cette ressource ou pas 
            const resultat2 = await pool.query("Select quantité, id_inventaire from inventaire where fk_utilisateur = $1 and fk_ressource = $2", [id_utilisateur, resultat.rows[0].ressource_a_produire]);
            await pool.query("update inventaire set quantité=$1 where id_inventaire=$2", [resultat2.rows[0].quantité + quantite, resultat2.rows[0].id_inventaire]);
            for (let i = 0; i < resultat.rows.length; i++) {
                //retier les ressources necessaire dans l'inventaire
                await pool.query("update inventaire set quantité=$1 where id_inventaire=$2", [resultat.rows[i].quantite_possede - resultat.rows[i].quantite_requis * quantite, resultat.rows[i].id_inventaire]);
            }
            const resultat3 = await pool.query(" Select i.fk_ressource, r.nom, i.quantité, i.id_inventaire from inventaire i join ressource r on  i.fk_ressource = r.id_ressource where fk_utilisateur = $1 and i.quantité != 0 ", [id_utilisateur]);
            return res.status(201).json({ message: "ajout +" + quantite + " dans l'inventaire", resultat: resultat3.rows });
        } else {
            return res.status(400).json({ message: "vous n'avez pas les ressources nécessaire" });
        }

    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur fabrication");
    }
});

//augmenter niveau
app.post("/augmenter_niveau", async(req, res) => {
    const { id_utilisateur } = req.body;
    try {
        //verifier que l'utilisateur a assez de kamas
        const resultat = await pool.query("Select u.niveau, i.quantité, i.id_inventaire from utilisateur u join inventaire i on u.id_utilisateur = i.fk_utilisateur where i.fk_utilisateur =$1 and i.fk_ressource = 16", [id_utilisateur]);
        //on recupere le metier
        const resultat0 = await pool.query("Select fk_metier from utilisateur where id_utilisateur = $1", [id_utilisateur]);
        //pour passer du niveau 1 au 2
        if (resultat.rows[0].niveau == 1) {
            if (resultat.rows[0].quantité >= 250) {
                //retirer les kamas necessaire pour le passge de niveau
                await pool.query("update inventaire set quantité=$1 where id_inventaire=$2", [resultat.rows[0].quantité - 250, resultat.rows[0].id_inventaire]);
                await pool.query("update utilisateur set niveau=2 where id_utilisateur=$1", [id_utilisateur]);
                //on recupere la liste des fabrications possibles
                const resultat2 = await pool.query("SELECT f.id_fabrication, r.nom AS produit, c.quantite, r2.nom ,i.quantité AS quantite_possedee FROM fabrication f JOIN ressource r ON f.fk_ressource = r.id_ressource JOIN cout_fabrication c ON f.id_fabrication = c.fk_fabrication JOIN ressource r2 ON r2.id_ressource = c.fk_ressource LEFT JOIN inventaire i ON i.fk_ressource = r2.id_ressource AND i.fk_utilisateur = $3 WHERE f.niveau <= $1 AND f.fk_metier = $2;", [2, resultat0.rows[0].fk_metier, id_utilisateur]);
                return res.status(200).json({ message: "vous etes maintenant lvl 2", resultat: resultat2.rows });
            } else {
                return res.status(400).json({ message: "pas assez de kamas" });
            }
        }
        //pour passer du niveau 2 au 3
        else {
            if (resultat.rows[0].quantité >= 500) {
                //retirer les kamas necessaire pour le passge de niveau
                await pool.query("update inventaire set quantité=$1 where id_inventaire=$2", [resultat.rows[0].quantité - 500, resultat.rows[0].id_inventaire]);
                await pool.query("update utilisateur set niveau=3 where id_utilisateur=$1", [id_utilisateur]);
                //on recupere la liste des fabrications possibles
                const resultat2 = await pool.query("SELECT f.id_fabrication, r.nom AS produit, c.quantite, r2.nom ,i.quantité AS quantite_possedee FROM fabrication f JOIN ressource r ON f.fk_ressource = r.id_ressource JOIN cout_fabrication c ON f.id_fabrication = c.fk_fabrication JOIN ressource r2 ON r2.id_ressource = c.fk_ressource LEFT JOIN inventaire i ON i.fk_ressource = r2.id_ressource AND i.fk_utilisateur = $3 WHERE f.niveau <= $1 AND f.fk_metier = $2;", [3, resultat0.rows[0].fk_metier, id_utilisateur]);
                return res.status(200).json({ message: "vous etes maintenant lvl 3", resultat: resultat2.rows });
            } else {
                return res.status(400).json({ message: "pas assez de kamas" });
            }
        }
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur agmenter niveau");
    }
});

//afficher metiers
app.get("/metiers", async(req, res) => {
    try {
        const resultat = await pool.query("Select nom, id_metier from metier");
        return res.status(200).json({ message: "metiers récupéré avec succes", resultat: resultat.rows });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur metier");
    }
});

//mettre en vente
app.post("/mettre_vente", async(req, res) => {
    const { id_utilisateur, id_ressource, quantite, prix } = req.body;
    try {
        const resultat = await pool.query("select fk_ressource, quantité, id_inventaire from inventaire where fk_ressource = $1 and fk_utilisateur=$2", [id_ressource, id_utilisateur]);
        await pool.query("insert into vente(fk_utilisateur,fk_ressource, prix, quantite) values ($1,$2,$3,$4)", [id_utilisateur, id_ressource, prix, quantite]);
        if (resultat.rows[0].quantité - quantite >= 0) {
            await pool.query("update inventaire set quantité= $1 where id_inventaire = $2", [resultat.rows[0].quantité - quantite, resultat.rows[0].id_inventaire]);
            const resultat2 = await pool.query(" Select i.fk_ressource, r.nom, i.quantité, i.id_inventaire from inventaire i join ressource r on  i.fk_ressource = r.id_ressource where fk_utilisateur = $1 and i.quantité != 0 ", [id_utilisateur]);
            return res.status(200).json({ message: "mise en vente", resultat: resultat2.rows });
        } else {
            return res.status(400).json({ message: "Vous n'avez pas assez de cette ressource" });
        }
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur metier");
    }
});

//afficher le tableau des ventes
app.post("/tableau_vente", async(req, res) => {
    const { id_utilisateur, id_ressource } = req.body;
    try {
        const resultat = await pool.query("Select v.id_vente, v.prix, v.quantite, v.fk_utilisateur, v.fk_ressource, r.nom, u.pseudo from vente v join ressource r on v.fk_ressource = r.id_ressource join utilisateur u on u.id_utilisateur= v.fk_utilisateur where v.fk_ressource=$1 and v.fk_utilisateur!=$2", [id_ressource, id_utilisateur]);
        return res.status(200).json({ message: "tableau des vente récupéré avec succes", resultat: resultat.rows });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur tableau de vente");
    }
});

//recuperer le nom de toutes les ressources
app.get("/ressource", async(req, res) => {
    try {
        const resultat = await pool.query("Select id_ressource, nom from ressource");
        return res.status(200).json({ message: "ressource récupéré avec succes", resultat: resultat.rows });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur recupération ressource");
    }
});

//acheter un truc
app.post("/acheter", async(req, res) => {
    const { id_utilisateur, quantite, id_vente } = req.body;
    try {
        //recuperation kamas du joueur
        const resultat = await pool.query("select quantité as kamas_possede from inventaire where fk_utilisateur = $1 and fk_ressource = 16", [id_utilisateur]);
        //recuperer prix de l'article
        const resultat2 = await pool.query("select prix, quantite, fk_utilisateur, fk_ressource from vente where id_vente = $1", [id_vente]);
        //recuperer les kamas du joueur qui vend
        const resultat3 = await pool.query("select quantité as kamas_vendeur from inventaire where fk_utilisateur=$1 and fk_ressource = 16", [resultat2.rows[0].fk_utilisateur]);
        //recuperer la quantite de la ressource demande que possede le joueur qui achete
        const resultat4 = await pool.query("select quantité as quantite_ressource from inventaire where fk_utilisateur =$1 and fk_ressource = $2", [id_utilisateur, resultat2.rows[0].fk_ressource]);
        if (resultat.rows[0].kamas_possede > (resultat2.rows[0].prix * quantite)) {
            //ajouter la somme a l'utilisateur qui a vendu
            await pool.query("update inventaire set quantité=$1 where fk_utilisateur=$2 and fk_ressource = 16", [resultat3.rows[0].kamas_vendeur + resultat2.rows[0].prix * quantite, resultat2.rows[0].fk_utilisateur]);
            //enlever la somme a l'utilisateur qui achete et lui ajouter ce qu'il a achete
            await pool.query("update inventaire set quantité=$1 where fk_utilisateur=$2 and fk_ressource = 16", [resultat.rows[0].kamas_possede - resultat2.rows[0].prix * quantite, id_utilisateur]);
            await pool.query("update inventaire set quantité=$1 where fk_utilisateur=$2 and fk_ressource = $3", [resultat4.rows[0].quantite_ressource + quantite, id_utilisateur, resultat2.rows[0].fk_ressource]);
            //il achete tout le stock
            if (quantite == resultat2.rows[0].quantite) {
                //supprime la ligne vente
                await pool.query("DELETE FROM vente WHERE id_vente=$1", [id_vente]);
            } else {
                //au met a jour la ligne avec des quantites en moins
                await pool.query("Update vente set quantite= $1 WHERE id_vente=$2", [resultat2.rows[0].quantite - quantite, id_vente]);
            }
            const resultat5 = await pool.query(" Select i.fk_ressource, r.nom, i.quantité, i.id_inventaire from inventaire i join ressource r on  i.fk_ressource = r.id_ressource where fk_utilisateur = $1 and i.quantité != 0 ", [id_utilisateur]);
            const resultat6 = await pool.query("Select v.id_vente, v.prix, v.quantite, v.fk_utilisateur, v.fk_ressource, r.nom, u.pseudo from vente v join ressource r on v.fk_ressource = r.id_ressource join utilisateur u on u.id_utilisateur= v.fk_utilisateur where v.fk_ressource=$1 and v.fk_utilisateur!=$2", [resultat2.rows[0].fk_ressource, id_utilisateur]);
            return res.status(200).json({ message: "achat effectué", resultat: resultat5.rows, resultat2: resultat6.rows });
        }
        return res.status(400).json({ message: "Vous n'avez pas assez de kamas" });
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur achat");
    }
});

//recuperer un objet qu'on a mis en vente
app.post("/annuler_vente", async(req, res) => {
    const { id_utilisateur, id_vente } = req.body;
    try {
        //on recupere la ressource et la quantite mise en vente
        const resultat = await pool.query("Select fk_ressource, quantite from vente where id_vente =$1 and fk_utilisateur = $2", [id_vente, id_utilisateur]);
        if (resultat.rows.length > 0) {
            //recuperer la quantite que le joueur possede de cette ressource dans son inventaire
            const resultat2 = await pool.query("Select id_inventaire ,quantité as quantite_ressource_possede from inventaire where fk_utilisateur= $1 and fk_ressource=$2", [id_utilisateur, resultat.rows[0].fk_ressource]);
            //mettre a jour l'inventaire du joueur avec la nouvelle quantite
            await pool.query("update inventaire set quantité=$1 where id_inventaire=$2", [resultat2.rows[0].quantite_ressource_possede + resultat.rows[0].quantite, resultat2.rows[0].id_inventaire]);
            //enlever la vente
            await pool.query("DELETE FROM vente WHERE id_vente=$1", [id_vente]);
            return res.status(200).json({ message: "mise en vente annule", resultat: resultat.rows });
        } else {
            return res.status(40).json({ message: "vous ne pouvez pas enlever cette vente" });
        }

    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur annulation mise en vente");
    }
});

//changer de metier
app.post("/changer_metier", async(req, res) => {
    const { id_utilisateur, id_metier } = req.body;
    try {
        //recuperation kamas du joueur
        const resultat = await pool.query("select quantité as kamas_possede from inventaire where fk_utilisateur = $1 and fk_ressource = 16", [id_utilisateur]);
        if (resultat.rows[0].kamas_possede >= 250) {
            //changer son metier
            await pool.query("update utilisateur set fk_metier=$1, niveau = 1 where id_utilisateur=$2", [id_metier, id_utilisateur]);
            //lui enlever 250 kamas
            await pool.query("update inventaire set quantité=$1 where fk_utilisateur=$2 and fk_ressource = 16", [resultat.rows[0].kamas_possede - 250, id_utilisateur]);
            //on recupere la liste des fabrications possibles
            const resultat2 = await pool.query("SELECT f.id_fabrication, r.nom AS produit, c.quantite, r2.nom ,i.quantité AS quantite_possedee FROM fabrication f JOIN ressource r ON f.fk_ressource = r.id_ressource JOIN cout_fabrication c ON f.id_fabrication = c.fk_fabrication JOIN ressource r2 ON r2.id_ressource = c.fk_ressource LEFT JOIN inventaire i ON i.fk_ressource = r2.id_ressource AND i.fk_utilisateur = $3 WHERE f.niveau <= $1 AND f.fk_metier = $2;", [1, id_metier, id_utilisateur]);
            return res.status(200).json({ message: "fabrication possible récupéré avec succes", resultat: resultat2.rows });
        } else {
            return res.status(400).json({ message: "Vous devez posséder 250 kamas" });
        }
    } catch (err) {
        console.error(err)
        res.status(500).send("Erreur annulation mise en vente");
    }
});
app.listen(port, () => {
    console.log(`✅ Connecté à Google Cloud SQL !`);
});