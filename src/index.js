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
║        Front - End Web Developer                         ║
║        Web Designer | IT Personnel | #PadagosLang        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;

console.log(asciiArt, 'color: #2e7d32; font-weight: bold; font-size: 12px;');

console.log(
  '%cFor inquiries: glenpabico20@gmail.com',
  'color: #1b5e20; font-size: 14px; font-style: italic;'
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);