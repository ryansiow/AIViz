/**
 * Marks <html data-hydrated> once the app is interactive. End-to-end tests
 * wait for it so they never click before Vue has attached its handlers.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:suspense:resolve', () => {
    document.documentElement.dataset.hydrated = 'true'
  })
})
