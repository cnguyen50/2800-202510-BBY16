  const svgIcons = document.querySelectorAll(".svg-icon");

  svgIcons.forEach(icon => {
    icon.style.top = Math.floor(Math.random() * 90) + "vh";   // Random vertical position
    icon.style.left = Math.floor(Math.random() * 90) + "vw";  // Random horizontal position
    icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`; // Random rotation

  });