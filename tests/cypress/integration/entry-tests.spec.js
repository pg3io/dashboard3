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
            cy.wait(1000)
            cy.location().then(loc => { cy.expect(loc.pathname).to.equal('/'); })
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
        cy.wait(1000);
        cy.get('ul.nav.flex-column.nav-pills').then((SidebarUL) => {
            const factureLink = SidebarUL.children('li.factures').children('a#factureLink')
            const fichierLink = SidebarUL.children('li.ged').children('a#fichierLink')
            expect(factureLink).to.exist
            expect(fichierLink).to.exist
            cy.get(factureLink).click()
            cy.wait(1000)
            cy.location().then(loc => { 
                cy.expect(loc.pathname).to.equal('/factures');
            })
            cy.get(SidebarUL.children().children('a#homeLink')).click()
            cy.get(fichierLink).click()
            cy.wait(1000)
            cy.location().then(loc => { 
                cy.expect(loc.pathname).to.equal('/fichiers');
            })
        })
    })
});

describe('Test du changement de mot de passe', () => {
    it('Se trompe de mot de passe', () => {
        cy.visit(url+'/profile')
        cy.uilogin(login, passwd)
        cy.wait(1000);
        cy.get('span.changepwd').click();
        cy.get('input#oldPassword').type(passwd+'1');
        cy.get('input#newPassword').type(passwd);
        cy.get('input#confirmNewPassword').type(passwd);
        cy.get('button.btn.float-right.btn-success').click();
        cy.expect(cy.contains('Votre mot de passe est incorrect')).to.exist
    })
    it('Les mots de passe ne correspondent pas', () => {
        cy.visit(url+'/profile')
        cy.uilogin(login, passwd)
        cy.wait(1000);
        cy.get('span.changepwd').click()
        cy.get('input#oldPassword').type(passwd)
        cy.get('input#newPassword').type(passwd+"1")
        cy.get('input#confirmNewPassword').type(passwd)
        cy.get('button.btn.float-right.btn-success').click();
        cy.expect(cy.contains('Les mots de passe ne correspondent pas')).to.exist
    })
    it('Change le mot de passe puis remets l\'ancien', () => {
        cy.visit(url+'/profile')
        cy.uilogin(login, passwd)
        cy.wait(1000);
        cy.get('span.changepwd').click()
        cy.get('input#oldPassword').type(passwd)
        cy.get('input#newPassword').type(passwd+"1")
        cy.get('input#confirmNewPassword').type(passwd+"1")
        cy.contains('Valider').click();
        cy.get('a.nav-link.dropdown-toggle').click();
        cy.get('a#logout').click();
        cy.get('input#identifier').type(login)
        cy.get('input#password').type(passwd+"1")
        cy.contains('Connexion').click()
        cy.wait(1000)
        cy.location().then(loc => { cy.expect(loc.pathname).to.equal('/'); })
        cy.visit(url+'/profile')
        cy.uilogin(login, passwd)
        cy.wait(1000);
        cy.get('span.changepwd').click()
        cy.get('input#oldPassword').type(passwd+"1")
        cy.get('input#newPassword').type(passwd)
        cy.get('input#confirmNewPassword').type(passwd)
        cy.contains('Valider').click();
        cy.get('a.nav-link.dropdown-toggle').click();
        cy.get('a#logout').click();
        cy.get('input#identifier').type(login)
        cy.get('input#password').type(passwd)
        cy.contains('Connexion').click()
        cy.wait(1000)
        cy.location().then(loc => { cy.expect(loc.pathname).to.equal('/'); })
    })
})