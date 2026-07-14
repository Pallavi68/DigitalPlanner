import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PlannerProvider } from './store/PlannerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlannerProvider>
        <App />
      </PlannerProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
