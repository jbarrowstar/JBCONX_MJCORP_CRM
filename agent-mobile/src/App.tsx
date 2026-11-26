import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AppRoutes } from './routes';
import { AuthGate } from './features/auth/AuthGate';
import './styles/globals.css';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthGate>
          <AppRoutes />
        </AuthGate>
      </BrowserRouter>
    </Provider>
  );
};

export default App;

