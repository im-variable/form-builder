import { Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@mantine/core'
import Home from './pages/Home'
import FormView from './pages/FormView'
import FormBuilder from './pages/FormBuilder'
import FormComplete from './pages/FormComplete'

function App() {
  return (
    <AppShell padding="md">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form/:formId" element={<FormView />} />
        <Route path="/form/:formId/complete" element={<FormComplete />} />
        <Route path="/builder" element={<FormBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default App

