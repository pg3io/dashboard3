const url = Cypress.env('site');
const login = Cypress.env('identifier');
const passwd = Cypress.env('password');
const permsQuery = "query getUserPerms($id: ID!) {\n  users(where: {id: $id}) {\n    ged\n    factures\n    activites\n    __typename\n  }\n}\n";
var UserId = 2;
var token;

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
    before(() => {
        cy.request({
            method: 'POST',
            url: Cypress.env('api')+'/auth/local',
            body: {identifier: login, password: passwd}
        }).then((response) => {
            token = response.body.jwt;
            UserId = response.body.user.id;
        });
    }),
    beforeEach(() => {
        cy.login(login, passwd)
    });
    it('Home', () => {
        cy.visit(url)
        cy.expect(cy.get('div.home').children().children()).to.exist
    });
    it('User Permissions and Sidebar', () => {
        cy.visit(url)
        cy.get('ul.nav.flex-column.nav-pills').then((SidebarUL) => {
            cy.request({
                method: 'POST',
                url: Cypress.env('api')+'/graphql',
                headers: {Authorization: `Bearer ${token}`},
                body: {operationName: "getUserPerms", query: permsQuery, variables: {id: UserId}}
            }).then((response) => {
                const User = response.body.data.users[0];
                if (User.factures)
                    expect(SidebarUL.children('li.factures').children('a#factureLink')).to.exist
                else
                    expect(SidebarUL.children('li.factures').children('a#factureLink')).to.be.undefined
                if (User.ged)
                    expect(SidebarUL.children('li.ged').children('a#fichierLink')).to.exist
                else
                    expect(SidebarUL.children('li.ged').children('a#fichierLink')).to.be.undefined
            })
            cy.request({
                method: 'POST',
                url: Cypress.env('api')+'/graphql',
                headers: {Authorization: `Bearer ${token}`},
                body: {operationName: null, query: 'query{parametre{zammad graph}}', variables: null}
            }).then((response) => {
                if (response.body.data.parametre.zammad) {
                    cy.request({
                        method: 'POST',
                        url: Cypress.env('api')+'/graphql',
                        headers: {Authorization: `Bearer ${token}`},
                        body: {operationName: null, query: "query{zammad{token url}}", variables: null}
                    }).then((response) => {
                        console.log(response.body)
                        if (response.body.data.zammad !== null)
                            expect(SidebarUL.children('li.tickets').children('a#ticketLink')).to.exist;
                        else
                            expect(SidebarUL.children('li.tickets').children('a#ticketLink')).to.be.undefined;
                    })
                }
                else
                    expect(SidebarUL.children('li.tickets').children('a#ticketLink')).to.be.undefined;
                if (response.body.data.parametre.graph)
                    expect(SidebarUL.children('li.graph').children('a#graphLink')).to.exist;
                else
                    expect(SidebarUL.children('li.graph').children('a#graphLink')).to.be.undefined;

            });
        });
    });
});