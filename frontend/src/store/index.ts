import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Export types
export type AppDispatch = typeof store.dispatch;
export type AppRootState = ReturnType<typeof store.getState>;

export default store;