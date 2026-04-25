import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import StressForecast from './pages/StressForecast'
import Support from './pages/Support'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forecast" element={<StressForecast />} />
        <Route path="/support" element={<Support />} />
      </Routes>
    </BrowserRouter>
  )
}
