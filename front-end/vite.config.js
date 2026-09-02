import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANTE: troque "livro-caixa" pelo nome exato do seu repositório
// no GitHub, para o site funcionar corretamente no GitHub Pages.
// Ex: se o repo for "meu-controle-financeiro", use base: "/meu-controle-financeiro/"
export default defineConfig({
  plugins: [react()],
  base: "livro-caixa",
});
