import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import '../../src/assets/js/utils/showErrorModal';

describe('showErrorModal', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        delete (window as { bootstrap?: unknown }).bootstrap;
        delete (window as { showToast?: unknown }).showToast;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('exibe um popup visivel mesmo sem Bootstrap JS', () => {
        window.showErrorModal('Conta de alarme inexistente', 'Verifique o número informado.');

        const dialog = document.getElementById('modalErroSistemaFallback');
        expect(dialog).not.toBeNull();
        expect(dialog?.getAttribute('role')).toBe('alertdialog');
        expect(dialog?.textContent).toContain('Conta de alarme inexistente');
        expect(dialog?.textContent).toContain('Verifique o número informado.');
    });

    it('usa toast quando o Bootstrap nao esta disponivel mas o toast esta', () => {
        const toast = vi.fn();
        window.showToast = toast;

        window.showErrorModal('Erro', 'Conta de alarme inexistente.');

        expect(toast).toHaveBeenCalledWith('Conta de alarme inexistente.', 'danger');
        expect(document.getElementById('modalErroSistemaFallback')).toBeNull();
    });

    it('atualiza o texto de um modal ja existente', () => {
        window.showErrorModal('Primeiro erro', 'Primeira mensagem');
        const title = document.getElementById('erroModalTitle');
        const message = document.getElementById('erroModalMessage');

        expect(title?.textContent).toBe('Primeiro erro');
        expect(message?.textContent).toBe('Primeira mensagem');
    });
});
