FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

FROM eclipse-temurin:21-jre
WORKDIR /app

# Uygulama root yerine yetkisiz bir kullanıcıyla çalışır.
# uploads klasörü burada oluşturulduğu için yeni volume'lar bu kullanıcıya ait başlar.
RUN groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --no-create-home app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app

COPY --from=build --chown=app:app /app/target/*.jar app.jar

USER app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
