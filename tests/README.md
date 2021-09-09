
Le dossier 'tests' contient des tests automatisés du front-end via [Cypress](https://cypress.io)

# Setup
1. Exécuter ```npm install``` dans le dossier 'tests'.

2. Insérer les données dans Strapi

  > les valeurs non spécifiés ci-dessous doivent être définies par le développeur.

  * 3 Factures
  * 2 Geds
  * 1 Entreprise possédant les 3 Factures et les 2 fichiers Geds.
  * 1 User

  | Colonne | Valeur |
  | ---- | ---- |
  | Username | _libre_ |
  | Email | _libre_ |
  | Confirmed | True | 
  | Blocked | False |
  | Info | _libre_ |
  | Factures | True |
  | Ged | True |
  | Activites | False | 
  | Role | Authenticated |
  | Entreprises | {entreprise de test} |

3. Créer le fichier 'cypress.env.json' sur le même format que 'example.env.json'

```json
{
    "site": "<URL de votre dashboard>",
    "identifier": "<Username ou Email de votre User>",
    "password": "<Mot de passe de votre User>"
}
```

# Exécution

* Exécuter ```npm test``` à la racine pour afficher les résultats dans le terminal
* Exécuter ```npm run test-ui``` à la racine pour visualiser le déroulement des tests dans un navigateur
