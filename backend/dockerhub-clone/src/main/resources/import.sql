-- ========== ROLES ==========
INSERT INTO roles (id, name) VALUES (1, 'ROLE_USER');
INSERT INTO roles (id, name) VALUES (2, 'ROLE_ADMIN');
INSERT INTO roles (id, name) VALUES (3, 'ROLE_SUPER_ADMIN');

-- ========== USERS ==========
INSERT INTO users (username, email, password_hash, bio, avatar_url, active, created_at, updated_at) VALUES ('alice', 'alice@example.com', '$2a$10$alicehashalicehashaliceha', 'Platform engineer and maintainer of open source tooling.', 'https://avatars.example.com/u/alice.png', TRUE, DATEADD('DAY', -180, CURRENT_TIMESTAMP), DATEADD('DAY', -2, CURRENT_TIMESTAMP));
INSERT INTO users (username, email, password_hash, bio, avatar_url, active, created_at, updated_at) VALUES ('bob', 'bob@example.com', '$2a$10$bobhashbobhashbobhashbobha', 'Site reliability engineer focused on observability stacks.', 'https://avatars.example.com/u/bob.png', TRUE, DATEADD('DAY', -150, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP));
INSERT INTO users (username, email, password_hash, bio, avatar_url, active, created_at, updated_at) VALUES ('carol', 'carol@example.com', '$2a$10$carolhashcarolhashcarolhash', 'Data scientist experimenting with ML deployments.', 'https://avatars.example.com/u/carol.png', TRUE, DATEADD('DAY', -90, CURRENT_TIMESTAMP), DATEADD('DAY', -3, CURRENT_TIMESTAMP));
INSERT INTO users (username, email, password_hash, bio, avatar_url, active, created_at, updated_at) VALUES ('dave', 'dave@example.com', '$2a$10$davehashdavehashdavehashdav', 'Edge computing enthusiast hacking on IoT projects.', 'https://avatars.example.com/u/dave.png', TRUE, DATEADD('DAY', -60, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP));

-- ========== USER ROLES ==========
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (2, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);
INSERT INTO user_roles (user_id, role_id) VALUES (3, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (4, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2);

-- ========== REPOSITORIES ==========
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('k8s-toolkit', 'Helm charts and utilities for Kubernetes platform teams.', TRUE, FALSE, TRUE, TRUE, 2450, 985000, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -180, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP), 1);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('ml-serving-stack', 'Opinionated stack for serving ML models at scale.', TRUE, FALSE, TRUE, FALSE, 1820, 754000, DATEADD('DAY', -2, CURRENT_TIMESTAMP), DATEADD('DAY', -170, CURRENT_TIMESTAMP), DATEADD('DAY', -2, CURRENT_TIMESTAMP), 1);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('observability-suite', 'Dashboards and exporters for full observability.', TRUE, TRUE, TRUE, TRUE, 3650, 1430000, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -160, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP), 2);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('edge-gateway', 'Secure edge gateway for remote devices.', FALSE, FALSE, FALSE, FALSE, 240, 18500, DATEADD('DAY', -7, CURRENT_TIMESTAMP), DATEADD('DAY', -140, CURRENT_TIMESTAMP), DATEADD('DAY', -7, CURRENT_TIMESTAMP), 2);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('ci-runner', 'Self-hosted CI runner images with caching optimizations.', TRUE, FALSE, FALSE, TRUE, 960, 410000, DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -120, CURRENT_TIMESTAMP), DATEADD('DAY', -3, CURRENT_TIMESTAMP), 3);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('iot-data-pipeline', 'Stream processing for IoT telemetry ingestion.', TRUE, FALSE, TRUE, FALSE, 540, 210000, DATEADD('DAY', -5, CURRENT_TIMESTAMP), DATEADD('DAY', -110, CURRENT_TIMESTAMP), DATEADD('DAY', -4, CURRENT_TIMESTAMP), 4);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('cloud-lb-controller', 'Lightweight cloud-native load balancer controller.', TRUE, TRUE, TRUE, TRUE, 1520, 620000, DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -100, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP), 2);
INSERT INTO repositories (name, description, is_public, is_official, is_verified_publisher, is_sponsored_oss, stars_count, pulls_count, last_pushed_at, created_at, updated_at, owner_id) VALUES ('wasm-sandbox', 'WASM sandbox base images for polyglot workloads.', TRUE, FALSE, FALSE, FALSE, 310, 98000, DATEADD('DAY', -6, CURRENT_TIMESTAMP), DATEADD('DAY', -95, CURRENT_TIMESTAMP), DATEADD('DAY', -5, CURRENT_TIMESTAMP), 4);

