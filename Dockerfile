# Docker Image for BuildKite CI
# -----------------------------

FROM node:10.20

RUN yarn global add yarn@1.21.1

WORKDIR /xviz
ENV PATH /xviz/node_modules/.bin:$PATH

ENV DISPLAY :99

RUN apt-get update

# required by lint script
RUN apt-get -y install jq

# https://github.com/buildkite/docker-puppeteer/blob/master/Dockerfile
RUN  apt-get update \
  # Install latest chrome dev package, which installs the necessary libs to
  # make the bundled version of Chromium that Puppeteer installs work.
  && apt-get install -y wget --no-install-recommends \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-unstable --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && wget --quiet https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -O /usr/sbin/wait-for-it.sh \
  && chmod +x /usr/sbin/wait-for-it.sh

COPY . /xviz/

RUN yarn bootstrap
