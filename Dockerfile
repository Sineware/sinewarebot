FROM ubuntu:focal
WORKDIR /usr/src/app

ENV DEBIAN_FRONTEND="noninteractive" TZ="America/Toronto"

# Install dependancies first.
RUN apt-get update -y \
    && apt-get install nodejs npm git ffmpeg graphicsmagick fortune cowsay python3-pip fonts-noto-color-emoji  youtube-dl python -y

ENV PATH="/usr/games:${PATH}"

RUN pip3 install chatterbot
RUN pip3 install chatterbot_corpus
RUN pip3 install emoji

COPY package*.json ./
RUN npm ci

COPY . .
USER root

RUN ln -s /usr/bin/python3 /usr/bin/python

CMD [ "node", "src/index.js" ]

