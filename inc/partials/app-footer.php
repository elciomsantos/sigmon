<?php

/**
 * Rodape padrao do SIGMON, compartilhado entre o layout autenticado
 * (inc/footer.php) e a tela de login (auth/login.php).
 *
 * Ex.: "SIGMON — Sistema de Gerenciamento de Cameras e Alarmes © 2026 — v1.0.2"
 *
 * Variaveis:
 *   @var string|null $footerVariant 'dark' deixa o texto legivel sobre fundo escuro.
 */

$footerVariant = $footerVariant ?? 'default';
$appVersion = appVersion();
?>
<div class="app-footer text-center">
    <small class="<?= $footerVariant === 'dark' ? 'text-white-50' : 'text-muted' ?>">
        SIGMON &mdash; Sistema de Gerenciamento de Cameras e Alarmes
        &copy; <?= date('Y') ?><?php if ($appVersion !== null): ?>
            &mdash; <span class="app-version" title="Vers&atilde;o implantada"><?= htmlspecialchars($appVersion, ENT_QUOTES, 'UTF-8') ?></span>
        <?php endif; ?>
    </small>
</div>