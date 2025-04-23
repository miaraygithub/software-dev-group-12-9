
//js script to allow the event sidebar to expand. will probably need alterations once map API implemented.
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('expandSidebarBtn');
  const icon = document.getElementById('expandIcon')
  const dateFilter = document.getElementById("date-filter-container");

  let expanded = false;

  btn.addEventListener('click', () => {
    expanded = !expanded;
    sidebar.classList.toggle('expanded', expanded);
    icon.classList.toggle('fa-circle-chevron-right', !expanded);
    icon.classList.toggle('fa-circle-chevron-left', expanded);
    // TO DO: fix so margin is not fixed so it changes with screen size
    dateFilter.style.marginLeft = expanded ? '700px' : '330px'; // move date filter dropdown when expanded
  });
});