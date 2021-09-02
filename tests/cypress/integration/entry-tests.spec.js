const url = Cypress.env('site');
const login = Cypress.env('identifier');
const passwd = Cypress.env('password');

describe("Test de la porte d'entrée", () => {
    it('Login', () => {
        cy.visit(url, {});
        cy.location().then((location) => {
            if (location.pathname === '/login') {
                cy.get('input#identifier').type(login);
                cy.get('input#password').type(passwd);
                cy.contains('Connexion').click();
            }
            else {
                cy.get('a.nav-link.dropdown-toggle').click();
                cy.get('a#logout').click();
                cy.get('input#identifier').type(login);
                cy.get('input#password').type(passwd);
                cy.contains('Connexion').click();
            }
        })
    });
});

describe('Test du Home', () => {
    it('Home', () => {
        cy.visit(url)
        cy.uilogin(login, passwd)
        cy.expect(cy.get('div.home').children().children()).to.exist
    });
    it('User Permissions and Sidebar', () => {
        cy.visit(url)
        cy.uilogin(login, passwd)
        cy.wait(500);
        cy.get('ul.nav.flex-column.nav-pills').then((SidebarUL) => {
            expect(SidebarUL.children('li.factures').children('a#factureLink')).to.exist
            expect(SidebarUL.children('li.ged').children('a#fichierLink')).to.exist
        })
    })
});