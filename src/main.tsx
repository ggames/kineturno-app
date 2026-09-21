import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ProveedorAutenticacion } from './contexto/ContextoAutenticacion'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ProveedorAutenticacion>
        <App /> 
      </ProveedorAutenticacion>
    </BrowserRouter>
  </StrictMode>,
)
