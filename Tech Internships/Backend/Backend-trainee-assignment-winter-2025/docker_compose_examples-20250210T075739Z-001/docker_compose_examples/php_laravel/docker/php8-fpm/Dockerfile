FROM alpine:3.14

RUN apk add --update --no-cache \
    coreutils \
    php8 \
    php8-fpm \
    php8-pecl-apcu \
    php8-ctype \
    php8-curl \
    php8-dom \
    php8-gd \
    php8-iconv \
    php8-pecl-imagick \
    php8-json \
    php8-intl \
    php8-pecl-mcrypt \
    php8-fileinfo\
    php8-mbstring \
    php8-opcache \
    php8-openssl \
    php8-pdo \
    libpq \
    php8-pdo_pgsql \
    php8-mysqli \
    php8-xml \
    php8-zlib \
    php8-phar \
    php8-tokenizer \
    php8-session \
    php8-simplexml \
    php8-xdebug \
    php8-zip \
    php8-xmlwriter \
    php8-pecl-redis\
    make \
    curl \
    shadow

# create php symlink
RUN mv /usr/bin/php8 /usr/bin/php

# supervisor
#RUN apk add --update supervisor && rm  -rf /tmp/* /var/cache/apk/*

RUN echo "$(curl -sS https://composer.github.io/installer.sig) -" > composer-setup.php.sig \
        && curl -sS https://getcomposer.org/installer | tee composer-setup.php | sha384sum -c composer-setup.php.sig \
        && php composer-setup.php && rm composer-setup.php* \
        && chmod +x composer.phar && mv composer.phar /usr/bin/composer

RUN adduser -u 1000 -G www-data -s /bin/sh -D www-data
RUN groupmod -g 1000 www-data

COPY php.ini /etc/php8/conf.d/
COPY php.ini /etc/php8/cli/conf.d/
COPY xdebug.ini  /etc/php8/conf.d/

COPY www.conf /etc/php8/php-fpm.d/

RUN mkdir -p /var/www
RUN chown -R www-data:www-data /var/www

CMD ["php-fpm8", "-F"]

#COPY supervisord.conf /etc/
#CMD ["supervisord", "-c", "/etc/supervisord.conf"]

WORKDIR /var/www/laravel
EXPOSE 9001