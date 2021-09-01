const url = Cypress.env('site');
const login = Cypress.env('identifier');
const passwd = Cypress.env('password');

var rows = [];

describe('Test de la partie GED', () => {
    it('Test du tableau', () => {
        cy.visit(url+"/fichiers");
        cy.uilogin(login, passwd);
        for (let i = 0; i < 2; i++) {
            cy.get('tbody').children(`.fichier${i}`).then((row) => {
                expect(row).to.exist;
                rows.push({
                    type: row.children('.type').text(),
                    nom: row.children('.nom').text(),
                    date: row.children('.date').text(),
                    entreprise: row.children('.entreprise').text()
                });
            })
        }
    });
    it ('Test du détail', () => {
        cy.visit(url+'/fichiers');
        cy.uilogin(login, passwd);
        cy.get('tr.fichier0').click();
        cy.get('tbody').then(tab => {
            expect(tab.text()).to.contains(rows[0].type);
            expect(tab.text()).to.contains(rows[0].nom);
            cy.wait(1000)
            expect(tab.text()).to.contains(rows[0].date.replaceAll('-', '/'));
            expect(tab.text()).to.contains(rows[0].entreprise);
        });
    });
});