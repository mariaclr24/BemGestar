async function carregarUtentes() {
  try {
    const filtro = document.getElementById('filtro').value.trim();
    let url = `/api/utentes`;
    if (filtro) url += `?q=${encodeURIComponent(filtro)}`;

    const resp = await fetch(url, { credentials: 'include' });
    if (!resp.ok) throw new Error('Erro ao carregar utentes');

    const utentes = await resp.json();

    const container = document.getElementById('utentesContainer');
    container.innerHTML = '';

    if (utentes.length === 0) {
      container.innerHTML = '<p class="text-muted">Nenhum utente encontrado.</p>';
      return;
    }

    utentes.forEach(u => {
      const item = document.createElement('div');
      item.className = 'list-group-item mb-3';

      item.innerHTML = `
        <h5>${u.nome} <small class="text-muted">(${u.email})</small></h5>
        <p>
          <strong>Data de Nascimento:</strong> ${new Date(u.data_nascimento).toLocaleDateString()}<br/>
          <strong>Idade:</strong> ${u.idade} anos<br/>
          <strong>Estado:</strong> ${u.estado || '-'}<br/>
          <strong>Semanas de Gestação:</strong> ${u.semanas_gestacao || '-'}<br/>
          <strong>NIF:</strong> ${u.nif || '-'}<br/>
          <strong>Contacto:</strong> ${u.contacto || '-'}<br/>
          <strong>Contacto Emergência:</strong> ${u.contacto_emergencia || '-'}
        </p>
        <p>
          <strong>Terapias Permitidas:</strong>
          <ul>
            ${u.terapias_permitidas.map(t => `<li>${t.nome_terapia} (${t.tipo})</li>`).join('') || '<li>Sem terapias associadas</li>'}
          </ul>
        </p>
      `;

      container.appendChild(item);
    });

  } catch (err) {
    console.error(err);
    document.getElementById('utentesContainer').innerHTML = '<p class="text-danger">Erro ao carregar utentes.</p>';
  }
}

document.getElementById('filtro').addEventListener('input', carregarUtentes);
carregarUtentes();
