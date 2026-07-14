(function () {
  document.getElementById('trackingForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const token = new FormData(event.currentTarget).get('token').trim();
    if (token) location.href = `/pesanan/?token=${encodeURIComponent(token)}`;
  });
})();
