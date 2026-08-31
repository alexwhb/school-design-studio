import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'normalize.css/normalize.css'
import '@/assets/styles/element-vars'
import '@/assets/styles/index.less'
import '@/assets/styles/element-components'
import '@/assets/styles/ui-shim.less'
import { initStandaloneTheme } from '@/common/hooks/useTheme'
import cssLoader from '@/utils/plugins/cssLoader'
import _config from '@/config'
import App from './App'

initStandaloneTheme()

cssLoader(_config.ICONFONT_EXTRA)
cssLoader(_config.ICONFONT_URL)

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
