// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add('login', (login, password) => {
    const loginQuery = "mutation ($identifier: String!, $password: String!) {\n  login(input: {identifier: $identifier, password: $password}) {\n    jwt\n    __typename\n  }\n}\n"
    cy.request({
        method: 'POST',
        url: Cypress.env('api')+'/graphql',
        body: {operationName: null, query: loginQuery, variables: {identifier: login, password: password}}
    });
})

Cypress.Commands.add('uilogin', (login, password) => {
    cy.location().then((location) => {
        if (location.pathname === '/login') {
            cy.get('input#identifier').type(login);
            cy.get('input#password').type(password);
            cy.contains('Connexion').click();
        }
    })
})

//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
