// Tab navigation
document.addEventListener('DOMContentLoaded', function() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const moduleContents = document.querySelectorAll('.module-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.dataset.tab;

      // Remove active class from all tabs and content
      tabButtons.forEach(btn => btn.classList.remove('active'));
      moduleContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab and corresponding content
      this.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
});
