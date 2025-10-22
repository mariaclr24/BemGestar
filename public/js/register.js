let codigoValidado = false;

function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
}

document.getElementById('formValidar').addEventListener('submit', async function (e) {
  e.preventDefault();
  const codigo = document.getElementById('codigo').value.trim();
  const msg = document.getElementById('mensagem');
  msg.innerHTML = "";

  try {
    const resp = await fetch(`/api/validar-codigo/${codigo}`);
    const result = await resp.json();

    if (!resp.ok) {
      msg.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
      document.getElementById('formRegisto').style.display = "none";
      codigoValidado = false;
      return;
    }

    const a = result.avaliacao;
    document.getElementById('nome').value = a.nome;
    document.getElementById('email').value = a.email;
    document.getElementById('nif').value = a.nif;
    document.getElementById('data_nascimento').value = a.data_nascimento.slice(0, 10);
    document.getElementById('estado').value = a.estado;
    document.getElementById('semanas').value = a.semanas_gestacao || '';

    document.getElementById('formRegisto').style.display = "block";
    msg.innerHTML = `<div class="alert alert-success">Código validado. Confirme ou edite os dados e complete o registo.</div>`;
    codigoValidado = true;

    document.getElementById('estado').dispatchEvent(new Event('change'));
  } catch (err) {
    msg.innerHTML = `<div class="alert alert-danger">Erro ao validar código.</div>`;
  }
});

document.getElementById('estado').addEventListener('change', function () {
  const semanasField = document.getElementById('semanas');
  if (this.value === 'Pós-parto') {
    semanasField.value = '';
    semanasField.disabled = true;
    semanasField.required = false;
  } else {
    semanasField.disabled = false;
    semanasField.required = true;
  }
});

document.getElementById('formRegisto').addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!codigoValidado) {
    alert("Valide primeiro o código de acesso.");
    return;
  }

  const body = {
    codigo: document.getElementById('codigo').value.trim(),
    senha: document.getElementById('password').value,
    contacto: document.getElementById('contacto').value.trim(),
    contacto_emergencia: document.getElementById('emergencia').value.trim()
  };

  try {
    const resp = await fetch('/api/registar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await resp.json();

    const msg = document.getElementById('mensagem');
    if (resp.ok) {
      msg.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
      setTimeout(() => window.location.href = 'login.html', 2000);
    } else {
      msg.innerHTML = `<div class="alert alert-danger">${result.error}</div>`;
    }
  } catch (err) {
    document.getElementById('mensagem').innerHTML = `<div class="alert alert-danger">Erro ao registar.</div>`;
  }
});
