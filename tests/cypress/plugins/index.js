/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
 const path = require('path')
 
  const dlFolder = path.join(__dirname, '..', 'downloads')
 
  const check = async (pdfName) => {
  const FilePath = path.join(dlFolder, pdfName);
  return FilePath;
 }
 
 module.exports = (on, config) => {
   on('task', {
     checkDownload (pdfName) {
       return check(pdfName)
     }
   })
 }