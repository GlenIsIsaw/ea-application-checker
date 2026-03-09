import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// 🎨 Secure ASCII Art Console Welcome
const asciiArt = `
%c
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║        APPLICATION CHECKER by Glen Pabico                ║
║                                                          ║
║        Secure | Fast | Reliable                          ║
║        Camarines Norte - 2nd District                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;

console.log(asciiArt, 'color: #2e7d32; font-weight: bold; font-size: 12px;');

console.log(
  '%c✨ Thank you for visiting! ✨',
  'color: #1b5e20; font-size: 14px; font-style: italic;'
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);