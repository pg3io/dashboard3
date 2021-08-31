const url = Cypress.env('site');
const loginQuery = "mutation ($identifier: String!, $password: String!) {\n  login(input: {identifier: $identifier, password: $password}) {\n    jwt\n    __typename\n  }\n}\n"
const permsQuery = "query getUserPerms($id: ID!) {\n  users(where: {id: $id}) {\n    ged\n    factures\n    activites\n    __typename\n  }\n}\n";

const UserId = 2;

describe("Test de la porte d'entrée", () => {
    it('Login', () => {
    cy.visit(url, {});
    cy.location().then((location) => {
        if (location.pathname === '/login') {
            cy.get('input#identifier').type('Jimmy');
            cy.get('input#password').type('passwd');
            cy.contains('Connexion').click();
        }
        else {
            cy.get('a.nav-link.dropdown-toggle').click();
            cy.get('a#logout').click();
            cy.get('input#identifier').type('Jimmy');
            cy.get('input#password').type('passwd');
            cy.contains('Connexion').click();
        }
    })
    });
});

describe('Test du Home', () => {
    beforeEach(() => {
        cy.request({
            method: 'POST',
            url: Cypress.env('api')+'/graphql',
            body: {operationName: null, query: loginQuery, variables: {identifier: "Jimmy", password: "passwd"}}
        })
    });
    it('Home', () => {
        cy.visit(url)
        cy.expect(cy.get('div.home').children().children()).to.exist
    });
    it('Permissions and Sidebar', () => {
        cy.visit(url)
        cy.request({
            method: 'POST',
            url: Cypress.env('api')+'/graphql',
            body: {operationName: "getUserPerms", query: permsQuery, variables: {id: UserId}}
        }).then((response) => {
            const User = response.body.data.users[0];
            cy.get('ul.nav.flex-column.nav-pills').then((SidebarUL) => {
                if (User.factures)
                    expect(SidebarUL.children('li.factures').children('a#factureLink')).to.exist
                else
                    expect(SidebarUL.children('li.factures').children('a#factureLink')).to.be.undefined
                if (User.ged)
                    expect(SidebarUL.children('li.ged').children('a#fichierLink')).to.exist
                else
                    expect(SidebarUL.children('li.ged').children('a#fichierLink')).to.be.undefined
            });

        })
    });
});