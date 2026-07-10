import { useDispatch, useSelector } from "react-redux";
import {
  registerStart,
  registerSuccess,
  registerFailure,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  restoreAuth,
} from "../store/slices/authSlice";
import authService from "../services/authService";
import { AppDispatch, AppRootState } from "../store/index";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();

  // ✅ Now TypeScript knows the state type
  const { user, token, isLoading, isAuthenticated, error } = useSelector(
    (state: AppRootState) => state.auth
  );

  // Register
  const register = async (
  name: string,
  email: string,
  password: string,
  orgName: string,
  industry: string,
  size: string
) => {
  dispatch(registerStart());
  try {
    const data = await authService.register(
      name,
      email,
      password,
      { companyName: orgName, industry, companySize: size }
    );
    dispatch(registerSuccess(data));
    return data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Registration failed";
    dispatch(registerFailure(errorMessage));
    throw err;
  }
};

  // Login
  const login = async (email: string, password: string) => {
    dispatch(loginStart());
    try {
      const data = await authService.login(email, password);
      dispatch(loginSuccess(data));
      return data;
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Login failed";
      dispatch(loginFailure(errorMessage));
      throw err;
    }
  };

  // Logout
  const logoutUser = () => {
    dispatch(logout());
  };

  // Restore auth from localStorage
  const restoreAuthFromStorage = () => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken) {
      try {
        const userObj = savedUser ? JSON.parse(savedUser) : null;
        dispatch(restoreAuth({ token: savedToken, user: userObj }));
      } catch (e) {
        dispatch(restoreAuth({ token: savedToken, user: null }));
      }
    }
  };

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    error,
    register,
    login,
    logoutUser,
    restoreAuthFromStorage,
  };
};