let chartInstances = {};

document.addEventListener("DOMContentLoaded", () => {
    if (!window.loadedPosts) return;

    window.loadedPosts.forEach(poll => {
        const canvas = document.getElementById(`chart-${poll._id}`);
        if (canvas) {
            renderPollChart(poll._id, getDefaultChartType(poll._id));
        }
    });

    const svgIcons = document.querySelectorAll(".svg-icon");

    svgIcons.forEach(icon => {
        icon.style.top = Math.floor(Math.random() * 90) + "vh";   // Random vertical position
        icon.style.left = Math.floor(Math.random() * 90) + "vw";  // Random horizontal position
        icon.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`; // Random rotation
    });
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("toggle-chart")) {
        const postId = e.target.dataset.postId;
        const canvas = document.getElementById(`chart-${postId}`);
        const controls = document.querySelector(`[data-controls-id="${postId}"]`);
        canvas.classList.toggle("d-none");
        controls.classList.toggle("d-none");

        if (!chartInstances[postId]) {
            const defaultType = getDefaultChartType(postId);
            renderPollChart(postId, defaultType);
        }
    }

    if (e.target.classList.contains("chart-type-btn")) {
        const type = e.target.dataset.type;
        const chartId = e.target.dataset.chartId;
        const postId = chartId.split("chart-")[1];
        renderPollChart(postId, type);
    }

    const globalChartButtons = document.querySelectorAll('.global-chart-type');

    globalChartButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedType = btn.dataset.type;

            // Update all chart canvases with selected chart type
            window.loadedPosts.forEach(poll => {
                renderPollChart(poll._id, selectedType);
            });

            // Update dropdown label if desired
            document.getElementById('chartTypeDropdown').textContent = `Chart: ${selectedType}`;
        });
    });
});

function getDefaultChartType(postId) {
    const post = window.loadedPosts?.find(p => p._id === postId);
    if (!post) return "bar";

    const optionCount = post.options.length;
    if (optionCount === 4) return "doughnut";
    if (optionCount >= 2 && optionCount <= 3) return "pie";
    return "bar";
}

function renderPollChart(postId, type = "bar") {
    const canvas = document.getElementById(`chart-${postId}`);
    const post = window.loadedPosts?.find(p => p._id === postId);
    if (!post || !canvas) return;

    const ctx = canvas.getContext("2d");
    const labels = post.options.map(o => o.label);
    const data = post.options.map(o => o.votes);

    if (chartInstances[postId]) chartInstances[postId].destroy();

    chartInstances[postId] = new Chart(ctx, {
        type,
        data: {
            labels,
            datasets: [{
                label: '# of Votes',
                data,
                backgroundColor: ['#AEBFF3', '#FAF0A5', '#BEE5B4', '#FAD8E2']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: type !== "bar",
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: type === "bar" ? {
                x: { ticks: { font: { size: 12 } } },
                y: { ticks: { font: { size: 12 } } }
            } : {}
        }
    });
}

