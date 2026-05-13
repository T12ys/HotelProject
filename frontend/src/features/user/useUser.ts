import {useCallback, useState} from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store";
import { updateUserProfile } from "../../store/authSlice";
import { getProfile, updateProfile, changePassword } from "./userService.ts";
import type { UpdateProfileRequest, ChangePasswordRequest, UserResponse } from "./userTypes.ts";
import {getErrorMessage} from "../../api/errorHandler.ts";
import { useTranslation } from "react-i18next";

export const useUser = () => {
    const dispatch = useDispatch<AppDispatch>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const { t } = useTranslation();

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const fetchProfile = useCallback(async (): Promise<UserResponse | null> => {
        try {
            return await getProfile();
        } catch (e) {
            setError(getErrorMessage(e));
            return null;
        }
    }, []);

    const handleUpdateProfile = async (data: UpdateProfileRequest): Promise<UserResponse | null> => {
        setLoading(true);
        clearMessages();
        try {
            const result = await updateProfile(data);
            dispatch(updateUserProfile({ email: result.email, displayName: result.displayName }));
            setSuccess(t("common.success"));
            return result;
        } catch (e) {
            setError(getErrorMessage(e));
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (data: ChangePasswordRequest): Promise<boolean> => {
        setLoading(true);
        clearMessages();
        try {
            await changePassword(data);
            setSuccess(t("common.success"));
            return true;
        } catch (e) {
            setError(getErrorMessage(e));
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        success,
        clearMessages,
        fetchProfile,
        handleUpdateProfile,
        handleChangePassword,
    };
};