-- ========== ARTIFACTS ==========
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:111aaa', 134217728, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -2, CURRENT_TIMESTAMP), 1);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:111aab', 167772160, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -30, CURRENT_TIMESTAMP), 1);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:222aaa', 209715200, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -3, CURRENT_TIMESTAMP), 2);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:333aaa', 262144000, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -1, CURRENT_TIMESTAMP), 3);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:333aab', 131072000, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -45, CURRENT_TIMESTAMP), 3);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:444aaa', 157286400, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -10, CURRENT_TIMESTAMP), 4);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:555aaa', 104857600, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -4, CURRENT_TIMESTAMP), 5);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:666aaa', 188743680, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -5, CURRENT_TIMESTAMP), 6);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:777aaa', 120586240, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -2, CURRENT_TIMESTAMP), 7);
INSERT INTO artifacts (digest, size, media_type, created_at, repository_id) VALUES ('sha256:888aaa', 100663296, 'application/vnd.docker.distribution.manifest.v2+json', DATEADD('DAY', -8, CURRENT_TIMESTAMP), 8);

-- ========== TAGS ==========
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v1.8.0', DATEADD('DAY', -2, CURRENT_TIMESTAMP), DATEADD('DAY', -2, CURRENT_TIMESTAMP), 1, 1);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v1.7.2', DATEADD('DAY', -30, CURRENT_TIMESTAMP), DATEADD('DAY', -30, CURRENT_TIMESTAMP), 1, 2);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v0.5.0', DATEADD('DAY', -3, CURRENT_TIMESTAMP), DATEADD('DAY', -3, CURRENT_TIMESTAMP), 2, 3);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v3.1.0', DATEADD('DAY', -1, CURRENT_TIMESTAMP), DATEADD('DAY', -1, CURRENT_TIMESTAMP), 3, 4);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v3.0.4', DATEADD('DAY', -45, CURRENT_TIMESTAMP), DATEADD('DAY', -45, CURRENT_TIMESTAMP), 3, 5);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('edge-preview', DATEADD('DAY', -10, CURRENT_TIMESTAMP), DATEADD('DAY', -7, CURRENT_TIMESTAMP), 4, 6);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v2.3.1', DATEADD('DAY', -4, CURRENT_TIMESTAMP), DATEADD('DAY', -4, CURRENT_TIMESTAMP), 5, 7);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v1.1.0', DATEADD('DAY', -5, CURRENT_TIMESTAMP), DATEADD('DAY', -5, CURRENT_TIMESTAMP), 6, 8);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v0.9.0', DATEADD('DAY', -2, CURRENT_TIMESTAMP), DATEADD('DAY', -2, CURRENT_TIMESTAMP), 7, 9);
INSERT INTO tags (name, created_at, updated_at, repository_id, artifact_id) VALUES ('v0.3.2', DATEADD('DAY', -8, CURRENT_TIMESTAMP), DATEADD('DAY', -8, CURRENT_TIMESTAMP), 8, 10);

-- ========== STARS ==========
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -1, CURRENT_TIMESTAMP), 2, 1);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -10, CURRENT_TIMESTAMP), 3, 1);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -5, CURRENT_TIMESTAMP), 1, 3);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -8, CURRENT_TIMESTAMP), 3, 3);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -6, CURRENT_TIMESTAMP), 4, 5);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -4, CURRENT_TIMESTAMP), 1, 6);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -3, CURRENT_TIMESTAMP), 2, 7);
INSERT INTO stars (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -7, CURRENT_TIMESTAMP), 4, 2);

