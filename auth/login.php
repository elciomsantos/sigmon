<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$erro = $_SESSION['error'] ?? null;
unset($_SESSION['error']);

?>

<style nonce="<?= htmlspecialchars($CSP_NONCE ?? '', ENT_QUOTES, 'UTF-8') ?>">
.page-login {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    height: 100vh;
    overflow: hidden;
    padding: 20mm 24px 8mm;
    background-color: #f8f9fa;
}

.page-login .login-wrapper {
    width: min(860px, 100%);
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 24px;
}

.page-login footer.footer {
    flex: 0 0 auto;
    align-self: stretch;
    margin-top: 45mm;
    border-top: none;
}

.page-login .login-card {
    width: min(420px, 100%);
    margin: 0 auto;
    background: rgba(233, 236, 239, 0.95);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: 16px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.10);
    color: #132238;
    padding: 32px 28px;
}

.page-login .login-logo {
    display: block;
    width: 55px;
    max-width: 85%;
    height: auto;
    margin: 0 auto 20px;
}

.page-login .login-banner {
    display: block;
    width: 100%;
    max-width: 860px;
    min-height: 0;
    height: auto;
    object-fit: contain;
    margin: 0 auto;
}

.page-login .login-input {
    background: rgba(255, 255, 255, 0.92);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.page-login .login-btn {
    background-color: #1f3c60;
    border: none;
    font-weight: 500;
    color: #fff;
}

.page-login .login-btn:hover {
    background-color: #152a45;
}

@media (max-height: 800px) {
    .page-login {
        padding: 10mm 24px 8mm;
    }

    .page-login footer.footer {
        margin-top: 25mm;
    }

    .page-login .login-banner {
        max-height: 20vh;
    }
}
</style>

<div class="login-wrapper">
    <div class="login-card">
        <img src="<?= htmlspecialchars(BASE_URL, ENT_QUOTES, 'UTF-8') ?>/images/tela_fundo.png"
             alt="SIGMON" class="login-logo">
        <hr>
        <form action="?page=action_login_submit" method="post">
            <input type="hidden" name="csrf_token" value="<?= htmlspecialchars(getCsrfToken(), ENT_QUOTES, 'UTF-8') ?>">
            <div class="mb-3">
                <label for="text_usuario">Usuario</label>
                <input type="text" id="text_usuario" name="text_usuario" class="form-control login-input" required>
            </div>
            <div class="mb-3">
                <label for="text_senha">Senha</label>
                <input type="password" id="text_senha" name="text_senha" class="form-control login-input" required>
            </div>
            <div class="d-grid gap-2">
                <input type="submit" name="submit" value="Entrar" class="btn login-btn w-100">
            </div>
        </form>
        <?php if (!empty($erro)) : ?>
        <div class="alert alert-danger mt-3 p-2 text-center">
            <?= htmlspecialchars($erro, ENT_QUOTES, 'UTF-8') ?>
        </div>
        <?php endif; ?>
        <div class="text-center mt-2">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>Esqueceu a senha? Contacte o administrador.
            </small>
        </div>
    </div>
    <img src="<?= htmlspecialchars(BASE_URL, ENT_QUOTES, 'UTF-8') ?>/images/Logo_banner_sigmon.png"
         alt="SIGMON — Sistema Integrado de Gestão e Monitoramento" class="login-banner">
</div>
