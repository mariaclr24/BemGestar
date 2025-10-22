document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formAvaliacaoSessao');
  const msg = document.getElementById('mensagem');
  const graficoDiv = document.getElementById('grafico');
  const tabelaDiv = document.getElementById('tabela');

  const params = new URLSearchParams(window.location.search);
  const id_utilizador = params.get('id_utilizador');
  const id_aula = params.get('id_aula');

  document.getElementById('id_utilizador').value = id_utilizador || '';
  document.getElementById('id_aula').value = id_aula || '';

  const token = localStorage.getItem('token');

  // ⚡ Verifica se já existe biosinal e faz a análise automática
  async function tentarAnalisarBiosinal() {
    try {
      const resCheck = await fetch(`/api/biosinal/check/${id_aula}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { existe } = await resCheck.json();
      if (existe) {
        console.log('[INFO] Biosinal existente. A executar análise...');
        const resAnalise = await fetch(`/api/biosinal/analise/${id_aula}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataAnalise = await resAnalise.json();

        if (dataAnalise.grafico) {
          graficoDiv.innerHTML = `<img src="${dataAnalise.grafico}" class="img-fluid mt-3">`;
        }

        if (dataAnalise.tabela) {
          const tabelaRes = await fetch(dataAnalise.tabela);
          const csvText = await tabelaRes.text();

          const linhas = csvText.trim().split('\n');
          const [cabecalho, ...dados] = linhas.map(l => l.split(';'));

          const tabelaHTML = `
            <table class="table table-bordered mt-4">
              <thead><tr>${cabecalho.map(col => `<th>${col}</th>`).join('')}</tr></thead>
              <tbody>${dados.map(l => `<tr>${l.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          `;

          tabelaDiv.innerHTML = tabelaHTML;
        }
      }
    } catch (err) {
      console.warn('[Erro ao verificar/analisar biosinal]', err);
    }
  }

  // Executar ao carregar
  tentarAnalisarBiosinal();

  // SUBMISSÃO DA AVALIAÇÃO
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const ficheiro = document.getElementById('ficheiro').files[0];
    const formData = new FormData();

    formData.append('ficheiro', ficheiro);
    formData.append('id_utilizador', id_utilizador);
    formData.append('id_aula', id_aula);

    try {
      const res = await fetch('/api/avaliacao-sessao/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();

      msg.textContent = data.mensagem || data.erro || 'Erro desconhecido.';
      msg.className = res.ok ? 'text-success' : 'text-danger';

    } catch (err) {
      console.error('[Erro ao enviar avaliação]', err);
      msg.textContent = 'Erro ao enviar ficheiro.';
      msg.className = 'text-danger';
    }
  });
});
