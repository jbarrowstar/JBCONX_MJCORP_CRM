import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AppRoutes } from './routes';
import { AuthGate } from './features/auth/AuthGate';
import { MOCK_API_ENABLED } from '@shared/mock/mockMode';
import { MockModeBanner } from '@shared/mock/MockModeBanner';
import './styles/globals.css';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthGate>
          <AppRoutes />
        </AuthGate>
        {import.meta.env.DEV && MOCK_API_ENABLED && <MockModeBanner />}
      </BrowserRouter>
    </Provider>
  );
};

export default App;

