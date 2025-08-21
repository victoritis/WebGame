# syntax=docker/dockerfile:1
############################################
# STAGE 1: BUILD (Vite + TypeScript)
############################################
FROM node:20-alpine AS build
WORKDIR /app

# Copiamos manifiestos primero para cachear deps
COPY package.json package-lock.json* ./
# Cache de npm para builds más rápidos
RUN --mount=type=cache,target=/root/.npm npm ci

# Copiamos el resto del código
COPY . .

# Build de producción (salida en /app/dist)
RUN npm run build

############################################
# STAGE 2: RUNTIME (Nginx sirviendo estáticos)
############################################
FROM nginx:1.27-alpine AS prod
# Config custom de Nginx (SPA + gzip)
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
# Copiamos el build estático
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
