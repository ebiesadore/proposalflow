import { supabase, getAuthUser } from '../lib/supabase';

const toEntry = (row) => ({
  id: row?.id,
  category: row?.category,
  title: row?.title,
  content: row?.content,
  userId: row?.user_id,
  createdAt: row?.created_at,
  updatedAt: row?.updated_at,
});

export const contentLibraryService = {
  async getByCategory(category) {
    const user = await getAuthUser();
    const { data, error } = await supabase?.from('content_library')?.select('*')?.eq('user_id', user?.id)?.eq('category', category)?.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || [])?.map(toEntry);
  },

  async create({ category, title, content }) {
    const user = await getAuthUser();
    const { data, error } = await supabase?.from('content_library')?.insert({ category, title, content, user_id: user?.id })?.select()?.single();

    if (error) throw error;
    return toEntry(data);
  },

  async update(id, { title, content }) {
    const user = await getAuthUser();
    const { data, error } = await supabase?.from('content_library')?.update({ title, content })?.eq('id', id)?.eq('user_id', user?.id)?.select()?.single();

    if (error) throw error;
    return toEntry(data);
  },

  async remove(id) {
    const user = await getAuthUser();
    const { error } = await supabase?.from('content_library')?.delete()?.eq('id', id)?.eq('user_id', user?.id);

    if (error) throw error;
  },
};

export default contentLibraryService;
