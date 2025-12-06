FROM nginx:alpine

# Копируем конфигурацию nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

