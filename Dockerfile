# Étape 1 : choisir l'image officielle Node
FROM node:20-alpine

# Étape 2 : définir le répertoire de travail
WORKDIR /app

# Étape 3 : copier package.json et package-lock.json
COPY package*.json ./

# Étape 4 : installer les dépendances
RUN npm install

# Étape 5 : copier le reste du code
COPY . .

# Étape 6 : exposer le port sur lequel l'app écoute
ENV PORT=8080
EXPOSE 8080

# Étape 7 : démarrer l'application
CMD ["node", "server.js"]
