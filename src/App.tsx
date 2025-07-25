import { HashRouter, Route, Routes } from 'react-router'
import HomePage from './pages/Home'
import GraphDemo from './pages/GraphDemo'
import GraphSelect from './pages/GraphSelect'
import Test from './pages/Test'
import Test2 from './pages/Test2'
import Test3 from './pages/Test3'
import Test4 from './pages/Test4'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/GraphDemo" element={<GraphDemo />} />
        <Route path="/GraphSelect" element={<GraphSelect />} />
        <Route path="/test" element={<Test />} />
        <Route path="/test2" element={<Test2 />} />
        <Route path="/test3" element={<Test3 />} />
        <Route path="/test4" element={<Test4 />} />
      </Routes>
    </HashRouter>
  )
}
