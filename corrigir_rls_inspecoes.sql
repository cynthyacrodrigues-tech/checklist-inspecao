-- Permite que usuários autenticados salvem inspeções próprias e os itens
-- correspondentes, removendo políticas legadas que possam conflitar.
-- Execute no SQL Editor do Supabase.

BEGIN;

ALTER TABLE public.inspecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_inspecao ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.inspecoes, public.itens_inspecao TO authenticated;

-- Retorna o id do perfil vinculado à sessão Auth atual sem depender de uma
-- política RLS de leitura da própria tabela usuarios.
CREATE OR REPLACE FUNCTION public.usuario_atual_id()
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id_usuario
  FROM public.usuarios
  WHERE auth_uid = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.usuario_atual_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.usuario_atual_id() TO authenticated;

-- Remove políticas antigas/restritivas das tabelas do checklist.
DO $$
DECLARE
  politica RECORD;
BEGIN
  FOR politica IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('inspecoes', 'itens_inspecao')
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON public.%I',
      politica.policyname,
      politica.tablename
    );
  END LOOP;
END;
$$;

CREATE POLICY inspecoes_consultar ON public.inspecoes
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY inspecoes_cadastrar ON public.inspecoes
  FOR INSERT TO authenticated
  WITH CHECK (id_usuario = public.usuario_atual_id());

CREATE POLICY itens_consultar ON public.itens_inspecao
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY itens_cadastrar ON public.itens_inspecao
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.inspecoes
      WHERE inspecoes.id_inspecao = itens_inspecao.id_inspecao
        AND inspecoes.id_usuario = public.usuario_atual_id()
    )
  );

NOTIFY pgrst, 'reload schema';

COMMIT;
