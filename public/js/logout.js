document.getElementById('logoutBtn')?.addEventListener('click', function (e) {
  e.preventDefault();
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('userId');
  window.location.href = 'login.html';
});
