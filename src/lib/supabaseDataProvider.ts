// src/lib/supabaseDataProvider.ts
import { DataProvider } from 'react-admin';
import { supabase } from './supabase';

interface Params {
    pagination: { page: number; perPage: number };
    sort: { field: string; order: string };
    filter: Record<string, any>;
}

export const supabaseDataProvider: DataProvider = {
    getList: async (resource, params: Params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const start = (page - 1) * perPage;
        const end = start + perPage - 1;

        let query = supabase
            .from(resource)
            .select('*', { count: 'exact' })
            .range(start, end)
            .order(field, { ascending: order === 'ASC' });

        if (params.filter) {
            Object.entries(params.filter).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    query = query.ilike(key, `%${value}%`);
                } else {
                    query = query.eq(key, value);
                }
            });
        }

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
        };
    },

    getOne: async (resource, params) => {
        const { data, error } = await supabase
            .from(resource)
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;
        return { data };
    },

    create: async (resource, params) => {
        const { data, error } = await supabase
            .from(resource)
            .insert(params.data)
            .select()
            .single();

        if (error) throw error;
        return { data };
    },

    update: async (resource, params) => {
        const { data, error } = await supabase
            .from(resource)
            .update(params.data)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;
        return { data };
    },

    delete: async (resource, params) => {
        const { data, error } = await supabase
            .from(resource)
            .delete()
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;
        return { data };
    },

    deleteMany: async (resource, params) => {
        const { data, error } = await supabase
            .from(resource)
            .delete()
            .in('id', params.ids)
            .select();

        if (error) throw error;
        return { data };
    },

    getMany: async (resource, params) => {
        const { data, error } = await supabase
            .from(resource)
            .select('*')
            .in('id', params.ids);

        if (error) throw error;
        return { data: data || [] };
    },

    getManyReference: async (resource, params) => {
        const { page, perPage } = params.pagination;
        const { field, order } = params.sort;
        const start = (page - 1) * perPage;
        const end = start + perPage - 1;

        const { data, error, count } = await supabase
            .from(resource)
            .select('*', { count: 'exact' })
            .eq(params.target, params.id)
            .range(start, end)
            .order(field, { ascending: order === 'ASC' });

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
        };
    },
};