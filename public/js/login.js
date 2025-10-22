document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guarda o token JWT e outros dados no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.id_utilizador);
      localStorage.setItem('userType', data.tipo_utilizador);
      localStorage.setItem('loggedIn', 'true'); // <--- adicionar esta linha

      // Redireciona o utilizador conforme o tipo
      if (data.tipo_utilizador === 'administrador') {
        window.location.href = 'dashboard_admin.html';
      } else if (data.tipo_utilizador === 'profissional') {
        window.location.href = 'dashboard_ps.html';
      } else {
        window.location.href = 'dashboard_cliente.html';
      }
    } else {
      alert(data.error || 'Credenciais inválidas');
    }
  } catch (err) {
    console.error('Erro na requisição:', err);
    alert('Erro de rede. Tente novamente.');
  }
});
