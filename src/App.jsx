import React from 'react'
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import { Routes, Route } from 'react-router-dom';
import TableView from './pages/TableView';
 console.log("23-07-25,5:48")

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scanner" element={<Scanner />} />
      <Route path="/table" element={<TableView />} />
    </Routes>
  );
}

export default App
