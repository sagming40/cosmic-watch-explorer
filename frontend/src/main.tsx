import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// ! = "root 요소는 index.html에 반드시 있다"고 TypeScript에 약속하는 표시 (없으면 앱 자체가 안 뜬다)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
