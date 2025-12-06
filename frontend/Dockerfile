FROM node:20-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install --legacy-peer-deps

# Копируем остальной код
COPY . .

# Устанавливаем переменные окружения для сборки
ARG NEXT_PUBLIC_API_URL=/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Сборка приложения
RUN npm run build

EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"]
