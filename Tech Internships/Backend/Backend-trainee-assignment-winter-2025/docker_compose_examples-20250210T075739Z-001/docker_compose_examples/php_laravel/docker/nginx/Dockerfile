FROM alpine:3.14

RUN apk add --update --no-cache nginx

COPY nginx.conf /etc/nginx/
COPY laravel.conf /etc/nginx/conf.d/

RUN echo "upstream php-upstream { server app:9001; }" > /etc/nginx/conf.d/upstream.conf

RUN adduser -D -g '' -G www-data www-data

CMD ["nginx"]

EXPOSE 80
EXPOSE 443