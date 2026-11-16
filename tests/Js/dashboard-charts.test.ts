import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Dashboard charts', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not redraw a chart when its data has not changed', async () => {
    vi.resetModules();
    document.body.innerHTML = '<canvas id="statusChart"></canvas>';
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);

    (window as any).Chart = class {
      canvas = canvas;
      data: unknown;
      update = vi.fn();
      destroy = vi.fn();

      constructor(_context: unknown, config: { data: unknown }) {
        this.data = config.data;
      }
    };

    await import('../../src/assets/js/modules/dashboard-charts');
    const manager = new (window as any).ChartManager();
    const options = {
      plugins: {
        centerText: { text: 'Total\n3', size: 16 },
      },
    };
    const data = {
      labels: ['Funcionando', 'Paradas'],
      datasets: [{ data: [2, 1], backgroundColor: ['#27ae60', '#e74c3c'] }],
    };

    manager.createChart('statusChart', 'doughnut', data, options);
    const chart = manager.charts.get('statusChart');
    manager.createChart('statusChart', 'doughnut', structuredClone(data), options);

    expect(chart.update).not.toHaveBeenCalled();

    manager.createChart(
      'statusChart',
      'doughnut',
      { ...data, datasets: [{ ...data.datasets[0], data: [1, 2] }] },
      options,
    );
    expect(chart.update).toHaveBeenCalledWith('none');
  });
});
