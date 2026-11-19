/**
 * Realce de erro no campo de conta de alarme.
 * Usado por cadastro/edição de câmeras e pelo cadastro de alarmes.
 */

const FEEDBACK_PADRAO = 'alarmeContaFeedback';

/** Marca o campo em vermelho e mostra a mensagem no feedback Bootstrap. */
export function marcarContaInvalida(
    input: HTMLInputElement | null,
    mensagem: string,
    feedbackId: string = FEEDBACK_PADRAO
): void {
    if (!input) return;

    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');

    const feedback = document.getElementById(feedbackId);
    if (feedback) {
        feedback.textContent = mensagem;
    }
}

/** Remove o realce de erro. Chamado ao corrigir o valor ou ao desativar o alarme. */
export function limparContaInvalida(input: HTMLInputElement | null): void {
    if (!input) return;

    input.classList.remove('is-invalid');
    input.removeAttribute('aria-invalid');
    if (input.value.trim()) {
        input.classList.add('is-valid');
    }
}

/** Valida o formato numérico da conta. Retorna a mensagem de erro, ou null se válida. */
export function validarFormatoConta(valor: string): string | null {
    const conta = valor.trim();

    if (conta === '') {
        return 'Informe a conta do alarme.';
    }

    if (!/^\d+$/.test(conta)) {
        return 'Conta de alarme inexistente. Informe apenas números.';
    }

    return null;
}
