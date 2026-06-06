-- ========================================================================
-- FINANCIAL SYSTEM - DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- ========================================================================
-- This script creates the core table architecture for the multi-tenant
-- financial system. It uses a flexible JSONB storage pattern to 
-- simulate a document database behavior (Firestore style) while 
-- maintaining PostgreSQL's relational power.

-- 1. DROP TABLE IF EXISTS (Use with caution for re-initialization)
-- DROP TABLE IF EXISTS public.koperasi_store;

-- 2. CREATE THE CORE STORAGE TABLE
-- This table handles all modules: Sales, Stock, Accounting, Members, etc.
CREATE TABLE IF NOT EXISTS public.koperasi_store (
    id TEXT PRIMARY KEY,               -- Composite: collection:item_id (or tenant_id:collection:item_id)
    koperasi_id TEXT NOT NULL,         -- Tenant/Organization identifier
    collection TEXT NOT NULL,          -- Module name (e.g., 'tenants', 'stok', 'jurnal', 'anggota')
    item_id TEXT NOT NULL,             -- Specific record identifier
    data JSONB NOT NULL DEFAULT '{}',  -- The actual record payload
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.koperasi_store ENABLE ROW LEVEL SECURITY;

-- 4. CREATE INDEXES FOR PERFORMANCE
-- Fast lookups for tenant data and specific module queries
CREATE INDEX IF NOT EXISTS idx_store_koperasi_id ON public.koperasi_store(koperasi_id);
CREATE INDEX IF NOT EXISTS idx_store_collection ON public.koperasi_store(collection);
CREATE INDEX IF NOT EXISTS idx_store_koperasi_id_collection ON public.koperasi_store(koperasi_id, collection);
-- GIN index for deep searches inside JSONB data
CREATE INDEX IF NOT EXISTS idx_store_data_gin ON public.koperasi_store USING GIN (data);

-- 5. FUNCTION TO UPDATE UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER FOR UPDATED_AT
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.koperasi_store
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. SECURITY POLICIES (RLS RULES)
-- IMPORTANT: These are basic policies. In production, you should
-- validate auth.uid() or emails against the data.tenant_owner or similar.

-- Policy: Allow all operations (Development Mode)
-- In a production environment, restrict this to strictly authenticated users.
CREATE POLICY "Allow read access based on koperasi_id" 
ON public.koperasi_store FOR SELECT 
USING (true); -- Replace 'true' with complex logic if needed

CREATE POLICY "Allow all actions for authenticated users" 
ON public.koperasi_store FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'anon'); 

-- 7. INITIAL CLEANUP (Optional)
-- DELETE FROM public.koperasi_store;