-- ========== WATCHES ==========
INSERT INTO watches (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -2, CURRENT_TIMESTAMP), 1, 3);
INSERT INTO watches (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -5, CURRENT_TIMESTAMP), 2, 1);
INSERT INTO watches (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -4, CURRENT_TIMESTAMP), 2, 5);
INSERT INTO watches (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -6, CURRENT_TIMESTAMP), 3, 7);
INSERT INTO watches (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -3, CURRENT_TIMESTAMP), 4, 1);
INSERT INTO watches (created_at, user_id, repository_id) VALUES (DATEADD('DAY', -1, CURRENT_TIMESTAMP), 4, 6);

-- ========== COLLABORATORS ==========
INSERT INTO collaborators (repository_id, user_id, permission) VALUES (1, 2, 'WRITE');
INSERT INTO collaborators (repository_id, user_id, permission) VALUES (1, 3, 'READ');
INSERT INTO collaborators (repository_id, user_id, permission) VALUES (3, 1, 'ADMIN');
INSERT INTO collaborators (repository_id, user_id, permission) VALUES (4, 1, 'ADMIN');
INSERT INTO collaborators (repository_id, user_id, permission) VALUES (5, 2, 'WRITE');
INSERT INTO collaborators (repository_id, user_id, permission) VALUES (6, 3, 'WRITE');

-- ========== REPO EVENTS ==========
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PUSH', '10.0.0.12', DATEADD('HOUR', -26, CURRENT_TIMESTAMP), 1, 1, 1);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PULL', '10.0.1.33', DATEADD('HOUR', -18, CURRENT_TIMESTAMP), 1, 1, 2);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PUSH', '10.0.0.45', DATEADD('HOUR', -12, CURRENT_TIMESTAMP), 2, 3, 1);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PULL', '10.0.3.14', DATEADD('HOUR', -6, CURRENT_TIMESTAMP), 2, 3, 4);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PUSH', '10.0.4.20', DATEADD('HOUR', -3, CURRENT_TIMESTAMP), 3, 4, 2);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PULL', '10.0.5.99', DATEADD('HOUR', -2, CURRENT_TIMESTAMP), 3, 4, 3);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PUSH', '10.0.6.88', DATEADD('DAY', -1, CURRENT_TIMESTAMP), 5, 7, 3);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PULL', '10.0.7.77', DATEADD('HOUR', -8, CURRENT_TIMESTAMP), 6, 8, 4);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PULL', '10.0.8.66', DATEADD('HOUR', -5, CURRENT_TIMESTAMP), 7, 9, 2);
INSERT INTO repo_events (type, client_ip, occurred_at, repository_id, tag_id, user_id) VALUES ('PULL', '10.0.9.55', DATEADD('HOUR', -4, CURRENT_TIMESTAMP), 8, 10, NULL);

-- ========== AUDIT LOGS ==========
INSERT INTO audit_logs (action, target_type, target_id, metadata, created_at, actor_user_id) VALUES ('REPO_CREATE', 'REPOSITORY', '1', '{"via":"api"}', DATEADD('DAY', -180, CURRENT_TIMESTAMP), 1);
INSERT INTO audit_logs (action, target_type, target_id, metadata, created_at, actor_user_id) VALUES ('REPO_CREATE', 'REPOSITORY', '3', '{"via":"web"}', DATEADD('DAY', -160, CURRENT_TIMESTAMP), 2);
INSERT INTO audit_logs (action, target_type, target_id, metadata, created_at, actor_user_id) VALUES ('COLLABORATOR_ADD', 'REPOSITORY', '1', '{"user":"bob","permission":"WRITE"}', DATEADD('DAY', -30, CURRENT_TIMESTAMP), 1);
INSERT INTO audit_logs (action, target_type, target_id, metadata, created_at, actor_user_id) VALUES ('TOKEN_CREATE', 'USER', '1', '{"scopes":"repo:read,repo:write"}', DATEADD('DAY', -30, CURRENT_TIMESTAMP), 1);
