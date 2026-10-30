const links = document.querySelectorAll('nav a[href^="#"]');

links.forEach((link) => {
  link.addEventListener('click', () => {
    link.blur();
  });
});

const filtro = document.querySelector('#filtro-feed');
const publicacoes = document.querySelectorAll('.publicacao');

if (filtro) {
  filtro.addEventListener('change', () => {
    publicacoes.forEach((publicacao) => {
      const categoria = publicacao.querySelector('small').textContent;
      const mostrar = filtro.value === 'todas' || categoria.startsWith(filtro.value);
      publicacao.hidden = !mostrar;
    });
  });
}
