const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

loadSpritesheet(() => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
