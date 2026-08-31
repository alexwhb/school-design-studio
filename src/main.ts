import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import utils from './utils'
import 'normalize.css/normalize.css'
// Element Plus's own dark palette, for the components the editor does not
// restyle itself. base.less re-points its core variables at the editor's
// tokens, so it has to be imported first.
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/styles/index.less'
import '@/common/hooks/useTheme'
import elementConfig from './utils/widgets/elementConfig'
import { createPinia } from 'pinia'
import I18n from '@/languages/index'

const pinia = createPinia()
const app = createApp(App)

elementConfig.components.forEach((component) => {
  component.name && app.component(component.name, component)
})

elementConfig.plugins.forEach((plugin) => {
  app.use(plugin)
})

app
  // .use(store)
  .use(pinia)
  .use(router)
  .use(utils)
  .use(I18n)
  .mount('#app')
