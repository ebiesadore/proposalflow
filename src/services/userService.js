import { supabase, getAuthUser } from "../lib/supabase";
import { withRetry } from "../utils/retryWithBackoff";

/**
 * User Service - Handles all user-related database operations
 * Converts between snake_case (database) and camelCase (React)
 */

// Convert database user (snake_case) to React user (camelCase)
const dbUserToReactUser = (dbUser) => {
    if (!dbUser) return null;

    return {
        id: dbUser?.id,
        name: dbUser?.full_name,
        email: dbUser?.email,
        phone: dbUser?.phone || "",
        location: dbUser?.location || "",
        avatar:
            dbUser?.avatar_url || "https://img.rocket.new/generatedImages/rocket_gen_img_14f99bc91-1767522014091.png",
        avatarAlt: dbUser?.avatar_url
            ? `Profile photo of ${dbUser?.full_name}`
            : "Default avatar placeholder showing generic user silhouette on neutral background",
        avatarPath: dbUser?.avatar_url || "",
        status: dbUser?.status || "Active",
        lastLogin: dbUser?.last_login,
        employeeId: dbUser?.employee_id || "",
        joinDate: dbUser?.join_date || dbUser?.created_at,
        role: dbUser?.role || "user",
        department: dbUser?.department || "",
        permissionLevel: dbUser?.permission_level || "View Only",
        themePreference: dbUser?.theme_preference || "system",
    };
};

// Convert React user (camelCase) to database user (snake_case)
const reactUserToDbUser = (reactUser) => {
    if (!reactUser) return null;

    return {
        full_name: reactUser?.name,
        email: reactUser?.email,
        phone: reactUser?.phone,
        location: reactUser?.location,
        avatar_url: reactUser?.avatarPath || reactUser?.avatar,
        status: reactUser?.status,
        role: reactUser?.role?.toLowerCase(),
        department: reactUser?.department?.toLowerCase(),
        permission_level: reactUser?.permissionLevel?.toLowerCase(),
        employee_id: reactUser?.employeeId,
        last_login: reactUser?.lastLogin,
        join_date: reactUser?.joinDate,
        theme_preference: reactUser?.themePreference,
    };
};

/**
 * Get all users from database
 */
export const getAllUsers = async () => {
    return withRetry(async () => {
        const { data, error } = await supabase
            ?.from("user_profiles")
            ?.select("*")
            ?.order("created_at", { ascending: false });
        console.log("fetching users dax", data, error);

        if (error) {
            console.error("Error fetching users:", error);
            throw error;
        }

        return data?.map(dbUserToReactUser) || [];
    }, "getAllUsers");
};

/**
 * Get a single user by ID
 */
export const getUserById = async (userId) => {
    return withRetry(async () => {
        const { data, error } = await supabase?.from("user_profiles")?.select("*")?.eq("id", userId)?.single();

        if (error) {
            console.error("Error fetching user:", error);
            throw error;
        }

        return dbUserToReactUser(data);
    }, "getUserById");
};

/**
 * Create a new user in database
 * Note: This creates a user_profile record. For auth users, use Supabase Auth API.
 */
export const createUser = async (userData) => {
    try {
        const user = await getAuthUser();

        // Generate employee ID
        const { count } = await supabase?.from("user_profiles")?.select("*", { count: "exact", head: true });

        const employeeId = `EMP${String((count || 0) + 1)?.padStart(3, "0")}`;

        // Step 1: Create auth user using standard signUp (not admin API)
        // This will send a confirmation email to the user
        const tempPassword = Math.random()?.toString(36)?.slice(-12) + "Aa1!"; // Temporary password

        const { data: authData, error: authError } = await supabase?.auth?.signUp({
            email: userData?.email,
            password: tempPassword,
            options: {
                data: {
                    full_name: userData?.name,
                    role: userData?.role?.toLowerCase() || "user",
                },
                emailRedirectTo: `${window.location?.origin}/login-and-authentication-portal`,
            },
        });

        if (authError) {
            console.error("Error creating auth user:", authError);
            throw new Error(`Failed to create auth user: ${authError.message}`);
        }

        if (!authData?.user?.id) {
            throw new Error("Auth user created but no ID returned");
        }

        // Step 2: Send password reset email so user can set their own password
        const { error: resetError } = await supabase?.auth?.resetPasswordForEmail(userData?.email, {
            redirectTo: `${window.location?.origin}/login-and-authentication-portal`,
        });

        if (resetError) {
            console.warn("Password reset email failed:", resetError);
            // Don't throw - user creation succeeded, just log the warning
        }

        // Step 2: Create or update user profile with the auth user's ID
        const dbUser = {
            id: authData?.user?.id, // Use the auth user's UUID
            employee_id: employeeId,
            join_date: new Date()?.toISOString(),
            last_login: null, // Will be set on first login
            created_at: new Date()?.toISOString(),
            updated_at: new Date()?.toISOString(),
        };

        // Insert or update the profile (trigger might have already created it)
        const { data, error } = await supabase
            ?.from("user_profiles")
            ?.upsert(dbUser, { onConflict: "id" })
            ?.select()
            ?.single();

        if (error) {
            console.error("Error creating user profile:", error);
            // If profile creation fails, we should delete the auth user to maintain consistency
            await supabase?.auth?.admin?.deleteUser(authData?.user?.id);
            throw new Error(`Failed to create user profile: ${error.message}`);
        }

        return dbUserToReactUser(data);
    } catch (error) {
        console.error("Error in createUser:", error);
        throw error;
    }
};

/**
 * Update an existing user
 */
export const updateUser = async (userId, updates) => {
    try {
        const user = await getAuthUser();

        // Convert to database format
        const dbUpdates = reactUserToDbUser(updates);
        dbUpdates.updated_at = new Date()?.toISOString();

        const { data, error } = await supabase
            ?.from("user_profiles")
            ?.update(dbUpdates)
            ?.eq("id", userId)
            ?.select()
            ?.single();

        if (error) {
            console.error("Error updating user:", error);
            throw error;
        }

        return dbUserToReactUser(data);
    } catch (error) {
        console.error("Error in updateUser:", error);
        throw error;
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (userId) => {
    try {
        const user = await getAuthUser();

        const { error } = await supabase?.from("user_profiles")?.delete()?.eq("id", userId);

        if (error) {
            console.error("Error deleting user:", error);
            throw error;
        }

        return true;
    } catch (error) {
        console.error("Error in deleteUser:", error);
        throw error;
    }
};

/**
 * Toggle user status (Active/Inactive)
 */
export const toggleUserStatus = async (userId, currentStatus) => {
    try {
        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
        return await updateUser(userId, { status: newStatus });
    } catch (error) {
        console.error("Error in toggleUserStatus:", error);
        throw error;
    }
};
