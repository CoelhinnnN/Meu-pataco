# Livro-Caixa — Controle financeiro

App de controle financeiro pessoal: lançamentos de ganhos e gastos, saldo por
categoria, gráfico mensal e metas de economia. Feito em React + Vite.

Os dados ficam salvos no `localStorage` do próprio navegador (não saem do seu
computador, não vão para nenhum servidor).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço que aparecer no terminal (geralmente `http://localhost:5173`).

## Publicando no GitHub Pages

1. **Ajuste o `vite.config.js`**: troque `base: "/livro-caixa/"` pelo nome
   exato do repositório que você criar no GitHub (com barras no início e no
   fim). Se o repositório se chamar `meu-repo`, use `base: "/meu-repo/"`.

2. **Crie o repositório no GitHub** (pode ser pelo site, em
   https://github.com/new).

3. **Suba o código:**

   ```bash
   git init
   git add .
   git commit -m "Primeiro commit"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   git push -u origin main
   ```

4. **Ative o GitHub Pages:** no repositório, vá em
   `Settings → Pages → Build and deployment → Source` e escolha
   **GitHub Actions**. O workflow em `.github/workflows/deploy.yml` já está
   configurado para publicar automaticamente a cada push na branch `main`.

5. Depois do primeiro push, acompanhe o progresso na aba **Actions** do
   repositório. Quando o workflow terminar (ícone verde), seu site estará em:

   ```
   https://SEU-USUARIO.github.io/SEU-REPOSITORIO/
   ```

## Estrutura

```
├── src/
│   ├── App.jsx       # componente principal do app
│   ├── main.jsx       # ponto de entrada React
│   └── index.css      # estilos globais mínimos
├── index.html
├── vite.config.js
└── .github/workflows/deploy.yml   # publica no GitHub Pages a cada push
```
