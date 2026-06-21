const backBtn = document.createElement('div');
backBtn.id = 'backToTop';
backBtn.innerHTML = '↑';
backBtn.style.cssText = `
  position:fixed; bottom:140px; right:20px;
  width:48px; height:48px; border-radius:50%;
  background:rgba(214,51,126,0.35); backdrop-filter:blur(12px);
  border:2px solid rgba(214,51,126,0.55);
  box-shadow:0 0 24px rgba(214,51,126,0.35);
  color:#be185d; font-size:28px; line-height:48px;
  text-align:center; cursor:pointer; z-index:9999;
  transition:all 0.3s; display:none; user-select:none;
`;
document.body.appendChild(backBtn);

window.addEventListener('scroll', () => {
  backBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
});

backBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});