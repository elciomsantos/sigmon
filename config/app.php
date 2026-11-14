<?php

function appEnv(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    // Compat: SIGMON_X aceita fallback para o legado CAMERAS_X.
    if (str_starts_with($key, 'SIGMON_')) {
        $legacyValue = getenv('CAMERAS_' . substr($key, 7));
        if ($legacyValue !== false && $legacyValue !== '') {
            return $legacyValue;
        }
    }

    return $default;
}

if (!defined('SESSION_TIMEOUT')) {
    define('SESSION_TIMEOUT', (int) appEnv('SIGMON_SESSION_TIMEOUT', '3600'));
}
if (!defined('SESSION_ABSOLUTE_TIMEOUT')) {
    define('SESSION_ABSOLUTE_TIMEOUT', (int) appEnv('SIGMON_SESSION_ABSOLUTE_TIMEOUT', '28800'));
}
if (!defined('ENVIRONMENT')) {
    define('ENVIRONMENT', appEnv('SIGMON_ENV', 'development'));
}

function isHttpsRequest(): bool
{
    $force = appEnv('SIGMON_FORCE_HTTPS_SESSION');
    if ($force !== null) {
        return (bool)(int)$force;
    }

    if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
        return true;
    }
    if (!empty($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443) {
        return true;
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string) $_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https') {
        if (defined('PROXY_TRUSTED_IPS') && PROXY_TRUSTED_IPS !== '') {
            $trustedProxies = array_map('trim', explode(',', PROXY_TRUSTED_IPS));
            if (in_array($_SERVER['REMOTE_ADDR'] ?? '', $trustedProxies, true)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Versao implantada, quando conhecida.
 *
 * Ordem de resolucao (a mais confiavel primeiro):
 *   1. arquivo VERSION na raiz do projeto — em producao, o arquivo
 *      DEPLOYED_VERSION do servidor e montado nesse caminho pelo
 *      docker-compose.prod.yml, entao reflete o que foi realmente implantado
 *      (funciona mesmo com imagens antigas, sem rebuild);
 *   2. variavel de ambiente APP_VERSION — tag semver injetada no build da
 *      imagem (ARG do docker/Dockerfile.nginx), usado como fallback.
 *
 * Retorna null quando a versao nao esta disponivel: a interface simplesmente
 * omite o numero em vez de exibir um valor inventado. O placeholder "dev"
 * (default do ARG) tambem nao e exibido.
 */
function appVersion(): ?string
{
    // Cache leve: evita reler o arquivo a cada chamada dentro da mesma
    // requisicao, sem impedir que o valor seja recalculado (usado em testes).
    static $cachedInput = null;
    static $cachedResult = null;

    $candidates = [];

    $versionFile = dirname(__DIR__) . '/VERSION';
    if (is_file($versionFile)) {
        $fromFile = trim((string) @file_get_contents($versionFile));
        if ($fromFile !== '') {
            $candidates[] = $fromFile;
        }
    }

    $fromEnv = appEnv('APP_VERSION');
    if (is_string($fromEnv) && trim($fromEnv) !== '') {
        $candidates[] = trim($fromEnv);
    }

    $input = implode("\n", $candidates);
    if ($input === $cachedInput) {
        return $cachedResult;
    }

    $result = null;
    foreach ($candidates as $candidate) {
        $version = preg_replace('/[^A-Za-z0-9._+-]/', '', $candidate);
        if (is_string($version) && $version !== '' && $version !== 'dev') {
            $result = $version;
            break;
        }
    }

    $cachedInput = $input;

    return $cachedResult = $result;
}

function configureSessionSecurity(): void
{
    if (session_status() !== PHP_SESSION_NONE) {
        logWarning('configureSessionSecurity ignorada: sessão já iniciada antes das configurações de segurança.');
        return;
    }

    ini_set('session.use_cookies', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.cookie_samesite', 'Strict');

    $secureCookie = isHttpsRequest();
    ini_set('session.cookie_secure', $secureCookie ? '1' : '0');

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secureCookie,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

