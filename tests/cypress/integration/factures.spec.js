const url = Cypress.env('site');
const api = Cypress.env('api');
const login = Cypress.env('identifier');
const passwd = Cypress.env('password');

const minFacturesInfo = `query getMinFactureInfos($id: [ID]!) { factures(where: {id: $id}) { id ref nom date payer media { url } } }`;
const UserFactures = `query getFacturesId($id: ID!) { users(where: {id: $id}) { factures entreprises { id nom factures { media { url } id } } } }`;
var token;
var UserId;
var facturesInfo = [];
var facturesId = [];

function ExchangeDate (date) {
    var array = date.split('-');
    array = array.reverse();
    return array.join('-');
}

describe('Test du tableau', () => {
    before (() => {
        cy.request({
            method: 'POST',
            url: api+"/auth/local",
            body: {identifier: login, password: passwd}
        }).then((response) => {
            token = response.body.jwt;
            UserId = response.body.user.id;
            cy.request({
                method: 'POST',
                url: api+"/graphql",
                headers: {Authorization: `Bearer ${token}`},
                body: {operationName: 'getFacturesId', query: UserFactures, variables: {id: UserId}}
            }).then((response) => {         
                const corps = response.body.data.users[0].entreprises;
                corps.forEach((corp) => {
                    corp.factures.forEach((facture) => {
                        facturesId.push(facture.id);
                        facturesInfo.push({id: facture.id, entreprise: corp.nom});
                    });
                });
                cy.wait(1000);
                cy.request({
                    method: 'POST',
                    url: api+'/graphql',
                    headers: {Authorization: `Bearer ${token}`},
                    body: {operationName: 'getMinFactureInfos', query: minFacturesInfo, variables: {id: facturesId}}
                }).then((response) => {
                    response.body.data.factures.forEach((facture) => {
                        facturesInfo.forEach((factureInfo) => {
                            if (factureInfo.id === facture.id) {
                                factureInfo.date = facture.date;
                                factureInfo.nom = facture.nom;
                                factureInfo.ref = facture.ref;
                                factureInfo.payer = facture.payer;
                            }
                        })
                    });
                })
            })
        })
    });
    it('Check Table ref', () => {
        cy.visit(url+"/factures");
        cy.uilogin(login, passwd);
        facturesInfo.forEach((facture) => {
            cy.get('tbody').children('.'+facture.ref).then((row) => {
                expect(row.children('.ref').text()).to.equal(facture.ref);
                expect(row.children('.nom').text()).to.equal(facture.nom);
                expect(row.children('.date').text()).to.equal(ExchangeDate(facture.date));
                expect(row.children('.entreprise').text()).to.equal(facture.entreprise);
                expect(row[0].attributes.class.value).to.contains(facture.payer ? 'payee' : 'impayee')
            });
        })
    });
});