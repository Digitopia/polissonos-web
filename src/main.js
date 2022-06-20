import { createApp } from 'vue'

import { createI18n } from 'vue-i18n'
import messages from '@/messages.js'

import mitt from 'mitt'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faPhone } from '@fortawesome/free-solid-svg-icons'

library.add(faPhone)

const i18n = createI18n({
  locale: 'pt',
  messages,
})

import App from './App.vue'
import store from './store'

const app = createApp(App)

import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.use(i18n)
app.use(store)

const emitter = mitt()
app.config.globalProperties.emitter = emitter

app.mount('#app')
