# Estágio 1: Build do aplicativo React/Vite
FROM node:20-alpine AS build

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências de forma limpa
RUN npm ci

# Copia o restante dos arquivos do projeto
COPY . .

# Compila o app de produção
RUN npm run build

# Estágio 2: Servidor web leve Nginx para produção
FROM nginx:stable-alpine

# Copia os arquivos gerados no build para pasta pública do nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx para suportar rotas SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expõe a porta padrão do Nginx
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
