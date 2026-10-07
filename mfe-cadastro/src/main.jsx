import React from 'react';
import ReactDOM from 'react-dom/client';
import Cadastro from './Cadastro.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Cadastro showToast={(message) => window.alert(message)} />
  </React.StrictMode>,
);
