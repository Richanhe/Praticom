import React from 'react';
import ReactDOM from 'react-dom/client';
import Operacoes from './Operacoes.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Operacoes showToast={(message) => window.alert(message)} />
  </React.StrictMode>,
);
