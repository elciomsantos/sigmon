import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CadastroCamera } from '../../src/assets/js/cadastro_cameras';

describe('Cadastro de câmeras — conta de alarme inválida', () => {
    let camera: any;
    let input: HTMLInputElement;
    let feedback: HTMLElement;

    beforeEach(() => {
        document.body.innerHTML = `
            <form id="formCadastroCamera">
                <select id="marcaSelect"></select>
                <input type="checkbox" id="toggleModeloExistente">
                <div id="loadingOverlay"></div>
                <button id="btnSubmit" type="button"></button>
                <input type="checkbox" id="temAlarme" checked>
                <div id="containerAlarmeConta">
                    <input type="text" id="alarmeConta" name="alarme_conta">
                    <div class="invalid-feedback" id="alarmeContaFeedback"></div>
                </div>
            </form>
        `;

        window.showErrorModal = vi.fn();
        input = document.getElementById('alarmeConta') as HTMLInputElement;
        feedback = document.getElementById('alarmeContaFeedback') as HTMLElement;
        camera = new CadastroCamera();
    });

    it('marca o campo em vermelho e preenche o feedback quando a conta não é numérica', () => {
        input.value = 'ABC123';

        expect(camera.validateAlarmeContaField()).toBe(false);
        expect(input.classList.contains('is-invalid')).toBe(true);
        expect(feedback.textContent).toBe('Conta de alarme inexistente. Informe apenas números.');
        expect(window.showErrorModal).toHaveBeenCalledWith(
            'Conta de alarme inexistente',
            'Conta de alarme inexistente. Informe apenas números.'
        );
    });

    it('marca o campo em vermelho quando a conta está vazia', () => {
        input.value = '';

        expect(camera.validateAlarmeContaField()).toBe(false);
        expect(input.classList.contains('is-invalid')).toBe(true);
        expect(feedback.textContent).toBe('Informe a conta do alarme.');
    });

    it('remove o destaque de erro quando a conta é corrigida', () => {
        input.value = 'ABC';
        camera.validateAlarmeContaField();
        expect(input.classList.contains('is-invalid')).toBe(true);

        input.value = '12345';

        expect(camera.validateAlarmeContaField()).toBe(true);
        expect(input.classList.contains('is-invalid')).toBe(false);
        expect(input.classList.contains('is-valid')).toBe(true);
    });

    it('marca o campo em vermelho quando a API recusa a conta', async () => {
        document.head.innerHTML = '<meta name="csrf-token" content="token-teste">';
        (window as any).APP_API_BASE = '/api/';
        (window as any).fetchWithTimeout = vi.fn().mockResolvedValue({
            ok: false,
            status: 422,
            json: async () => ({
                success: false,
                message: 'Conta de alarme inexistente. Verifique o número informado.'
            })
        });
        input.value = '99999';

        await camera.submitToAPI({});

        expect(input.classList.contains('is-invalid')).toBe(true);
        expect(feedback.textContent).toBe('Conta de alarme inexistente. Verifique o número informado.');
        expect(window.showErrorModal).toHaveBeenCalledWith(
            'Conta de alarme inexistente',
            'Conta de alarme inexistente. Verifique o número informado.'
        );
    });
});
