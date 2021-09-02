const url = Cypress.env('site');
const login = Cypress.env('identifier');
const passwd = Cypress.env('password');
var rows = [];

describe('Test de la partie Facture', () => {
    it('Test du tableau', () => {
        cy.visit(url+"/factures");
        cy.uilogin(login, passwd);
        for (let i = 0; i < 3; i++) {
            cy.get('tbody').children(`.facture${i}`).then((row) => {
                expect(row).to.exist;
                rows.push({
                    ref: row.children('.ref').text(),
                    nom: row.children('.nom').text(),
                    date: row.children('.date').text(),
                    entreprise: row.children('.entreprise').text()
                });
            })
        }
        rows.sort((a, b) => {
            let epochA = new Date(a.date).getTime();
            let epochB = new Date(b.date).getTime();
            return epochA - epochB;
        });
    });
    it ('Test du détail', () => {
        cy.visit(url+`/factures/${rows[0].ref}`);
        cy.uilogin(login, passwd);
        cy.get('tbody').then(tab => {
            expect(tab.text()).to.contains(rows[0].ref);
            expect(tab.text()).to.contains(rows[0].nom);
            expect(tab.text()).to.contains(rows[0].date.replaceAll('-', '/'));
            expect(tab.text()).to.contains(rows[0].entreprise);
        });
        cy.expect('svg#arrowForward').to.exist;
        cy.get('svg#arrowForward').click();
        cy.location().then((location) => {
            cy.expect(location.pathname).to.equal('/factures/'+rows[1].ref);
            cy.expect('svg#arrowForward').to.exist;
            cy.expect('svg#arrowBackward').to.exist;
            cy.get('svg#arrowForward').click();
            cy.location().then((location) => {
                cy.expect(location.pathname).to.equal('/factures/'+rows[2].ref);
                cy.expect('svg#arrowBackward').to.exist;
                cy.get('svg#arrowBackward').click();
                cy.location().then((location) => {
                    cy.expect(location.pathname).to.equal('/factures/'+rows[1].ref);
                    cy.expect('svg#arrowForward').to.exist;
                    cy.expect('svg#arrowBackward').to.exist;
                    cy.get('svg#arrowBackward').click();
                    cy.location().then((location) => {
                        cy.expect(location.pathname).to.equal('/factures/'+rows[0].ref);
                        cy.get('svg.download').click();
                        cy.task('checkDownload', rows[0].ref+'.pdf').then(path => {
                            console.log("File downloaded : ", path);
                            expect(path).to.contains(rows[0].ref);
                        })
                    })
                })
            })    
        })
    })
});