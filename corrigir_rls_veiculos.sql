-- Libera consulta, cadastro, edição e alteração de situação dos veículos
-- para qualquer conta autenticada no Supabase.
-- Execute no SQL Editor após entrar no sistema com uma conta Auth.

BEGIN;

ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.veiculos TO authenticated;

-- Remove políticas antigas ou restritivas que possam continuar bloqueando
-- o acesso mesmo após a criação de uma política mais permissiva.
DO $$
DECLARE
  politica RECORD;
BEGIN
  FOR politica IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'veiculos'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.veiculos', politica.policyname);
  END LOOP;
END;
$$;

CREATE POLICY veiculos_consultar ON public.veiculos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY veiculos_cadastrar_autenticado ON public.veiculos
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY veiculos_atualizar_autenticado ON public.veiculos
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- O bloqueio/liberação também é usado pelo fluxo de inspeção.
DROP FUNCTION IF EXISTS public.alterar_situacao_veiculo(VARCHAR, VARCHAR);
CREATE OR REPLACE FUNCTION public.alterar_situacao_veiculo(
  codigo_veiculo VARCHAR,
  nova_situacao VARCHAR,
  senha_liberacao VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário entrar no sistema.';
  END IF;
  IF nova_situacao NOT IN ('liberado', 'bloqueado') THEN
    RAISE EXCEPTION 'Situação de veículo inválida.';
  END IF;
  IF nova_situacao = 'liberado' AND senha_liberacao IS DISTINCT FROM '123456' THEN
    RAISE EXCEPTION 'Senha de liberação incorreta.';
  END IF;

  UPDATE public.veiculos
  SET situacao = nova_situacao
  WHERE codigo = codigo_veiculo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Veículo não encontrado.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.alterar_situacao_veiculo(VARCHAR, VARCHAR, VARCHAR)
  TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
