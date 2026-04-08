# CETADMI Events

Portal administrativo e publico para eventos do CETADMI, construido com Vite, React e Supabase.

## Requisitos

- Node.js 18+
- Projeto Supabase configurado

## Configuracao

1. Copie `.env.example` para `.env`
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Execute as migracoes SQL da pasta `supabase/migrations` no Supabase, em ordem

## Importante sobre administradores

- A migracao `20260408_security_and_capacity_hardening.sql` cria `admin_users` e `profiles`
- A liberacao de administradores e controlada pelo pastor/owner; nao existe mais promocao automatica no primeiro login
- Se quiser endurecer esse fluxo no banco, aplique tambem `20260408_admin_access_control.sql`
- Para promover outro administrador, o usuario precisa ter feito login pelo menos uma vez

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Fluxo de deploy recomendado

1. Verificar variaveis de ambiente no Vercel
2. Confirmar que as migracoes do Supabase foram aplicadas
3. Rodar `npm run lint`
4. Rodar `npm run test`
5. Rodar `npm run build`
6. Publicar

## Entrega premium rapida

1. Entre no painel administrativo
2. Edite o evento principal
3. Clique em `Aplicar Exemplo Premium`
4. Ajuste somente o que for necessario:
   - data
   - local
   - WhatsApp
   - chave PIX
   - banner
5. Salve o evento
6. Abra a pagina publica e revise o resultado final

## Checklist final para apresentar

1. O banner aparece no card do dashboard e na pagina publica
2. O evento tem descricao oficial preenchida
3. O evento tem pelo menos 1 palestrante real
4. O evento tem cronograma preenchido
5. O WhatsApp da organizacao esta correto
6. A chave PIX esta correta
7. O evento esta publicado
8. A inscricao publica foi testada com sucesso

## Checklist de subida

1. Confirmar no Supabase que os SQLs mais recentes foram aplicados
2. Confirmar no Supabase Storage que o bucket `event-banners` existe e aceita upload
3. Confirmar no painel que o owner consegue entrar
4. Confirmar no painel que o evento principal esta publicado
5. Confirmar que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estao configuradas na Vercel
6. Rodar localmente:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
7. Fazer o deploy
8. Testar no link publicado:
   - login admin
   - abrir evento publico
   - fazer inscricao
   - ver inscricao no painel

## Observacoes

- O painel administrativo exige que o usuario exista em `admin_users`
- Usuarios publicos podem se inscrever, mas nao acessam o dashboard
- Se o projeto acusar que `admin_users` ou `profiles` nao existem, a migracao nova ainda nao foi aplicada
