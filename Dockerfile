# Imagen del frontend Angular servida con Nginx.
#   docker build -t siult/frontend .
#
# Etapa 1: compilo la aplicacion con Node (modo produccion: minificada y con hash en los nombres)
FROM node:22-alpine AS compilacion
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npx ng build --configuration production

# Etapa 2: solo los archivos estaticos sobre Nginx (la imagen final no lleva Node ni node_modules)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist/frontend-angular/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1
