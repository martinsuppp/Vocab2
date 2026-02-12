import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import MemoryMode from './views/MemoryMode';
import ExamMode from './views/ExamMode';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-900 text-white font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/memory" element={<MemoryMode />} />
          <Route path="/exam" element={<ExamMode />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
