if (localStorage.getItem('loggedIn') !== 'true') {
  alert('Você precisa fazer login para acessar esta página.');
  window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
}
