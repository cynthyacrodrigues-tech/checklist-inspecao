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

-- Salva inspeção, itens e situação do veículo em uma única transação. O perfil
-- é determinado no banco pela sessão Auth, nunca por um id enviado pelo cliente.
CREATE OR REPLACE FUNCTION public.salvar_inspecao(
  p_codigo_veiculo VARCHAR,
  p_resultado VARCHAR,
  p_veiculo_bloqueado BOOLEAN,
  p_observacoes TEXT,
  p_itens JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usuario_id BIGINT;
  veiculo_id BIGINT;
  inspecao_id BIGINT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário entrar no sistema.';
  END IF;

  usuario_id := public.usuario_atual_id();
  IF usuario_id IS NULL THEN
    RAISE EXCEPTION 'Não existe perfil vinculado ao usuário autenticado.';
  END IF;
  IF p_resultado IS NULL OR p_resultado NOT IN ('regular', 'irregular', 'pendente') THEN
    RAISE EXCEPTION 'Resultado da inspeção inválido.';
  END IF;
  IF jsonb_typeof(COALESCE(p_itens, '[]'::JSONB)) <> 'array' THEN
    RAISE EXCEPTION 'A lista de itens da inspeção é inválida.';
  END IF;

  SELECT id_veiculo INTO veiculo_id
  FROM public.veiculos
  WHERE codigo = upper(btrim(p_codigo_veiculo));
  IF veiculo_id IS NULL THEN
    RAISE EXCEPTION 'Veículo não encontrado.';
  END IF;

  INSERT INTO public.inspecoes (
    id_veiculo, id_usuario, resultado, veiculo_bloqueado, observacoes
  ) VALUES (
    veiculo_id, usuario_id, p_resultado, COALESCE(p_veiculo_bloqueado, FALSE), p_observacoes
  ) RETURNING id_inspecao INTO inspecao_id;

  INSERT INTO public.itens_inspecao (
    id_inspecao, categoria, nome_item, valor, resultado, item_critico
  )
  SELECT
    inspecao_id,
    item ->> 'categoria',
    item ->> 'nome_item',
    NULLIF(item ->> 'valor', ''),
    item ->> 'resultado',
    COALESCE((item ->> 'item_critico')::BOOLEAN, FALSE)
  FROM jsonb_array_elements(COALESCE(p_itens, '[]'::JSONB)) AS item;

  UPDATE public.veiculos
  SET situacao = CASE
    WHEN COALESCE(p_veiculo_bloqueado, FALSE) THEN 'bloqueado'
    ELSE 'liberado'
  END
  WHERE id_veiculo = veiculo_id;

  RETURN inspecao_id;
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_inspecao(VARCHAR, VARCHAR, BOOLEAN, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_inspecao(VARCHAR, VARCHAR, BOOLEAN, TEXT, JSONB)
  TO authenticated;

-- Permite ao autor corrigir uma inspeção somente nos dez minutos após a criação.
-- A data original não é alterada, portanto uma correção não renova o prazo.
CREATE OR REPLACE FUNCTION public.corrigir_inspecao(
  p_inspecao_id BIGINT,
  p_resultado VARCHAR,
  p_veiculo_bloqueado BOOLEAN,
  p_observacoes TEXT,
  p_itens JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usuario_id BIGINT;
  veiculo_id BIGINT;
  autor_id BIGINT;
  criada_em TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'É necessário entrar no sistema.';
  END IF;
  usuario_id := public.usuario_atual_id();
  IF usuario_id IS NULL THEN
    RAISE EXCEPTION 'Não existe perfil vinculado ao usuário autenticado.';
  END IF;
  IF p_resultado IS NULL OR p_resultado NOT IN ('regular', 'irregular', 'pendente') THEN
    RAISE EXCEPTION 'Resultado da inspeção inválido.';
  END IF;
  IF jsonb_typeof(COALESCE(p_itens, '[]'::JSONB)) <> 'array' THEN
    RAISE EXCEPTION 'A lista de itens da inspeção é inválida.';
  END IF;

  SELECT id_usuario, id_veiculo, data_da_inspecao
    INTO autor_id, veiculo_id, criada_em
  FROM public.inspecoes
  WHERE id_inspecao = p_inspecao_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inspeção não encontrada.';
  END IF;
  IF autor_id <> usuario_id THEN
    RAISE EXCEPTION 'Somente o autor da inspeção pode corrigi-la.';
  END IF;
  IF clock_timestamp() > criada_em + INTERVAL '10 minutes' THEN
    RAISE EXCEPTION 'O prazo de correção de 10 minutos foi encerrado.';
  END IF;

  UPDATE public.inspecoes
  SET resultado = p_resultado,
      veiculo_bloqueado = COALESCE(p_veiculo_bloqueado, FALSE),
      observacoes = p_observacoes
  WHERE id_inspecao = p_inspecao_id;

  DELETE FROM public.itens_inspecao WHERE id_inspecao = p_inspecao_id;
  INSERT INTO public.itens_inspecao (
    id_inspecao, categoria, nome_item, valor, resultado, item_critico
  )
  SELECT
    p_inspecao_id,
    item ->> 'categoria',
    item ->> 'nome_item',
    NULLIF(item ->> 'valor', ''),
    item ->> 'resultado',
    COALESCE((item ->> 'item_critico')::BOOLEAN, FALSE)
  FROM jsonb_array_elements(COALESCE(p_itens, '[]'::JSONB)) AS item;

  UPDATE public.veiculos
  SET situacao = CASE
    WHEN COALESCE(p_veiculo_bloqueado, FALSE) THEN 'bloqueado'
    ELSE 'liberado'
  END
  WHERE id_veiculo = veiculo_id;
END;
$$;

REVOKE ALL ON FUNCTION public.corrigir_inspecao(BIGINT, VARCHAR, BOOLEAN, TEXT, JSONB)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.corrigir_inspecao(BIGINT, VARCHAR, BOOLEAN, TEXT, JSONB)
  TO authenticated;

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
