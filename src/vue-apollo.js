import Vue from 'vue'
import VueApollo from 'vue-apollo'
import { createApolloClient, restartWebsockets } from 'vue-cli-plugin-apollo/graphql-client'
import { setContext } from 'apollo-link-context'
//import { TokenRefreshLink } from 'apollo-link-token-refresh'

// Install the vue plugin
Vue.use(VueApollo)

// Name of the sessionStorage item
const AUTH_TOKEN = 'apollo-token'

// Http endpoint
const httpEndpoint = process.env.VUE_APP_API_URL || 'http://localhost:1337/graphql'
//variante a tester
//const httpEndpoint = process.env.VUE_APP_GRAPHQL_HTTP|| 'http://localhost:1337/graphql'
const authLink = setContext(async (_, { headers }) => {
  // get the authentication token from local storage if it exists
  const token = JSON.parse(sessionStorage.getItem('apollo-token'))
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      Authorization: token || ''
    }
  }
})

// Config
const defaultOptions = {
  // You can use `https` for secure connection (recommended in production)
  httpEndpoint,
  // You can use `wss` for secure connection (recommended in production)
  // Use `null` to disable subscriptions
  // wsEndpoint: process.env.VUE_APP_GRAPHQL_WS || 'ws://localhost:4000/graphql',
  // LocalStorage token
  tokenName: AUTH_TOKEN,
  // Enable Automatic Query persisting with Apollo Engine
  persisting: false,
  // Use websockets for everything (no HTTP)
  // You need to pass a `wsEndpoint` for this to work
  websocketsOnly: false,
  // Is being rendered on the server?
  ssr: false,

  // Override default apollo link
  // note: don't override httpLink here, specify httpLink options in the
  // httpLinkOptions property of defaultOptions.
  link: authLink

  // Override default cache
  // cache: myCache

  // Override the way the Authorization header is set
  // getAuth: (tokenName) => ...

  // Additional ApolloClient options
  // apollo: { ... }

  // Client local data (see apollo-link-state)
  // clientState: { resolvers: { ... }, defaults: { ... } }
}

export const { apolloClient, wsClient } = createApolloClient({
  ...defaultOptions
  // ...options
})

// Call this in the Vue app file
export function createProvider () {
  // Create vue apollo provider
  const apolloProvider = new VueApollo({
    defaultClient: apolloClient,
    defaultOptions: {
      $query: {
        fetchPolicy: 'cache-and-network'
      }
    },
    errorHandler (error) {
      // eslint-disable-next-line no-console
      console.log('%cError', 'background: red; color: white; padding: 2px 4px; border-radius: 3px; font-weight: bold;', error.message)
    }
  })
  return apolloProvider
}

// Manually call this when user log in
export async function onLogin (apolloClient, token) {
  console.log('onLogin avant le if')
  if (typeof sessionStorage !== 'undefined' && token) {
    sessionStorage.setItem(AUTH_TOKEN, token)
    console.log('IMP onLogin set AUTH_TOKEN')
  }
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  try {
    apolloClient.cache.reset()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('%cError on cache reset (login)', 'color: orange;', e.message)
  }
}

// Manually call this when user log out
export async function onLogout (apolloClient) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(AUTH_TOKEN)
    console.log('onLogout remove AUTH_TOKEN')
  }
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  try {
    apolloClient.cache.reset()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('%cError on cache reset (logout)', 'color: orange;', e.message)
  }
}
