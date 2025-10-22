document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id_aula = params.get('id_aula');
  const token = localStorage.getItem('token');

  if (!id_aula || !token) return;

  try {
    const res = await fetch(`/api/aula/detalhes/${id_aula}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    console.log("DEBUG dados recebidos:", data);

    const dataAula = data.data || data.data_aula || data.data_inicio;

    if (!res.ok || !data || !dataAula) {
      throw new Error("Dados incompletos ou aula não encontrada");
    }

    document.getElementById('infoAula').innerHTML = `
      <p><strong>Data:</strong> ${new Date(dataAula).toLocaleString('pt-PT')}</p>
      <p><strong>Terapia:</strong> ${data.terapia ?? 'Indefinida'}</p>
      <p><strong>Profissional:</strong> ${data.profissional ?? 'Indefinido'}</p>
    `;

    if (data.relatorio) {
      document.getElementById('relatorioAula').innerHTML = `
        <p><strong>Relatório do Profissional:</strong></p>
        <a href="${data.relatorio}" target="_blank" class="btn btn-success">Ver Relatório</a>
      `;
    } else {
      document.getElementById('relatorioAula').innerHTML = `
        <div class="alert alert-info">
          Ainda não foi submetido um relatório profissional.
        </div>
      `;

      // Mostrar o formulário de upload
      document.getElementById('uploadSection').classList.remove('d-none');

      try {
        const biosinalRes = await fetch(`/api/biosinal/check/${id_aula}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const biosinalData = await biosinalRes.json();
        console.log("DEBUG biosinal recebido:", biosinalData);

        if (biosinalData.existe) {
          document.getElementById('biosinal').disabled = true;
          document.getElementById('btnUploadBiosinal').disabled = true;
          document.getElementById('mensagemUpload').innerHTML = `
            <div class="alert alert-info">
              Ficheiro já submetido. O profissional irá avaliar a sua condição.
            </div>
          `;
        } else {
          document.getElementById('biosinal').disabled = false;
          document.getElementById('btnUploadBiosinal').disabled = false;
          document.getElementById('mensagemUpload').innerHTML = '';
        }
      } catch (e) {
        console.error("Erro ao verificar biosinal:", e);
        document.getElementById('mensagemUpload').innerHTML = `
          <div class="alert alert-warning">Erro ao verificar biosinal. Pode tentar enviar mesmo assim.</div>
        `;
        document.getElementById('biosinal').disabled = false;
        document.getElementById('btnUploadBiosinal').disabled = false;
      }
    }

  } catch (err) {
    console.error("Erro ao carregar detalhes:", err);
    document.getElementById('infoAula').innerHTML =
      '<div class="alert alert-danger">Erro ao carregar aula.</div>';
  }
});

async function enviarBiosinal() {
  const params = new URLSearchParams(window.location.search);
  const id_aula = params.get('id_aula');
  const token = localStorage.getItem('token');
  const input = document.getElementById('biosinal');
  const formData = new FormData();

  if (!input.files[0]) {
    document.getElementById('mensagemUpload').textContent = 'Selecione um ficheiro.';
    return;
  }

  formData.append('ficheiro', input.files[0]);
  formData.append('id_aula', id_aula);

  try {
    const res = await fetch('/api/biosinal/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });

    const data = await res.json();

    document.getElementById('mensagemUpload').textContent = data.mensagem || 'Upload feito com sucesso.';
    document.getElementById('mensagemUpload').className = 'text-success';

    document.getElementById('biosinal').disabled = true;
    document.getElementById('btnUploadBiosinal').disabled = true;

    document.getElementById('uploadSection').innerHTML += `
      <div class="alert alert-info mt-3">
        Ficheiro submetido com sucesso. O profissional irá avaliar a sua condição e em breve o relatório estará disponível.
      </div>
    `;

  } catch (err) {
    console.error("Erro no upload:", err);
    try {
      const texto = await res.text();
      console.warn("Resposta inesperada do servidor:", texto);
    } catch (e) {
      console.warn("Não foi possível ler resposta como texto.");
    }

    document.getElementById('mensagemUpload').textContent = 'Erro ao enviar ficheiro.';
    document.getElementById('mensagemUpload').className = 'text-danger';
  }
}
