import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/Toast';
import { DragProvider } from './lib/DragContext';
import { PlannerProvider } from './store/PlannerContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <PlannerProvider>
        <ToastProvider>
          <DragProvider>
            <App />
          </DragProvider>
        </ToastProvider>
      </PlannerProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
