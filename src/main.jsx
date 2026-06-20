import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { ThemeContext, useThemeProvider } from './all/hooks/useTheme.js';

// eslint-disable-next-line react-refresh/only-export-components
function Root() {
  const theme = useThemeProvider();
  return (
    <ThemeContext.Provider value={theme}>
      <App />
    </ThemeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
