import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import FormView from './pages/FormView'
import FormBuilder from './pages/FormBuilder'
import FormComplete from './pages/FormComplete'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form/:formId" element={<FormView />} />
        <Route path="/form/:formId/complete" element={<FormComplete />} />
        <Route path="/builder" element={<FormBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App

