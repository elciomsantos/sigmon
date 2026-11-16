import { afterEach, describe, expect, it, vi } from 'vitest';

const createPayload = (total: number) => ({
  success: true,
  data: {
    stats: {
      total,
      ativas: 2,
      manutencao: 1,
      desativadas: 0,
      atrasada: 0,
      uptime: 95,
    },
    status_data: [],
    camera_tipo_data: [],
    alarm_status_data: [],
    manutencoes: [{
      data_hora: '2026-01-01 10:00:00',
      camera_nome: 'Câmera 1',
      status: 'Concluída',
      serie_mac: 'ABC',
      tecnico_responsavel: 'Técnico',
      descricao: 'Manutenção preventiva',
    }],
  },
});

describe('HomeDashboard refresh', () => {
  afterEach(() => {
    const dashboard = (window as any).homeDashboard;
    if (dashboard?.destroy) dashboard.destroy();
    delete (window as any).homeDashboard;
    vi.restoreAllMocks();
  });

  it('updates changed values without flashing cards or rebuilding unchanged activity rows', async () => {
    vi.resetModules();
    document.body.innerHTML = `
      <div class="stat-card"><span id="total-cameras">0</span></div>
      <span id="active-cameras">0</span>
      <span id="manutencao-cameras">0</span>
      <span id="desativadas-cameras">0</span>
      <span id="alerts-count">0</span>
      <span id="uptime-percentual"></span>
      <span id="progress-label"></span>
      <span id="progress-bar"></span>
      <span id="progress-cameras"></span>
      <span id="progress-total"></span>
      <span id="status-ativas"></span>
      <span id="status-manutencao"></span>
      <span id="status-desativadas"></span>
      <div id="alertaAtraso"></div>
      <span id="alertaAtrasoCount"></span>
      <div id="recent-activities-body"></div>`;
    Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' });

    class DashboardCoreMock {
      data: unknown = null;
      updateInterval: number | null = null;
      animateCounter = vi.fn((element: HTMLElement, _start: number, end: number) => {
        element.textContent = String(end);
      });
      fetchData = vi.fn().mockResolvedValue(createPayload(5));
    }

    (window as any).DashboardCore = DashboardCoreMock;
    (window as any).ChartManager = class {
      updateCameraStatusChart = vi.fn();
      updateCameraTypeChart = vi.fn();
      updateAlarmStatusChart = vi.fn();
    };
    (window as any).APP_API_BASE = '/';

    await import('../../src/assets/js/home_dashboard');
    const dashboard = (window as any).homeDashboard;
    await vi.waitFor(() => expect(dashboard.data).not.toBeNull());

    const activities = document.getElementById('recent-activities-body')!;
    const originalRow = activities.querySelector('tbody tr');
    dashboard.animateCounter.mockClear();
    dashboard.updateUI();
    expect(dashboard.animateCounter).not.toHaveBeenCalled();
    expect(activities.querySelector('tbody tr')).toBe(originalRow);

    dashboard.data = createPayload(6);
    dashboard.updateUI();
    expect(dashboard.animateCounter).toHaveBeenCalledWith(
      document.getElementById('total-cameras'),
      5,
      6,
      300,
    );

    let resolveRefresh!: (payload: ReturnType<typeof createPayload>) => void;
    dashboard.fetchData = vi.fn(() => new Promise(resolve => {
      resolveRefresh = resolve;
    }));
    const refresh = dashboard.loadData();
    expect(document.querySelector('.stat-card')?.classList.contains('is-loading')).toBe(false);
    resolveRefresh(createPayload(7));
    await refresh;
  });
});
