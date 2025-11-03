# Usar una imagen base ligera de Node.js
FROM node:20-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de definición de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias de producción de forma consistente
# --omit=dev excluye las dependencias de desarrollo, haciendo la imagen más pequeña
RUN npm ci --omit=dev

# Copiar el código fuente y el archivo de configuración personalizado
# Tu código principal reside en 'src' y 'server.js' en la raíz.
COPY src ./src
COPY server.js .

# Copiar el archivo de configuración de entorno, si existe. 
# NOTA: Las variables sensibles (como CONNECTION_STRING de MongoDB) 
# deben inyectarse en Azure App Service, NO en el Dockerfile.
COPY .env.production ./.env 

# Establecer el puerto de la aplicación
ENV PORT=8080

# Exponer el puerto
EXPOSE 8080

# Comando para iniciar la aplicación (utiliza el script 'start' de package.json, que es 'cds-serve')
CMD [ "npm", "start" ]