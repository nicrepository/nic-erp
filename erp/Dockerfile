# Estágio 1: Build (Maven + Java 21)
# Usamos uma imagem leve do Maven para buildar o projeto
FROM maven:3.9.6-eclipse-temurin-21-jammy AS build
WORKDIR /app

# Copia apenas o pom.xml primeiro para baixar as dependências e usar cache do Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia o código-fonte e faz o build do JAR pulando os testes (ganhar velocidade no deploy)
COPY src ./src
RUN mvn package -DskipTests

# Estágio 2: Runtime (Só JRE 21 leve)
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copia o JAR buildado no estágio anterior
# NOTA: Confirme se o JAR final gerado no target realmente tem esse nome genérico.
# Se tiver versão (ex: erp-1.0.jar), mude aqui ou no pom.xml para 'erp.jar'
COPY --from=build /app/target/erp.jar erp.jar

# Expõe a porta do Spring Boot (8080)
EXPOSE 8080

# Comando para rodar a aplicação
ENTRYPOINT ["java", "-jar", "erp.jar"]