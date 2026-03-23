# 🚀 AlphaNexus Dashboard — Guia de Deploy Completo

## Visão geral
Este projeto é um Next.js 14 + Supabase + Vercel.
O banco de dados já está criado e configurado no Supabase.
Você só precisa seguir os passos abaixo para colocar no ar.

---

## PASSO 1 — Pegar as chaves do Supabase

1. Acesse https://supabase.com/dashboard/project/yqvipidbzyyklxxktffd
2. No menu lateral, clique em **Project Settings** (ícone de engrenagem)
3. Clique em **API**
4. Copie os seguintes valores:
   - **Project URL** → `https://yqvipidbzyyklxxktffd.supabase.co`
   - **anon public** → começa com `eyJ...`
   - **service_role secret** → começa com `eyJ...` (NUNCA expor publicamente)

---

## PASSO 2 — Ativar Google OAuth no Supabase

1. No painel do Supabase, vá em **Authentication** → **Providers**
2. Clique em **Google**
3. Ative o toggle
4. Você vai precisar de um **Client ID** e **Client Secret** do Google
5. Para obter:
   - Acesse https://console.cloud.google.com
   - Crie um projeto (ou use um existente)
   - Vá em **APIs & Services** → **Credentials**
   - Clique em **+ Create Credentials** → **OAuth 2.0 Client IDs**
   - Tipo: **Web application**
   - Em **Authorized redirect URIs**, adicione:
     ```
     https://yqvipidbzyyklxxktffd.supabase.co/auth/v1/callback
     ```
   - Copie o **Client ID** e **Client Secret**
6. Cole no Supabase e salve

---

## PASSO 3 — Subir o código no GitHub

1. Crie um repositório no GitHub (pode ser privado)
2. Na pasta do projeto, rode:

```bash
git init
git add .
git commit -m "AlphaNexus Dashboard inicial"
git remote add origin https://github.com/SEU_USER/SEU_REPO.git
git push -u origin main
```

---

## PASSO 4 — Deploy na Vercel

1. Acesse https://vercel.com
2. Clique em **New Project**
3. Importe o repositório que você criou no GitHub
4. Na tela de configuração, clique em **Environment Variables**
5. Adicione as seguintes variáveis:

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yqvipidbzyyklxxktffd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sua anon key do passo 1 |
| `SUPABASE_SERVICE_ROLE_KEY` | sua service_role key do passo 1 |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-PROJETO.vercel.app` (você define o nome) |

6. Clique em **Deploy**
7. Aguarde o build terminar (2-3 minutos)

---

## PASSO 5 — Atualizar URL de redirecionamento

Após o deploy, você terá uma URL tipo: `https://alphanexus.vercel.app`

1. Volte ao Supabase → **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque: `https://alphanexus.vercel.app`
3. Em **Redirect URLs**, adicione:
   ```
   https://alphanexus.vercel.app/auth/callback
   ```
4. Salve

---

## PASSO 6 — Testar o sistema

1. Acesse sua URL da Vercel
2. Clique em **Continuar com Google**
3. Faça login — o perfil será criado automaticamente
4. Vá em **Integrações** e configure Meta Ads e Braip

---

## PASSO 7 — Configurar Meta Ads

Para conectar sua conta de anúncios:

1. No dashboard, vá em **Integrações** → **Meta Ads**
2. Você precisa do:
   - **Token de Acesso Permanente** — gere um System User Token no Meta Business Manager
   - **ID da Conta de Anúncios** — encontrado no Gerenciador de Anúncios (ex: 492500913895242)
3. Cole os dados e clique em **Conectar conta**
4. Clique em **↻ Sync** para buscar os dados imediatamente

### Como gerar um token permanente na Meta:
1. Acesse https://business.facebook.com
2. Vá em **Configurações** → **Usuários** → **Usuários do Sistema**
3. Crie um Usuário do Sistema (Admin)
4. Clique em **Gerar token** → selecione o App → marque `ads_read` e `read_insights`
5. O token gerado **nunca expira**

---

## PASSO 8 — Configurar Webhook Braip

1. No dashboard, vá em **Integrações** → **Braip Webhook**
2. Clique em **Gerar Webhook**
3. Copie o link gerado (ex: `https://alphanexus.vercel.app/api/webhook/braip/abc-123`)
4. Acesse sua conta na **Braip**
5. Vá em **Configurações** → **Postback/Webhook**
6. Cole o link e salve
7. Ative para todos os eventos: `STATUS_ALTERADO`, `TRACKING_*`
8. As vendas começarão a aparecer automaticamente no dashboard

---

## PASSO 9 — Cadastrar Atendentes

1. Vá em **Atendentes** no menu
2. Clique em **+ Nova Atendente**
3. Preencha:
   - **Nome**: Bruna
   - **Chave (src)**: `Bruna` ← deve ser IGUAL ao que está nos links (src=Bruna)
   - **Comissão**: configure o percentual ou valor fixo
4. Salve

O sistema vai automaticamente vincular as vendas com `src=Bruna` a essa atendente.

---

## Estrutura do banco de dados criada

| Tabela | Função |
|--------|--------|
| `profiles` | Dados dos usuários |
| `settings` | Configurações (imposto Meta, timezone) |
| `attendants` | Atendentes e comissões |
| `attendant_entries` | Registros manuais das atendentes |
| `ad_accounts` | Contas Meta Ads |
| `ad_insights` | Dados de performance Meta |
| `webhooks` | Tokens de webhook Braip |
| `transactions` | Vendas recebidas via Braip |
| `transaction_logs` | Log bruto de todos os postbacks |
| `cashflow` | Fluxo de caixa manual |

---

## Variáveis de ambiente (resumo)

```env
NEXT_PUBLIC_SUPABASE_URL=https://yqvipidbzyyklxxktffd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://SEU-PROJETO.vercel.app
```

---

## Métricas calculadas automaticamente

| Métrica | Fórmula |
|---------|---------|
| **ROI Real** | Comissão aprovada ÷ Investimento |
| **ROI Projetado** | (Aprovadas + Agendadas) ÷ Investimento |
| **CAC** | Investimento ÷ Vendas aprovadas |
| **Lucro** | Comissão − Investimento |
| **Taxa de Frustração** | Frustrações reais ÷ Total × 100 |
| **Frustração Real** | Status=Frustrada E entrega≠Entregue |
| **Investimento c/ Imposto** | Spend × 1.1383 (ajustável em Configurações) |

---

## Suporte e próximos passos

- **Score de campanhas**: 🟢 Escalar / 🟡 Testar / 🔴 Pausar (automático)
- **Multi-conta Meta**: adicione quantas contas quiser em Integrações
- **Multi-webhook Braip**: gere um token por produto/campanha
- **Filtros**: filtre por atendente, período, campanha no dashboard
- **Fluxo de caixa**: registre entradas e saídas manuais

---

*AlphaNexus Dashboard v1.0.0 — Construído com Next.js 14 + Supabase + Vercel*
