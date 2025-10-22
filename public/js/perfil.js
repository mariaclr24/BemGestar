 const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("Sessão expirada. Faça login novamente.");
      window.location.href = "login.html";
    }

    async function carregarPerfil() {
      try {
        const res = await fetch(`/api/utilizador/${userId}`);
        const dados = await res.json();

        document.getElementById('nome').textContent = dados.nome;
        document.getElementById('email').textContent = dados.email;
        document.getElementById('data_nascimento').textContent = new Date(dados.data_nascimento).toLocaleDateString();
        document.getElementById('nif').textContent = dados.nif || '-';
        document.getElementById('estado').textContent = dados.estado || '-';
        document.getElementById('semanas').textContent = dados.semanas_gestacao || '-';
        document.getElementById('saldo').textContent = Number(dados.saldo).toFixed(2);
        document.getElementById('contacto').textContent = dados.contacto || '-';
        document.getElementById('emergencia').textContent = dados.contacto_emergencia || '-';

        document.getElementById('editNome').value = dados.nome;
        document.getElementById('editEmail').value = dados.email;
        document.getElementById('editContacto').value = dados.contacto || '';
        document.getElementById('editEmergencia').value = dados.contacto_emergencia || '';
      } catch {
        alert("Erro ao carregar perfil.");
      }
    }

    function mostrarEdicao() {
      document.getElementById('edicaoCampos').classList.toggle('d-none');
    }

    async function guardarEdicoes() {
      const dados = {
        nome: document.getElementById('editNome').value.trim(),
        email: document.getElementById('editEmail').value.trim(),
        contacto: document.getElementById('editContacto').value.trim(),
        contacto_emergencia: document.getElementById('editEmergencia').value.trim()
      };

      const msg = document.getElementById('mensagemPerfil');

      try {
        const res = await fetch(`/api/utilizador/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados)
        });

        const result = await res.json();
        if (res.ok) {
          msg.innerHTML = '<div class="alert alert-success">Dados atualizados com sucesso.</div>';
          carregarPerfil();
        } else {
          msg.innerHTML = `<div class="alert alert-danger">${result.error || 'Erro ao atualizar.'}</div>`;
        }
      } catch {
        msg.innerHTML = '<div class="alert alert-danger">Erro ao comunicar com o servidor.</div>';
      }
    }

    async function alterarSenha() {
    const atual = document.getElementById("senhaAtual").value.trim();
    const nova = document.getElementById("senhaNova").value.trim();
    const confirmar = document.getElementById("senhaConfirmar").value.trim();
    const msg = document.getElementById("mensagemSenha");

    msg.innerHTML = ''; // Limpar mensagens anteriores

    if (!atual || !nova || !confirmar) {
      msg.innerHTML = '<div class="alert alert-warning">⚠️ Preencha todos os campos da palavra-passe.</div>';
      return;
    }

    if (nova !== confirmar) {
      msg.innerHTML = '<div class="alert alert-danger">❌ As novas palavras-passe não coincidem.</div>';
      return;
    }

    try {
      const res = await fetch(`/api/utilizador/${userId}/senha`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual: atual,
          novaSenha: nova
        })
      });

      const result = await res.json();

      if (res.ok) {
        msg.innerHTML = '<div class="alert alert-success">✅ Palavra-passe alterada com sucesso!</div>';
        document.getElementById("senhaAtual").value = '';
        document.getElementById("senhaNova").value = '';
        document.getElementById("senhaConfirmar").value = '';
      } else {
        msg.innerHTML = `<div class="alert alert-danger">❌ ${result.error || "Erro ao alterar a palavra-passe."}</div>`;
      }

    } catch (err) {
      console.error("Erro:", err);
      msg.innerHTML = '<div class="alert alert-danger">❌ Erro ao comunicar com o servidor.</div>';
    }
  }

    async function carregarTerapias() {
      try {
        const res = await fetch(`/api/terapias-utente/${userId}`);
        const terapias = await res.json();
        const container = document.getElementById('listaTerapias');

        if (!terapias.length) {
          container.innerHTML = '<p class="text-muted">Sem terapias avaliadas.</p>';
          return;
        }

        const grupos = { recomendada: [], nao_recomendada: [], proibida: [] };
        terapias.forEach(t => grupos[t.tipo]?.push(t.nome_terapia));

        container.innerHTML = `
          <h5 class="text-success">✅ Recomendadas</h5>
          <ul>${grupos.recomendada.map(t => `<li>${t}</li>`).join('') || '<li>Nenhuma</li>'}</ul>
          <h5 class="text-warning">⚠️ Não Recomendadas</h5>
          <ul>${grupos.nao_recomendada.map(t => `<li>${t}</li>`).join('') || '<li>Nenhuma</li>'}</ul>
          <h5 class="text-danger">⛔ Proibidas</h5>
          <ul>${grupos.proibida.map(t => `<li>${t}</li>`).join('') || '<li>Nenhuma</li>'}</ul>
        `;
      } catch {
        document.getElementById('listaTerapias').innerHTML = '<p class="text-danger">Erro ao carregar terapias.</p>';
      }
    }

    carregarPerfil();
    carregarTerapias();