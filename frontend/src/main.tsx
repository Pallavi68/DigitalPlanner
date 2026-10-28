import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './components/Toast';
import { DragProvider } from './lib/DragContext';
import { PlannerProvider } from './store/PlannerContext';
import { BackendGate } from './components/BackendGate';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <BackendGate>
        {(userId, onSignOut) => (
          <PlannerProvider userId={userId} onSignOut={onSignOut}>
            <ToastProvider>
              <DragProvider>
                <App userId={userId} />
              </DragProvider>
            </ToastProvider>
          </PlannerProvider>
        )}
      </BackendGate>
    </BrowserRouter>
  </React.StrictMode>,
);
