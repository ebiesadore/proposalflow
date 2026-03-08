import { supabase } from '../lib/supabase';

/**
 * Fetch all roles from the database
 * @returns {Promise<Array>} Array of role objects
 */
export const getAllRoles = async () => {
  try {
    const { data, error } = await supabase?.from('roles')?.select('*')?.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    throw error;
  }
};

/**
 * Create a new role
 * @param {Object} roleData - Role data {name, description}
 * @returns {Promise<Object>} Created role object
 */
export const createRole = async (roleData) => {
  try {
    const { data, error } = await supabase?.from('roles')?.insert({
        name: roleData?.name,
        description: roleData?.description || null,
      })?.select()?.single();

    if (error) {
      console.error('Error creating role:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createRole:', error);
    throw error;
  }
};

/**
 * Update an existing role
 * @param {string} roleId - Role ID
 * @param {Object} roleData - Updated role data
 * @returns {Promise<Object>} Updated role object
 */
export const updateRole = async (roleId, roleData) => {
  try {
    const { data, error } = await supabase?.from('roles')?.update({
        name: roleData?.name,
        description: roleData?.description,
        updated_at: new Date()?.toISOString(),
      })?.eq('id', roleId)?.select()?.single();

    if (error) {
      console.error('Error updating role:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateRole:', error);
    throw error;
  }
};

/**
 * Delete a role
 * @param {string} roleId - Role ID
 * @returns {Promise<void>}
 */
export const deleteRole = async (roleId) => {
  try {
    const { error } = await supabase?.from('roles')?.delete()?.eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteRole:', error);
    throw error;
  }
};