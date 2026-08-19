# Multi-stage build for Mesh Connect.
#
# The build context is the REPOSITORY ROOT, not this directory, because the React client
# in ../webapp is compiled into the jar. Build from the repo root:
#
#   docker build -f server/Dockerfile -t mesh-connect .
#   docker run -p 8080:8080 mesh-connect
#
# That runs the default `dev` profile (embedded H2, seeded data). For PostgreSQL, pass
# SPRING_PROFILES_ACTIVE=prod along with DB_USER, DB_PASSWORD and JWT_SECRET.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace

# The Maven Wrapper first, so dependency resolution caches independently of source changes.
COPY server/.mvn ./server/.mvn
COPY server/mvnw server/mvnw.cmd server/pom.xml ./server/
RUN chmod +x ./server/mvnw && cd server && ./mvnw -B -q dependency:go-offline -P '!with-frontend'

COPY server/src ./server/src
COPY webapp ./webapp
RUN cd server && ./mvnw -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

# Run unprivileged: nothing in this application needs root.
RUN useradd --system --create-home --shell /usr/sbin/nologin mesh
USER mesh

COPY --from=build /workspace/server/target/mesh-connect-api-1.0.0.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
