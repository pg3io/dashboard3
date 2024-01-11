FROM node:16 as build-stage

ENV VUE_APP_API_URL='http://<STRAPI_URL>/graphql'
WORKDIR /app

COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

#EXPOSE 8080
#CMD [ "npm", "run", "serve" ]

# PATCH WIP for regenerator-runtime
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
