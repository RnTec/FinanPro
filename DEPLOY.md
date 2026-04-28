# Guia de Deploy — FinanPro 🚀

O FinanPro está pronto para produção! Siga os passos abaixo para colocar seu aplicativo no ar.

## 1. Banco de Dados (PostgreSQL)

O projeto agora usa **PostgreSQL**. Recomendamos usar o [Supabase](https://supabase.com) ou [Neon](https://neon.tech).

1. Crie um novo projeto no Supabase/Neon.
2. Copie a **Connection String** (Transaction Mode).
3. No seu arquivo `.env`, atualize a `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname?pgbouncer=true"
   ```

## 2. Variáveis de Ambiente Necessárias

Para o deploy na **Vercel**, configure as seguintes variáveis:

| Variável | Descrição |
| :--- | :--- |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `NEXTAUTH_SECRET` | Uma string aleatória segura (ex: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | A URL do seu app (ex: `https://finanpro.vercel.app`) |
| `OPENAI_API_KEY` | Sua chave da OpenAI para Insights e Voz |

## 3. Comandos de Build

Na Vercel, o comando de build padrão (`npm run build`) funcionará, mas certifique-se de que o Prisma gere o cliente antes:

**Build Command:** `npx prisma generate && next build`

## 4. PWA (Aplicativo Instalável)

O suporte a PWA já está configurado. Assim que o app estiver rodando em **HTTPS** (na Vercel), os usuários verão a opção de "Instalar Aplicativo" no navegador.

---

### Dica de Ouro: Onboarding
O sistema de **Tour Guiado** já está ativo. Todo novo usuário que se cadastrar verá o tour automaticamente na primeira vez que acessar o Dashboard.
