<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

/**
 * Testes do helper appVersion() — versao exibida no rodape do sistema.
 */
final class AppVersionTest extends TestCase
{
    protected function tearDown(): void
    {
        putenv('APP_VERSION');
    }

    public function testReturnsNullWhenVersionIsUnknown(): void
    {
        putenv('APP_VERSION');

        // O cache interno so recalcula quando a origem muda; sem variavel de
        // ambiente e sem arquivo VERSION na raiz o resultado e null.
        $this->assertNull(appVersion());
    }

    public function testReturnsEnvValue(): void
    {
        putenv('APP_VERSION=v1.2.3');

        $this->assertSame('v1.2.3', appVersion());
    }

    public function testIgnoresBuildPlaceholderDev(): void
    {
        putenv('APP_VERSION=dev');

        $this->assertNull(appVersion());
    }

    public function testSanitizesValue(): void
    {
        putenv('APP_VERSION=v1.0.2 <script>alert(1)</script>');

        $this->assertSame('v1.0.2scriptalert1script', appVersion());
    }
}