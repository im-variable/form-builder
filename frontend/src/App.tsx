import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import Home from './pages/Home'
import FormView from './pages/FormView'
import FormBuilder from './pages/FormBuilder'
import FormComplete from './pages/FormComplete'
import FormResponses from './pages/FormResponses'

function App() {
  return (
    <AppShell
      padding="md"
      styles={(theme) => ({
        main: {
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%)',
          minHeight: '100vh',
        },
      })}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form/:formId" element={<FormView />} />
        <Route path="/form/:formId/complete" element={<FormComplete />} />
        <Route path="/responses/:formId" element={<FormResponses />} />
        <Route path="/builder" element={<FormBuilder />} />
        <Route path="/builder/:formId" element={<FormBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App

