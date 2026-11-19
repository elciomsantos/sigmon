import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Cadastro de alarmes — campo conta com erro', () => {
    let form: HTMLFormElement;
    let input: HTMLInputElement;
    let feedback: HTMLElement;

    beforeEach(async () => {
        document.head.innerHTML = '<meta name="csrf-token" content="token-teste">';
        document.body.className = 'page-cadastro_alarmes';
        document.body.innerHTML = `
            <form id="formCadastroAlarme">
                <input type="number" name="conta" id="alarmeConta" min="1" required>
                <div class="invalid-feedback" id="alarmeContaFeedback">Informe a conta.</div>
                <input type="text" name="local" id="nome_local" required value="Central Norte">
                <button id="btnSubmit" type="submit"></button>
            </form>
        `;

        window.showToast = vi.fn();
        window.showSuccessModal = vi.fn();
        (window as any).handleApiError = vi.fn();
        (window as any).APP_API_BASE = '/api/';
        (window as any).fetchWithTimeout = vi.fn();

        vi.resetModules();
        await import('../../src/assets/js/cadastro_alarmes');

        form = document.getElementById('formCadastroAlarme') as HTMLFormElement;
        input = document.getElementById('alarmeConta') as HTMLInputElement;
        feedback = document.getElementById('alarmeContaFeedback') as HTMLElement;
    });

    it('marca o campo em vermelho quando a API informa conta duplicada', async () => {
        (window.fetchWithTimeout as any).mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({ success: false, message: 'Ja existe um alarme cadastrado com a conta 12345.' })
        });
        input.value = '12345';

        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(input.classList.contains('is-invalid')).toBe(true);
        });
        expect(feedback.textContent).toBe('Ja existe um alarme cadastrado com a conta 12345.');
        expect(input.getAttribute('aria-invalid')).toBe('true');
        expect(window.handleApiError).toHaveBeenCalled();
    });

    it('remove o realce ao digitar uma nova conta', async () => {
        (window.fetchWithTimeout as any).mockResolvedValueOnce({
            ok: false,
            status: 422,
            json: async () => ({ success: false, message: 'Ja existe um alarme cadastrado com a conta 12345.' })
        });
        input.value = '12345';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

        await vi.waitFor(() => {
            expect(input.classList.contains('is-invalid')).toBe(true);
        });

        input.value = '54321';
        input.dispatchEvent(new Event('input', { bubbles: true }));

        expect(input.classList.contains('is-invalid')).toBe(false);
        expect(input.classList.contains('is-valid')).toBe(true);
    });
});
