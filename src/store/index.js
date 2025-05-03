import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';
import logger from 'redux-logger';

// Import reducers
import playerReducer from './playerSlice';
import settlementReducer from './settlementSlice';

// Root reducer configuration
const rootReducer = combineReducers({
  players: playerReducer,
  settlements: settlementReducer,
});

// Redux Persist configuration
const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  // Blacklist state that shouldn't be persisted
  blacklist: [], 
  // You can also whitelist specific slices instead
  // whitelist: ['players', 'settlements'], 
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure middleware
const middleware = [];

// Add logger in development environment
if (__DEV__) {
  middleware.push(logger);
}

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types in serializability checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      immutableCheck: true,
      thunk: true,
    }).concat(middleware),
  devTools: __DEV__,
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript support (if using TypeScript)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// Default export
export default { store, persistor };