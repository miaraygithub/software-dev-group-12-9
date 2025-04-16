
//js script to allow the event sidebar to expand. will probably need alterations once map API implemented.
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const mapContainer = document.getElementById('map-container');
  const btn = document.getElementById('expandSidebarBtn');

  let expanded = false;

  btn.addEventListener('click', () => {
    if (expanded) {
      btn.textContent = 'Expand';
    } else {
      btn.textContent = 'Collapse';
    }

    expanded = !expanded;
    sidebar.classList.toggle('expanded', expanded);
  });
});