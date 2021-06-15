import gql from 'graphql-tag'
export * from './querys'

const userId = gql`query {me {id}}`

const facturesId = gql`
query getFacturesId($id: ID!) {
  users(where: {id: $id}) {
    entreprises {
      id
      nom
      factures {
        id
      }
    }
  }
}`

const userBase = gql`
query getUserInfos($id: ID!) {
  users(where: {id: $id}) {
    id
    username
    email
    provider
    info
    entreprises {
      nom
    }
  }
}`

const userInfos = gql`
query getUserInfos($id: ID!) {
  users(where: {id: $id}) {
    id
    username
    email
    provider
    info
    entreprises {
      id
      nom
      factures {
        id
        ref
        nom
        date
      }
    }
  }
}`

const factureInfo = gql`
query getFactureInfos($id: ID!) {
  factures(where: {id: $id}) {
    id
    info
    ref
    payer
    media {
      url
    }
    nom
    date
  }
}`

const minFactureInfo = gql`
query getMinFactureInfos($id: [ID]!) {
  factures(where: {id: $id}) {
    id
    ref
    nom
    date
    payer
    media {
      url
    }
  }
}`

const searchFacture = gql`
query searchFacture($search: String!) {
  factures(where: {ref_contains: $search}) {
    id
  }
}`

const getCustoms = gql`
query {
  parametre {
    title
    footer
    home
  }
}`

const changePassword = gql`
mutation changePassword($id: ID!, $password: String!){
  updateUser(
    input: {
      where: {id: $id}
      data: { password: $password }
    }
  ) {
    user {
      id
    }
  }
}`

const resetEmail = gql`
mutation forgotPassword($email: String!){
  forgotPassword(email:$email){
    ok
  }
}`

const resetPassword = gql`
mutation resetPassword($password: String!, $confirmPassword: String!, $code: String!){
  resetPassword(password: $password, passwordConfirmation: $confirmPassword, code: $code) {
    user {
      id
    }
  }
}`

export {
  userId,
  userInfos,
  factureInfo,
  minFactureInfo,
  facturesId,
  searchFacture,
  userBase,
  getCustoms,
  changePassword,
  resetEmail,
  resetPassword
}
