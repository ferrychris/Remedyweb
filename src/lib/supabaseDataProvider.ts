// src/lib/supabaseDataProvider.ts
import { DataProvider } from 'react-admin';
import { supabase } from './supabase';

// Define interfaces for all params types to match react-admin expectations
interface GetListParams {
    pagination?: { page: number; perPage: number };
    sort?: { field: string; order: string };
    filter?: Record<string, any>;
    meta?: any;
}

interface GetOneParams {
    id: string | number;
}

interface CreateParams {
    data: Record<string, any>;
}

interface UpdateParams {
    id: string | number;
    data: Record<string, any>;
    previousData?: Record<string, any>;
}

interface DeleteParams {
    id: string | number;
    previousData?: Record<string, any>;
}

interface DeleteManyParams {
    ids: (string | number)[];
}

interface GetManyParams {
    ids: (string | number)[];
}

interface GetManyReferenceParams {
    target: string;
    id: string | number;
    pagination: { page: number; perPage: number };
    sort: { field: string; order: string };
    filter: Record<string, any>;
}

interface UpdateManyParams {
    ids: (string | number)[];
    data: Record<string, any>;
}

export const supabaseDataProvider: DataProvider = {
    getList: async (resource, params: GetListParams) => {
        const { pagination = { page: 1, perPage: 10 }, sort = { field: 'id', order: 'ASC' }, filter = {} } = params;
        const { page, perPage } = pagination;
        const { field, order } = sort;
        const start = (page - 1) * perPage;
        const end = start + perPage - 1;

        let query = supabase
            .from(resource)
            .select('*', { count: 'exact' })
            .range(start, end)
            .order(field, { ascending: order === 'ASC' });

        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
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

    getOne: async (resource, params: GetOneParams) => {
        const { data, error } = await supabase
            .from(resource)
            .select('*')
            .eq('id', params.id)
            .single();

        if (error) throw error;
        return { data };
    },

    create: async (resource, params: CreateParams) => {
        const { data, error } = await supabase
            .from(resource)
            .insert(params.data)
            .select()
            .single();

        if (error) throw error;
        return { data };
    },

    update: async (resource, params: UpdateParams) => {
        const { data, error } = await supabase
            .from(resource)
            .update(params.data)
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;
        return { data };
    },

    delete: async (resource, params: DeleteParams) => {
        const { data, error } = await supabase
            .from(resource)
            .delete()
            .eq('id', params.id)
            .select()
            .single();

        if (error) throw error;
        return { data };
    },

    deleteMany: async (resource, params: DeleteManyParams) => {
        const { data, error } = await supabase
            .from(resource)
            .delete()
            .in('id', params.ids)
            .select();

        if (error) throw error;
        return { data };
    },

    getMany: async (resource, params: GetManyParams) => {
        const { data, error } = await supabase
            .from(resource)
            .select('*')
            .in('id', params.ids);

        if (error) throw error;
        return { data: data || [] };
    },

    getManyReference: async (resource, params: GetManyReferenceParams) => {
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

    updateMany: async (resource, params: UpdateManyParams) => {
        const { data, error } = await supabase
            .from(resource)
            .update(params.data)
            .in('id', params.ids)
            .select();

        if (error) throw error;
        return { data: data.map(item => item.id) };
    },
};