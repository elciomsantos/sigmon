/**
 * Exibe um erro ao usuario mesmo quando o Bootstrap JS nao foi carregado.
 * Usa elementos criados via DOM (textContent) para evitar injecao de HTML.
 */
function showFallbackErrorModal(title: string, message: string): void {
    document.getElementById('modalErroSistemaFallback')?.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modalErroSistemaFallback';
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText =
        'position:fixed;inset:0;z-index:20000;display:flex;align-items:center;' +
        'justify-content:center;background:rgba(0,0,0,.45);padding:16px';

    const box = document.createElement('div');
    box.style.cssText =
        'background:#fff;border-radius:10px;max-width:420px;width:100%;padding:22px;' +
        'box-shadow:0 10px 40px rgba(0,0,0,.25);font-family:inherit';

    const heading = document.createElement('h5');
    heading.className = 'text-danger fw-bold mb-2';
    heading.textContent = title;

    const text = document.createElement('p');
    text.className = 'text-dark mb-3';
    text.textContent = message;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-danger';
    button.textContent = 'OK';

    const close = (): void => {
        overlay.remove();
        document.removeEventListener('keydown', onKeyDown);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            close();
        }
    };

    button.addEventListener('click', close);
    overlay.addEventListener('click', (event: MouseEvent) => {
        if (event.target === overlay) {
            close();
        }
    });
    document.addEventListener('keydown', onKeyDown);

    box.append(heading, text, button);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    button.focus();
}

function showErrorModal(title?: string, message?: string): void {
    const titulo = title || 'Não foi possível concluir';
    const mensagem = message || 'Ocorreu um erro inesperado.';

    try {
        let modalEl = document.getElementById('modalErroSistema');
        if (!modalEl) {
            const div = document.createElement('div');
            div.innerHTML = [
                '<div class="modal fade" id="modalErroSistema" tabindex="-1" data-bs-backdrop="static">',
                '<div class="modal-dialog modal-dialog-centered">',
                '<div class="modal-content border-0">',
                '<div class="modal-body py-4">',
                '<div class="d-flex align-items-center gap-3">',
                '<div><span class="error-icon"><i class="fas fa-exclamation-circle fa-3x text-danger"></i></span></div>',
                '<div class="flex-grow-1">',
                '<h5 class="fw-bold mb-1" id="erroModalTitle">Não foi possível concluir</h5>',
                '<p class="text-muted mb-0" id="erroModalMessage">Ocorreu um erro inesperado.</p>',
                '</div>',
                '<button type="button" class="btn btn-danger px-3 flex-shrink-0" data-bs-dismiss="modal"><i class="fas fa-times me-2"></i>OK</button>',
                '</div></div></div></div></div>'
            ].join('\n');
            const firstChild = div.firstElementChild;
            if (firstChild) document.body.appendChild(firstChild);
            modalEl = document.getElementById('modalErroSistema');
        }

        const titleEl = document.getElementById('erroModalTitle');
        const msgEl = document.getElementById('erroModalMessage');
        if (titleEl) titleEl.textContent = titulo;
        if (msgEl) msgEl.textContent = mensagem;

        if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal && modalEl) {
            const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
            return;
        }
    } catch (e) {
        console.warn('showErrorModal fallback:', e);
    }

    // Sem Bootstrap (ou falha ao abrir o modal): nunca deixar o erro silencioso.
    if (typeof window.showToast === 'function') {
        window.showToast(mensagem, 'danger');
    } else {
        showFallbackErrorModal(titulo, mensagem);
    }
}

window.showErrorModal = showErrorModal;
export {};
