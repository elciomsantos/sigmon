function showErrorModal(title?: string, message?: string): void {
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
        if (titleEl) titleEl.textContent = title || 'Não foi possível concluir';
        if (msgEl) msgEl.textContent = message || 'Ocorreu um erro inesperado.';

        if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Modal && modalEl) {
            const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.show();
        }
    } catch (e) {
        console.warn('showErrorModal fallback:', e);
        if (typeof window.showToast === 'function') {
            window.showToast(message || title || 'Ocorreu um erro inesperado.', 'danger');
        }
    }
}

window.showErrorModal = showErrorModal;
export {};
