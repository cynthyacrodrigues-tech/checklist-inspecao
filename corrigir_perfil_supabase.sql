-- Corrige a tabela de perfis quando a conta Auth existe, mas usuarios.auth_uid
-- ainda não foi criada no banco remoto.
-- Execute no SQL Editor do projeto Supabase.

BEGIN;

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS auth_uid UUID
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- A senha agora pertence ao Supabase Auth; remove a coluna legada obrigatória.
ALTER TABLE public.usuarios
  DROP COLUMN IF EXISTS senha_criptografada;

CREATE UNIQUE INDEX IF NOT EXISTS indice_usuarios_auth_uid
  ON public.usuarios (auth_uid);

-- Vincula um perfil antigo pelo nome de usuário informado nos metadados ou
-- pela parte do e-mail anterior ao @.
UPDATE public.usuarios AS perfil
SET auth_uid = conta.id
FROM auth.users AS conta
WHERE conta.id = '414daf41-3f52-4466-9208-97a98346153e'::UUID
  AND perfil.auth_uid IS NULL
  AND lower(perfil.nome_de_usuario) = lower(
    COALESCE(
      NULLIF(BTRIM(conta.raw_user_meta_data ->> 'nome_de_usuario'), ''),
      split_part(conta.email, '@', 1)
    )
  );

-- Se a conta ainda não tiver perfil, cria um sem sobrescrever outro perfil.
INSERT INTO public.usuarios (auth_uid, nome_de_usuario, tipo_de_perfil)
SELECT
  conta.id,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.usuarios AS existente
      WHERE lower(existente.nome_de_usuario) = lower(
        COALESCE(
          NULLIF(BTRIM(conta.raw_user_meta_data ->> 'nome_de_usuario'), ''),
          split_part(conta.email, '@', 1)
        )
      )
    )
    THEN left(
      COALESCE(
        NULLIF(BTRIM(conta.raw_user_meta_data ->> 'nome_de_usuario'), ''),
        split_part(conta.email, '@', 1)
      ),
      49
    ) || '_' || left(replace(conta.id::TEXT, '-', ''), 8)
    ELSE COALESCE(
      NULLIF(BTRIM(conta.raw_user_meta_data ->> 'nome_de_usuario'), ''),
      split_part(conta.email, '@', 1)
    )
  END,
  'operador'
FROM auth.users AS conta
WHERE conta.id = '414daf41-3f52-4466-9208-97a98346153e'::UUID
  AND NOT EXISTS (
    SELECT 1
    FROM public.usuarios AS perfil
    WHERE perfil.auth_uid = conta.id
  )
ON CONFLICT (auth_uid) DO NOTHING;

-- Cria perfil automaticamente para os próximos usuários Auth.
CREATE OR REPLACE FUNCTION public.criar_perfil_de_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nome TEXT;
BEGIN
  nome := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data ->> 'nome_de_usuario'), ''),
    split_part(NEW.email, '@', 1)
  );

  IF EXISTS (
    SELECT 1 FROM public.usuarios AS perfil
    WHERE lower(perfil.nome_de_usuario) = lower(nome)
  ) THEN
    nome := left(nome, 49) || '_' || left(replace(NEW.id::TEXT, '-', ''), 8);
  END IF;

  INSERT INTO public.usuarios (auth_uid, nome_de_usuario, tipo_de_perfil)
  VALUES (NEW.id, nome, 'operador')
  ON CONFLICT (auth_uid) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ao_criar_usuario_auth ON auth.users;
CREATE TRIGGER ao_criar_usuario_auth
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.criar_perfil_de_usuario();

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.usuarios TO authenticated;
DROP POLICY IF EXISTS usuarios_consultar_perfil ON public.usuarios;
CREATE POLICY usuarios_consultar_perfil ON public.usuarios
  FOR SELECT TO authenticated USING (TRUE);

-- Todos os usuários autenticados podem listar, cadastrar, editar, bloquear
-- e liberar veículos.
GRANT SELECT, INSERT, UPDATE ON public.veiculos TO authenticated;

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

DROP FUNCTION IF EXISTS public.usuario_atual_e_gerente();

CREATE POLICY veiculos_consultar ON public.veiculos
  FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY veiculos_cadastrar_autenticado ON public.veiculos
  FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY veiculos_atualizar_autenticado ON public.veiculos
  FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

CREATE OR REPLACE FUNCTION public.alterar_situacao_veiculo(
  codigo_veiculo VARCHAR,
  nova_situacao VARCHAR
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

  UPDATE public.veiculos
  SET situacao = nova_situacao
  WHERE codigo = codigo_veiculo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Veículo não encontrado.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.alterar_situacao_veiculo(VARCHAR, VARCHAR)
  TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
