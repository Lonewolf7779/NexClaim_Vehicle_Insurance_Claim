// -------------------------------------------------
// React Application Entry Point
// -------------------------------------------------
// Initializes the React application by rendering
// the root App component into the DOM.
// Uses StrictMode for highlighting potential problems.
// -------------------------------------------------
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
