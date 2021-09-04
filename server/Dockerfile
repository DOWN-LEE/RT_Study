FROM node:12.18.4 as builder


RUN apt-get update && apt-get install -y --no-install-recommends apt-utils
RUN apt-get install net-tools build-essential

# 작업 폴더를 만들고 npm 설치
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
RUN npm install --silent

# 소스를 작업폴더로 복사하고 빌드
COPY . /usr/src/app
EXPOSE 3001
CMD [ "npm", "run", "start"]
