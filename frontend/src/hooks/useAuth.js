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
} from "../store/slices/authSlice.js";
import authService from "../services/authService.js";

export const useAuth = () => {
    const dispatch = useDispatch();
    const { user, token, isLoading, isAuthenticated, error } = useSelector(
        (state) => state.auth
    );

    // Register function
    const register = async (name, email, password) => {
        dispatch(registerStart());
        try {
            const data = await authService.register(name, email, password);
            dispatch(registerSuccess(data));
            return data;
        } catch (err) {
            const errorMessage = err.message || "Registration failed";
            dispatch(registerFailure(errorMessage));
            throw err;
        }
    };

    // Login function
    const login = async (email, password) => {
        dispatch(loginStart());
        try {
            const data = await authService.login(email, password);
            dispatch(loginSuccess(data));
            return data;
        } catch (err) {
            const errorMessage = err.message || "Login failed";
            dispatch(loginFailure(errorMessage));
            throw err;
        }
    };

    // Logout function
    const logoutUser = () => {
        dispatch(logout());
    };

    // Restore auth from localStorage (on page load)
    const restoreAuthFromStorage = () => {
        const token = localStorage.getItem("token");
        if (token) {
            dispatch(restoreAuth({ token, user: null }));
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