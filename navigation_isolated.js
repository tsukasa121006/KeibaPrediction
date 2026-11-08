
document.addEventListener('DOMContentLoaded', () => {
    const predictionPage = document.getElementById('prediction-page');
    const practiceFrame = document.getElementById('practice-frame');
    const practiceButton = document.getElementById('btn-practice');
    const chuoButton = document.getElementById('btn-chuo');
    if (!predictionPage || !practiceFrame || !practiceButton || !chuoButton) return;

    practiceButton.addEventListener('click', () => {
        predictionPage.hidden = true;
        practiceFrame.hidden = false;
        practiceButton.classList.add('active');
        chuoButton.classList.remove('active');
    });

    chuoButton.addEventListener('click', () => {
        practiceFrame.hidden = true;
        predictionPage.hidden = false;
        practiceButton.classList.remove('active');
        chuoButton.classList.add('active');
    });
});
